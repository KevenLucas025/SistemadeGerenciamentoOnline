import json
from decimal import Decimal
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST
from django.template.loader import render_to_string
from django.utils import timezone
from produtos.models import Produto, SaidaProduto, HistoricoProduto
from openpyxl import Workbook
from openpyxl.utils import get_column_letter
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from django.http import HttpResponse
from produtos.models import HistoricoProduto
import csv
from io import BytesIO
from xhtml2pdf import pisa
from django.views.decorators.http import require_http_methods
from django.core.cache import cache
from datetime import datetime

CACHE_KEY_HISTORICO_PAUSADO = "historico_atividades_produtos_pausado"


def calcular_totais(quantidade, valor_unitario, desconto):
    """Calcula o total sem desconto e o total com desconto com precisão decimal."""
    qtd = Decimal(str(quantidade))
    v_unit = Decimal(str(valor_unitario))
    desc = Decimal(str(desconto or 0))

    total_sem = qtd * v_unit
    total_com = total_sem * (Decimal('1') - (desc / Decimal('100')))
    return round(total_sem, 2), round(total_com, 2)


@login_required
def estoque_view(request):
    """
    Tabela de Estoque: produtos disponíveis com quantidade > 0.
    Tabela de Saída: registros da model SaidaProduto ordenados por data decrescente.
    """
    produtos_estoque = Produto.objects.filter(
        quantidade__gt=0
    ).select_related('criado_por', 'cliente').order_by('-id')

    saidas = SaidaProduto.objects.select_related(
        'produto', 'criado_por', 'produto__cliente'
    ).order_by('-id')

    contexto = {
        'produtos': produtos_estoque,
        'saidas': saidas,
    }
    return render(request, 'estoque.html', contexto)


@login_required
@require_GET
def atualizar_tabela_estoque_status(request):
    """
    Endpoint AJAX para recarregar as linhas em HTML de 'estoque' ou 'saida'.
    """
    tipo = request.GET.get('tipo', 'estoque').lower()

    if tipo == 'saida':
        saidas = SaidaProduto.objects.select_related(
            'produto', 'criado_por', 'produto__cliente'
        ).order_by('-id')

        html_linhas = render_to_string(
            'estoque/linhas_tabela_saidas.html',
            {'saidas': saidas},
            request=request
        )
        total = saidas.count()
    else:
        produtos = Produto.objects.filter(
            quantidade__gt=0
        ).select_related('criado_por', 'cliente').order_by('-id')

        html_linhas = render_to_string(
            'estoque/linhas_tabela_estoque.html',
            {'produtos': produtos},
            request=request
        )
        total = produtos.count()

    return JsonResponse({
        'sucesso': True,
        'tipo': tipo,
        'total': total,
        'html': html_linhas
    })


@login_required
@require_POST
def gerar_saida_produto(request, produto_id):
    """
    Subtrai a quantidade do Produto original, recalcula seus totais,
    cria a fatia correspondente em SaidaProduto e grava no Histórico.
    A DATA DE SAÍDA É IMUTÁVEL: uma vez definida a primeira vez, nunca mais é alterada.
    """
    try:
        dados = json.loads(request.body)
        qtd_solicitada = int(dados.get('quantidade', 1))

        produto = get_object_or_404(Produto, id=produto_id)

        if qtd_solicitada <= 0 or qtd_solicitada > produto.quantidade:
            return JsonResponse({
                'sucesso': False, 
                'mensagem': f'Quantidade inválida. Disponível: {produto.quantidade}.'
            }, status=400)

        # 1. Regra da Data de Saída Imutável:
        # Se o produto já teve saída em algum momento da vida dele, preserva a data original;
        # se for a primeira saída, define o momento atual.
        data_saida_definitiva = produto.data_saida or timezone.now()

        # 2. Subtrai a quantidade do produto no estoque e recalcula os totais
        nova_qtd_estoque = produto.quantidade - qtd_solicitada
        tot_sem_estoque, tot_com_estoque = calcular_totais(
            nova_qtd_estoque, produto.valor_unitario, produto.desconto
        )

        dados_up = {
            'quantidade': nova_qtd_estoque,
            'status_saida': 1,  # Mantém permanentemente 1 - Gerado Saída
            'data_saida': data_saida_definitiva,  # Não altera se já existia
        }
        if hasattr(produto, 'valor_total'):
            dados_up['valor_total'] = tot_com_estoque
        if hasattr(produto, 'total_com_desconto'):
            dados_up['total_com_desconto'] = tot_com_estoque
        if hasattr(produto, 'total_sem_desconto'):
            dados_up['total_sem_desconto'] = tot_sem_estoque

        Produto.objects.filter(id=produto.id).update(**dados_up)

        # 3. Cria o registro na tabela de saídas usando a data_saida definitiva
        tot_sem_saida, tot_com_saida = calcular_totais(
            qtd_solicitada, produto.valor_unitario, produto.desconto
        )

        SaidaProduto.objects.create(
            produto=produto,
            quantidade=qtd_solicitada,
            valor_unitario=produto.valor_unitario,
            desconto=produto.desconto,
            total_sem_desconto=tot_sem_saida,
            total_com_desconto=tot_com_saida,
            data_saida=data_saida_definitiva,  # Salva com a data original congelada
            criado_por=request.user
        )
        
        

        # 4. Registra auditoria no histórico apenas se a gravação NÃO estiver pausada
        esta_pausado = cache.get(CACHE_KEY_HISTORICO_PAUSADO, False)
        if not esta_pausado:
            HistoricoProduto.objects.create(
                produto=produto,
                nome_produto=produto.nome,
                acao='SAIDA',
                descricao=f'Saída registrada de {qtd_solicitada} unidade(s). Código: {produto.codigo}',
                usuario=request.user
            )

        return JsonResponse({
            'sucesso': True, 
            'mensagem': f'Saída de {qtd_solicitada} unidade(s) gerada com sucesso!'
        })

    except Exception as e:
        return JsonResponse({
            'sucesso': False, 
            'mensagem': f'Erro ao processar saída: {str(e)}'
        }, status=500)


@login_required
@require_POST
def gerar_estorno_produto(request, produto_id):
    """
    Devolve e SOMA a quantidade estornada diretamente no Produto original,
    recalcula os totais e abate ou exclui da model SaidaProduto.
    """
    try:
        dados = json.loads(request.body)
        qtd_estorno = int(dados.get('quantidade', 1))

        # produto_id refere-se ao ID da linha em SaidaProduto
        saida_item = get_object_or_404(
            SaidaProduto.objects.select_related('produto'), 
            id=produto_id
        )
        produto_original = saida_item.produto

        if qtd_estorno <= 0 or qtd_estorno > saida_item.quantidade:
            return JsonResponse({
                'sucesso': False, 
                'mensagem': f'Quantidade de estorno inválida. Disponível para estorno: {saida_item.quantidade}.'
            }, status=400)

        # 1. Soma de volta a quantidade no produto original do estoque
        nova_qtd_estoque = produto_original.quantidade + qtd_estorno
        tot_sem_est, tot_com_est = calcular_totais(
            nova_qtd_estoque, produto_original.valor_unitario, produto_original.desconto
        )

        dados_up = {
            'quantidade': nova_qtd_estoque,
            'status_saida': 1  # Mantém eternamente 1 - Gerado Saída
        }
        if hasattr(produto_original, 'valor_total'):
            dados_up['valor_total'] = tot_com_est
        if hasattr(produto_original, 'total_com_desconto'):
            dados_up['total_com_desconto'] = tot_com_est
        if hasattr(produto_original, 'total_sem_desconto'):
            dados_up['total_sem_desconto'] = tot_sem_est

        Produto.objects.filter(id=produto_original.id).update(**dados_up)

        # 2. Desconta ou apaga o registro na tabela de saída
        if qtd_estorno < saida_item.quantidade:
            nova_qtd_saida = saida_item.quantidade - qtd_estorno
            tot_sem_s, tot_com_s = calcular_totais(
                nova_qtd_saida, saida_item.valor_unitario, saida_item.desconto
            )
            SaidaProduto.objects.filter(id=saida_item.id).update(
                quantidade=nova_qtd_saida,
                total_sem_desconto=tot_sem_s,
                total_com_desconto=tot_com_s
            )
        else:
            saida_item.delete()

        # 3. Registra auditoria no histórico (apenas se não estiver pausado)
        esta_pausado = cache.get(CACHE_KEY_HISTORICO_PAUSADO, False)
        if not esta_pausado:
            HistoricoProduto.objects.create(
                produto=produto_original,
                nome_produto=produto_original.nome,
                acao='ESTORNO',
                descricao=f'Estorno efetuado de {qtd_estorno} unidade(s). Código: {produto_original.codigo}',
                usuario=request.user
            )

        return JsonResponse({
            'sucesso': True, 
            'mensagem': f'Estorno de {qtd_estorno} unidade(s) realizado com sucesso!'
        })

    except Exception as e:
        return JsonResponse({
            'sucesso': False, 
            'mensagem': f'Erro ao processar estorno: {str(e)}'
        }, status=500)


@login_required
@require_GET
def carregar_historico_produtos(request):
    """
    Retorna as linhas do modal de histórico via AJAX.
    """
    try:
        historicos = HistoricoProduto.objects.select_related('usuario').all()[:100]
        html = render_to_string(
            'estoque/linhas_tabela_historico_produtos.html',
            {'historicos': historicos},
            request=request
        )
        return JsonResponse({
            'sucesso': True, 
            'html': html, 
            'total': historicos.count()
        })
    except Exception as e:
        return JsonResponse({
            'sucesso': False, 
            'mensagem': f'Erro ao carregar histórico: {str(e)}'
        }, status=500)
        
@login_required
@require_POST
def apagar_historico_produtos(request):
    try:
        dados = json.loads(request.body)
        ids_para_apagar = dados.get('ids',[])
        
        if not ids_para_apagar or not isinstance(ids_para_apagar, list):
            return JsonResponse({
                'sucesso': False,
                'mensagem': 'Nenhum histórico selecionado para exclusão.'
            }, status=400)
        deletados, _ = HistoricoProduto.objects.filter(id__in=ids_para_apagar).delete()
        
        if deletados == 0:
            return JsonResponse({
                'sucesso': False,
                'mensagem': 'Nenhum registro correspondente foi encontrado.'
            })
        msg = (
            "Histórico apagado com sucesso!"
            if deletados == 1
                else f"{deletados} histórico apagados com sucesso!"
        )
        
        return JsonResponse({
            'sucesso': True,
            'mensagem': msg,
            'total_deletados': deletados
        })
        
    except Exception as e:
        return JsonResponse({
            'sucesso': False,
            'mensagem': f'Erro ao apagados o históricos: {str(e)}'
        }, status=500)
        
def _obter_queryset_historico_produtos(request):
    """
    Filtra os IDs caso venham na query string (?ids=1,2,3),
    senão retorna todo o histórico.
    """
    ids_param = request.GET.get('ids', '').strip()
    qs = HistoricoProduto.objects.all().select_related('usuario').order_by('-data_hora')
    
    if ids_param:
        ids = [int(i) for i in ids_param.split(',') if i.isdigit()]
        if ids:
            qs = qs.filter(id__in=ids)
    return qs
    
@login_required
@require_GET
def exportar_historico_csv_produtos(request):
    queryset = _obter_queryset_historico_produtos(request)

    # utf-8-sig garante que acentos fiquem certos tanto no Excel quanto no Bloco de Notas/VSCode
    response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
    response['Content-Disposition'] = 'attachment; filename="historico_produtos.csv"'

    # delimiter=',' -> Delimitador padrão clássico CSV
    # quoting=csv.QUOTE_ALL -> Coloca " " em todas as colunas de texto/valores, garantindo o visual legítimo de CSV
    writer = csv.writer(
        response, 
        delimiter=',', 
        quotechar='"', 
        quoting=csv.QUOTE_NONNUMERIC
    )

    # Cabeçalho
    writer.writerow(['ID', 'DATA / HORA', 'USUARIO RESPONSÁVEL', 'AÇÃO', 'DESCRIÇÃO'])

    for reg in queryset:
        usuario = reg.usuario.username if reg.usuario else "Sistema"
        acao = reg.get_acao_display() if hasattr(reg, 'get_acao_display') else reg.acao
        
        # Limpa eventuais quebras de linha dentro da descrição para não quebrar a linha do CSV
        descricao_limpa = (reg.descricao or '').replace('\r', '').replace('\n', ' ')

        writer.writerow([
            int(reg.id),
            reg.data_hora.strftime("%d/%m/%Y %H:%M:%S"),
            usuario,
            acao,
            descricao_limpa
        ])

    return response


@login_required
@require_GET
def exportar_historico_excel_produtos(request):
    queryset = _obter_queryset_historico_produtos(request)

    wb = Workbook()
    ws = wb.active
    ws.title = "Histórico de Atividades"

    # Cabeçalho simples
    headers = ['ID', 'DATA / HORA', 'USUÁRIO RESPONSÁVEL', 'AÇÃO', 'DESCRIÇÃO']
    ws.append(headers)

    # Inserção direta das linhas sem estilos
    for reg in queryset:
        usuario = reg.usuario.username if reg.usuario else "Sistema"
        acao = reg.get_acao_display() if hasattr(reg, 'get_acao_display') else reg.acao

        ws.append([
            reg.id,
            reg.data_hora.strftime("%d/%m/%Y %H:%M:%S"),
            usuario,
            acao,
            reg.descricao
        ])

    # Apenas autoajuste de largura para os textos não ficarem cortados
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or '')
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 3, 10)

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    response = HttpResponse(
        buffer.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="historico_produtos.xlsx"'
    return response

@login_required
@require_GET
def exportar_historico_pdf_produtos(request):
    queryset = _obter_queryset_historico_produtos(request)

    dados_historico = []
    for reg in queryset:
        usuario = reg.usuario.username if reg.usuario else "Sistema"
        acao = reg.get_acao_display() if hasattr(reg, 'get_acao_display') else reg.acao

        dados_historico.append({
            'id': reg.id,
            'data_hora': reg.data_hora.strftime("%d/%m/%Y %H:%M:%S"),
            'usuario': usuario,
            'acao': acao,
            'descricao': reg.descricao
        })

    contexto = {
        'historico': dados_historico,
        'data_emissao': timezone.now().strftime("%d/%m/%Y às %H:%M:%S"),
        'usuario_emissor': request.user.username,
        'total_registros': len(dados_historico),
    }

    # Renderiza o HTML com os dados
    html_string = render_to_string(
        'estoque/relatorio_historico_produtos_pdf.html',
        contexto
    )

    # Gera o PDF em memória
    buffer = BytesIO()

    pisa_status = pisa.CreatePDF(
        html_string,
        dest=buffer,
        encoding='utf-8'
    )

    if pisa_status.err:
        return HttpResponse(
            "Erro ao processar e gerar o PDF.",
            status=500
        )

    buffer.seek(0)

    response = HttpResponse(
        buffer.getvalue(),
        content_type='application/pdf'
    )

    response['Content-Disposition'] = (
        'attachment; filename="historico_usuarios.pdf"'
    )

    return response

@login_required
@require_http_methods(["GET", "POST"])
def status_pausa_historico_produtos(request):
    """
    GET: Retorna se o histórico está pausado ou ativo.
    POST: Altera o estado (ativo ou pausado) e retorna avisos se já estiver no estado solicitado.
    """
    esta_pausado = cache.get(CACHE_KEY_HISTORICO_PAUSADO, False)

    if request.method == "GET":
        return JsonResponse({
            "sucesso": True,
            "pausado": esta_pausado
        })

    try:
        dados = json.loads(request.body)
        acao = dados.get("acao")  # "ativar" ou "pausar"

        if acao == "ativar":
            if not esta_pausado:
                return JsonResponse({
                    "sucesso": False,
                    "ja_estava": True,
                    "pausado": False,
                    "mensagem": "O histórico de atividades já está ativo."
                })
            cache.set(CACHE_KEY_HISTORICO_PAUSADO, False, timeout=None)
            return JsonResponse({
                "sucesso": True,
                "ja_estava": False,
                "pausado": False,
                "mensagem": "Histórico de atividades ativado com sucesso!"
            })

        elif acao == "pausar":
            if esta_pausado:
                return JsonResponse({
                    "sucesso": False,
                    "ja_estava": True,
                    "pausado": True,
                    "mensagem": "O histórico de atividades já está pausado."
                })
            cache.set(CACHE_KEY_HISTORICO_PAUSADO, True, timeout=None)
            return JsonResponse({
                "sucesso": True,
                "ja_estava": False,
                "pausado": True,
                "mensagem": "Histórico de atividades pausado com sucesso!"
            })

        return JsonResponse({"sucesso": False, "mensagem": "Ação inválida."}, status=400)

    except Exception as e:
        return JsonResponse({"sucesso": False, "mensagem": f"Erro interno: {str(e)}"}, status=500)
    
@login_required
def listar_historico_produtos(request):
    ordem = request.GET.get("ordem", "desc").lower()
    data_filtro = request.GET.get("data", "").strip()

    campo_ordem = "data_hora" if ordem == "asc" else "-data_hora"
    queryset = HistoricoProduto.objects.all().select_related('usuario')

    # Filtra por data específica se fornecida no padrão DD/MM/AAAA
    if data_filtro:
        try:
            data_obj = datetime.strptime(data_filtro, "%d/%m/%Y").date()
            queryset = queryset.filter(data_hora__date=data_obj)
        except ValueError:
            pass  # Se a data estiver incompleta ou inválida, ignora o filtro

    historicos = queryset.order_by(campo_ordem)[:100]

    # Renderiza diretamente o template de linhas para o modal
    html = render_to_string(
        'estoque/linhas_tabela_historico_produtos.html',
        {'historicos': historicos},
        request=request
    )

    return JsonResponse({
        "sucesso": True,
        "html": html,
        "total": historicos.count(),
        "ordem": ordem
    })
    
@login_required
@require_GET
def exportar_produtos_tabela_excel(request):
    tipo = request.GET.get('tipo', 'todos').lower()  # 'estoque', 'saida' ou 'todos'
    wb = Workbook()
    wb.remove(wb.active)  # Remove a aba padrão em branco

    # 1. Cabeçalho de ESTOQUE (SEM 'DATA DA SAÍDA')
    headers_estoque = [
        'ID', 'PRODUTO', 'QUANTIDADE', 'VALOR UNITÁRIO', 'DESCONTO', 
        'TOTAL SEM DESCONTO', 'TOTAL COM DESCONTO', 'DATA DO CADASTRO', 
        'CÓDIGO DO PRODUTO', 'CLIENTE', 'DESCRIÇÃO DO PRODUTO', 'USUÁRIO', 'STATUS DA SAÍDA'
    ]

    # 2. Cabeçalho de SAÍDA (COM 'DATA DA SAÍDA')
    headers_saida = [
        'ID', 'PRODUTO', 'QUANTIDADE', 'VALOR UNITÁRIO', 'DESCONTO', 
        'TOTAL SEM DESCONTO', 'TOTAL COM DESCONTO', 'DATA DA SAÍDA', 'DATA DO CADASTRO', 
        'CÓDIGO DO PRODUTO', 'CLIENTE', 'DESCRIÇÃO DO PRODUTO', 'USUÁRIO RESPONSÁVEL'
    ]

    # Estilos Visuais
    fonte_cabecalho = Font(name='Calibri', size=11, bold=True, color='FFFFFF')
    fill_cabecalho = PatternFill(start_color='2C3E50', end_color='2C3E50', fill_type='solid') # Azul escuro profissional
    alinhamento_cabecalho = Alignment(horizontal='center', vertical='center', wrap_text=True)

    # Formatos de número do Excel (Padrão monetário brasileiro e porcentagem)
    FORMATO_MOEDA = 'R$ #,##0.00'
    FORMATO_PERCENT = '0.00%'

    def extrair_linha_estoque(p):
        cliente_nome = p.cliente.nome if getattr(p, 'cliente', None) else 'Não informado'
        usuario_nome = p.criado_por.username if getattr(p, 'criado_por', None) else 'Sistema'
        data_cad = p.data_cadastro.strftime("%d/%m/%Y") if p.data_cadastro else '—'
        status_saida_desc = 'Gerado Saída' if p.status_saida == 1 else 'Em Estoque'

        # No Excel, porcentagem 12% deve ser enviada como número 0.12 para aplicar o formato %
        desconto_decimal = float(p.desconto or 0) / 100.0

        return [
            p.id,
            p.nome,
            p.quantidade,
            float(p.valor_unitario or 0),
            desconto_decimal,
            float(p.total_sem_desconto or 0),
            float(p.total_com_desconto or 0),
            data_cad,
            p.codigo,
            cliente_nome,
            p.descricao or '—',
            usuario_nome,
            status_saida_desc
        ]

    def extrair_linha_saida(s):
        prod = s.produto
        cliente_nome = prod.cliente.nome if getattr(prod, 'cliente', None) else 'Não informado'
        usuario_nome = s.criado_por.username if getattr(s, 'criado_por', None) else 'Sistema'
        data_saida_str = s.data_saida.strftime("%d/%m/%Y %H:%M") if s.data_saida else '—'
        data_cad = prod.data_cadastro.strftime("%d/%m/%Y") if getattr(prod, 'data_cadastro', None) else '—'
        desconto_decimal = float(s.desconto or 0) / 100.0

        return [
            s.id,
            prod.nome,
            s.quantidade,
            float(s.valor_unitario or 0),
            desconto_decimal,
            float(s.total_sem_desconto or 0),
            float(s.total_com_desconto or 0),
            data_saida_str,
            data_cad,
            prod.codigo,
            cliente_nome,
            prod.descricao or '—',
            usuario_nome
        ]

    def formatar_planilha(ws):
        # 1. Estiliza Cabeçalho (Linha 1)
        ws.row_dimensions[1].height = 28
        for cell in ws[1]:
            cell.font = fonte_cabecalho
            cell.fill = fill_cabecalho
            cell.alignment = alinhamento_cabecalho

        # 2. Formata Dados das Linhas
        # Colunas com valores numéricos / monetários / datas:
        # Coluna D (4): Valor Unitário (R$)
        # Coluna E (5): Desconto (%)
        # Coluna F (6): Total Sem Desconto (R$)
        # Coluna G (7): Total Com Desconto (R$)
        for row in ws.iter_rows(min_row=2):
            for cell in row:
                col_num = cell.column

                # ID, Quantidade, Datas centralizados
                if col_num in [1, 3, 8]:
                    cell.alignment = Alignment(horizontal='center')

                # Valor Unitário, Totais -> Formata como R$
                elif col_num in [4, 6, 7]:
                    cell.number_format = FORMATO_MOEDA
                    cell.alignment = Alignment(horizontal='right')

                # Desconto -> Formata como %
                elif col_num == 5:
                    cell.number_format = FORMATO_PERCENT
                    cell.alignment = Alignment(horizontal='right')

        # 3. Autoajuste de Largura das Colunas
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 13)

    # 1. Exporta Estoque
    if tipo in ['estoque', 'todos']:
        ws_estoque = wb.create_sheet(title="Produtos em Estoque")
        ws_estoque.append(headers_estoque)

        qs_estoque = Produto.objects.filter(quantidade__gt=0).select_related('criado_por', 'cliente').order_by('-id')
        for prod in qs_estoque:
            ws_estoque.append(extrair_linha_estoque(prod))

        formatar_planilha(ws_estoque)

    # 2. Exporta Saídas
    if tipo in ['saida', 'todos']:
        ws_saida = wb.create_sheet(title="Saída dos Produtos")
        ws_saida.append(headers_saida)

        qs_saidas = SaidaProduto.objects.select_related('produto', 'criado_por', 'produto__cliente').order_by('-data_saida')
        for saida in qs_saidas:
            ws_saida.append(extrair_linha_saida(saida))

        formatar_planilha(ws_saida)

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    filename = f"Produtos_{tipo}.xlsx" if tipo != 'todos' else "relatorio_geral_produtos.xlsx"
    response = HttpResponse(
        buffer.getvalue(), 
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response

@login_required
@require_GET
def exportar_produtos_tabela_pdf(request):
    tipo = request.GET.get('tipo', 'todos').lower()  # 'estoque', 'saida' ou 'todos'

    produtos_estoque = []
    saidas_produtos = []

    # 1. Filtra produtos em estoque (SEM data de saída)
    if tipo in ['estoque', 'todos']:
        produtos_estoque = Produto.objects.filter(
            quantidade__gt=0
        ).select_related('criado_por', 'cliente').order_by('-id')

    # 2. Filtra saídas registradas (COM data de saída)
    if tipo in ['saida', 'todos']:
        saidas_produtos = SaidaProduto.objects.select_related(
            'produto', 'criado_por', 'produto__cliente'
        ).order_by('-data_saida')

    contexto = {
        'tipo': tipo,
        'produtos_estoque': produtos_estoque,
        'saidas_produtos': saidas_produtos,
        'data_emissao': timezone.now().strftime("%d/%m/%Y às %H:%M:%S"),
        'usuario_emissor': request.user.get_full_name() or request.user.username,
        'total_estoque': len(produtos_estoque),
        'total_saidas': len(saidas_produtos),
    }

    # Renderiza o template HTML específico do PDF
    html_string = render_to_string(
        'estoque/relatorio_produtos_pdf.html',
        contexto,
        request=request
    )

    buffer = BytesIO()
    pisa_status = pisa.CreatePDF(html_string, dest=buffer, encoding='utf-8')

    if pisa_status.err:
        return HttpResponse("Erro ao gerar o relatório em PDF.", status=500)

    buffer.seek(0)
    nome_arquivo = f"produtos_{tipo}_{timezone.now().strftime('%d_%m_%Y')}.pdf"

    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{nome_arquivo}"'
    return response
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
from django.http import HttpResponse
from produtos.models import HistoricoProduto
import csv
from io import BytesIO
from xhtml2pdf import pisa
from django.views.decorators.http import require_http_methods
from django.core.cache import cache

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

        # 4. Registra auditoria no histórico
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

        # 3. Registra auditoria no histórico
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
    print(">>> ENTROU NA EXPORTAÇÃO PDF")
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

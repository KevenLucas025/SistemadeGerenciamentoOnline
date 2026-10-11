import openpyxl
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from .models import Cliente,ClienteHistorico
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST
from django.template.loader import render_to_string
import json
import csv
from openpyxl import Workbook
from openpyxl.utils import get_column_letter
from io import BytesIO
from xhtml2pdf import pisa
from django.views.decorators.http import require_http_methods
from django.core.cache import cache
from datetime import datetime

CACHE_KEY_HISTORICO_PAUSADO_CLIENTES = "historico_atividades_clientes_pausado"


def exportar_relatorio_excel(request):
    if request.method != "POST":
        return JsonResponse(
            {'erro': 'Método não permitido'},
            status=405
        )

    status = request.POST.get('status', '')
    categoria = request.POST.get('categoria', '')
    data_de = request.POST.get('data_de', '')
    data_ate = request.POST.get('data_ate', '')
    tipo_cliente = request.POST.get('tipo_cliente','')

    colunas_selecionadas = request.POST.getlist('colunas')

    if not status:
        return JsonResponse(
            {'erro': 'Por favor, selecione o filtro de Status do Cliente.'},
            status=400
        )

    if not categoria:
        return JsonResponse(
            {'erro': 'Por favor, selecione o filtro de Categoria do Cliente.'},
            status=400
        )
    if tipo_cliente not in ['fisico','juridico']:
        return JsonResponse({
            'erro': 'Tipo de cliente inválido'
        },status=400)

    if not colunas_selecionadas:
        return JsonResponse(
            {'erro': 'Selecione pelo menos 1 coluna para exportar!'},
            status=400
        )

    queryset = Cliente.objects.filter(tipo_cliente=tipo_cliente)

    if status != 'todos':
        queryset = queryset.filter(status__iexact=status)

    if categoria != 'todos':
        queryset = queryset.filter(categoria__iexact=categoria)

    if data_de and data_ate:
        queryset = queryset.filter(
            ultima_compra__date__range=[data_de, data_ate]
        )
    elif data_de:
        queryset = queryset.filter(
            ultima_compra__date__gte=data_de
        )
    elif data_ate:
        queryset = queryset.filter(
            ultima_compra__date__lte=data_ate
        )

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Relatório de Clientes"

    MAPEAMENTO_COLUNAS = {
        'nome': 'Nome',
        'razao_social': 'Razão Social',
        'data_inclusao': 'Data da Inclusão',
        'cnpj': 'CNPJ',
        'rg': 'RG',
        'cpf': 'CPF',
        'email': 'E-mail',
        'telefone': 'Contato / WhatsApp',
        'cnh': 'CNH',
        'categoria_cnh': 'Categoria CNH',
        'emissao_cnh': 'Emissão CNH',
        'vencimento_cnh': 'Vencimento CNH',
        'cep': 'CEP',
        'endereco': 'Endereço',
        'numero': 'Número',
        'complemento': 'Complemento',
        'cidade': 'Cidade',
        'bairro': 'Bairro',
        'estado': 'Estado',
        'status': 'Status',
        'categoria': 'Categoria',
        'ultima_atualizacao': 'Última Atualização',
        'valor_gasto': 'Valor Gasto Total',
        'modo_valor_gasto': 'Modo Valor Gasto',
        'ultima_compra': 'Última Compra',
    }

    # Mantém somente as colunas que realmente existem no mapeamento
    colunas_validas = [
        col
        for col in colunas_selecionadas
        if col in MAPEAMENTO_COLUNAS
    ]

    # Cabeçalhos
    headers = [
        MAPEAMENTO_COLUNAS[col]
        for col in colunas_validas
    ]

    ws.append(headers)

    # Dados
    for cliente in queryset:
        linha = []

        for col in colunas_validas:
            valor = getattr(cliente, col, '')

            if valor is None:
                valor = ''

            elif col in [
                'data_inclusao',
                'ultima_atualizacao',
                'ultima_compra'
            ]:
                valor = timezone.localtime(valor).replace(
                    tzinfo=None
                )

            elif col in [
                'emissao_cnh',
                'vencimento_cnh'
            ]:
                valor = valor

            elif col == 'valor_gasto':
                valor = float(valor)

            else:
                valor = str(valor)

            linha.append(valor)

        ws.append(linha)

    # Ajuste automático da largura das colunas
    for coluna in ws.columns:
        maior_tamanho = 0
        letra_coluna = coluna[0].column_letter

        for celula in coluna:
            if celula.value is not None:
                tamanho = len(str(celula.value))

                if tamanho > maior_tamanho:
                    maior_tamanho = tamanho

        ws.column_dimensions[letra_coluna].width = min(
            maior_tamanho + 2,
            40
        )

    # Formatação das colunas
    for indice, col in enumerate(colunas_validas, start=1):

        for linha in range(2, ws.max_row + 1):
            celula = ws.cell(
                row=linha,
                column=indice
            )

            if col in [
                'data_inclusao',
                'ultima_atualizacao',
                'ultima_compra'
            ]:
                if celula.value:
                    celula.number_format = 'DD/MM/YYYY HH:MM:SS'

            elif col in [
                'emissao_cnh',
                'vencimento_cnh'
            ]:
                if celula.value:
                    celula.number_format = 'DD/MM/YYYY'

            elif col == 'valor_gasto':
                if celula.value is not None:
                    celula.number_format = '"R$ " #,##0.00'

    response = HttpResponse(
        content_type=(
            'application/vnd.openxmlformats-officedocument.'
            'spreadsheetml.sheet'
        )
    )

    response['Content-Disposition'] = (
        'attachment; filename="Relatorio_Clientes.xlsx"'
    )

    wb.save(response)

    return response

def historico_clientes(request):
    try:
        tipo_cliente = request.GET.get("tipo_cliente", "")

        if tipo_cliente not in ["fisico", "juridico"]:
            return JsonResponse({
                "sucesso": False,
                "mensagem": "Tipo de cliente inválido."
            }, status=400)

        historicos = (
            ClienteHistorico.objects
            .select_related("cliente")
            .filter(tipo_cliente=tipo_cliente)
            .order_by("-data")[:100]
        )

        html = render_to_string(
            "clientes/linhas_tabela_historico_clientes.html",
            {
                "historicos": historicos
            },
            request=request
        )

        return JsonResponse({
            "sucesso": True,
            "tipo_cliente": tipo_cliente,
            "html": html,
            "total": historicos.count()
        })

    except Exception as erro:
        print(f"Erro ao carregar histórico de clientes: {erro}")

        return JsonResponse({
            "sucesso": False,
            "mensagem": (
                f"Erro ao carregar histórico: {str(erro)}"
            )
        }, status=500)
    
@login_required
@require_POST
def atualizar_historico_cliente(request):
    try:
        tipo_cliente = request.POST.get("tipo_cliente", "").strip()

        if tipo_cliente not in ["fisico", "juridico"]:
            return JsonResponse({
                "sucesso": False,
                "mensagem": "Tipo de cliente inválido."
            }, status=400)

        cliente_id = request.POST.get("cliente_id", "").strip()

        if not cliente_id:
            return JsonResponse({
                "sucesso": False,
                "mensagem": "Cliente não informado."
            }, status=400)

        cliente = Cliente.objects.filter(
            id=cliente_id,
            tipo_cliente=tipo_cliente
        ).first()

        if not cliente:
            return JsonResponse({
                "sucesso": False,
                "mensagem": "Cliente não encontrado."
            }, status=404)

        historico = ClienteHistorico.objects.create(
            cliente=cliente,
            tipo_cliente=tipo_cliente
        )

        return JsonResponse({
            "sucesso": True,
            "mensagem": "Histórico atualizado com sucesso.",
            "tipo_cliente": tipo_cliente,
            "historico_id": historico.id
        })

    except Exception as erro:
        print(
            f"Erro ao atualizar histórico do cliente: {erro}"
        )

        return JsonResponse({
            "sucesso": False,
            "mensagem": (
                f"Erro ao atualizar histórico: {str(erro)}"
            )
        }, status=500)
        
        
@login_required
@require_POST
def apagar_historico_clientes(request):
    try:
        dados = json.loads(request.body)
        ids_para_apagar = dados.get('ids',[])
        
        if not ids_para_apagar or not isinstance(ids_para_apagar, list):
            return JsonResponse({
                'sucesso': False,
                'mensagem': 'Nenhum histórico selecionado para exclusão.'
            }, status=400)
        deletados, _ = ClienteHistorico.objects.filter(id__in=ids_para_apagar).delete()
        
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
        
        
def _obter_queryset_historico_clientes(request):
    """
    Filtra o histórico conforme o tipo de cliente
    (juridico ou fisico) e, caso informado, pelos IDs selecionados.
    """

    tipo_cliente = (
        request.GET.get('tipo_cliente', '')
        .strip()
        .lower()
    )

    ids_param = (
        request.GET.get('ids', '')
        .strip()
    )

    qs = (
        ClienteHistorico.objects
        .all()
        .select_related('usuario')
        .order_by('-data')
    )

    # =====================================================
    # FILTRO PELO TIPO DE CLIENTE
    # =====================================================

    if tipo_cliente in ['juridico', 'fisico']:
        qs = qs.filter(
            tipo_cliente=tipo_cliente
        )

    # =====================================================
    # FILTRO PELOS IDS SELECIONADOS
    # =====================================================

    if ids_param:

        ids = [
            int(i)
            for i in ids_param.split(',')
            if i.isdigit()
        ]

        if ids:
            qs = qs.filter(
                id__in=ids
            )

    return qs
        
@login_required
@require_GET
def exportar_historico_csv_clientes(request):
    queryset = _obter_queryset_historico_clientes(request)

    # utf-8-sig garante que acentos fiquem certos tanto no Excel quanto no Bloco de Notas/VSCode
    response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
    response['Content-Disposition'] = 'attachment; filename="historico_clientes.csv"'

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
            reg.data.strftime("%d/%m/%Y %H:%M:%S"),
            usuario,
            acao,
            descricao_limpa
        ])

    return response


@login_required
@require_GET
def exportar_historico_excel_clientes(request):
    queryset = _obter_queryset_historico_clientes(request)

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
            reg.data.strftime("%d/%m/%Y %H:%M:%S"),
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
    response['Content-Disposition'] = 'attachment; filename="historico_clientes.xlsx"'
    return response

@login_required
@require_GET
def exportar_historico_pdf_clientes(request):
    queryset = _obter_queryset_historico_clientes(request)

    dados_historico = []
    for reg in queryset:
        usuario = reg.usuario.username if reg.usuario else "Sistema"
        acao = reg.get_acao_display() if hasattr(reg, 'get_acao_display') else reg.acao

        dados_historico.append({
            'id': reg.id,
            'data_hora': reg.data.strftime("%d/%m/%Y %H:%M:%S"),
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
        'clientes/relatorio_historico_clientes_pdf.html',
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
def status_pausa_historico_clientes(request):
    """
    GET: Retorna se o histórico está pausado ou ativo.
    POST: Altera o estado (ativo ou pausado) e retorna avisos se já estiver no estado solicitado.
    """
    esta_pausado = cache.get(CACHE_KEY_HISTORICO_PAUSADO_CLIENTES, False)

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
            cache.set(CACHE_KEY_HISTORICO_PAUSADO_CLIENTES, False, timeout=None)
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
            cache.set(CACHE_KEY_HISTORICO_PAUSADO_CLIENTES, True, timeout=None)
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
def listar_historico_clientes(request):
    ordem = request.GET.get("ordem", "desc").lower()
    data_filtro = request.GET.get("data", "").strip()
    tipo_cliente = request.GET.get("tipo_cliente", "").lower().strip()

    # Valida o tipo de cliente informado pelo JavaScript
    if tipo_cliente not in ("juridico", "fisico"):
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Tipo de cliente inválido ou não informado."
        }, status=400)

    # Valida a ordenação
    if ordem not in ("asc", "desc"):
        ordem = "desc"

    campo_ordem = "data" if ordem == "asc" else "-data"

    # Busca somente o histórico do tipo de cliente selecionado
    queryset = ClienteHistorico.objects.filter(
        tipo_cliente=tipo_cliente
    ).select_related("usuario")

    # Aplica o filtro por data, quando informado
    if data_filtro:
        try:
            data_obj = datetime.strptime(
                data_filtro, "%d/%m/%Y"
            ).date()

            queryset = queryset.filter(data=data_obj)

        except ValueError:
            pass

    # Ordena e limita os resultados
    historicos = queryset.order_by(campo_ordem)[:100]

    # Renderiza somente os registros filtrados
    html = render_to_string(
        "clientes/linhas_tabela_historico_clientes.html",
        {"historicos": historicos},
        request=request
    )

    return JsonResponse({
        "sucesso": True,
        "html": html,
        "total": historicos.count(),
        "ordem": ordem,
        "tipo_cliente": tipo_cliente
    })

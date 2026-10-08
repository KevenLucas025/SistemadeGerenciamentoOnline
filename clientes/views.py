import openpyxl
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from .models import Cliente,ClienteHistorico
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST
from django.template.loader import render_to_string
import json


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
        
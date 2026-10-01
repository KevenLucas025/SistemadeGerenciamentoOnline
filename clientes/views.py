import openpyxl
from django.http import HttpResponse, JsonResponse
from .models import Cliente


def exportar_relatorio_excel(request):
    if request.method != "POST":
        return JsonResponse(
            {'erro': 'Método não permitido'},
            status=405
        )

    # =====================================================
    # 1. RECEBER OS FILTROS DO FORMULÁRIO
    # =====================================================
    status = request.POST.get('status', '')
    categoria = request.POST.get('categoria', '')
    data_de = request.POST.get('data_de', '')
    data_ate = request.POST.get('data_ate', '')

    # Origem NÃO é utilizada porque o model Cliente
    # atualmente não possui esse campo.
    colunas_selecionadas = request.POST.getlist('colunas')

    # =====================================================
    # 2. VALIDAÇÃO
    # =====================================================
    if not all([status, categoria, data_de, data_ate]):
        return JsonResponse(
            {'erro': 'Todos os filtros são obrigatórios!'},
            status=400
        )

    if not colunas_selecionadas:
        return JsonResponse(
            {'erro': 'Selecione pelo menos 1 coluna para exportar!'},
            status=400
        )

    # =====================================================
    # 3. FILTRAR CLIENTES
    # =====================================================
    queryset = Cliente.objects.all()

    if status != 'todos':
        queryset = queryset.filter(status=status)

    if categoria != 'todos':
        queryset = queryset.filter(categoria=categoria)

    if data_de and data_ate:
        queryset = queryset.filter(
            ultima_compra__date__range=[data_de, data_ate]
        )

    # =====================================================
    # 4. CRIAR PLANILHA EXCEL
    # =====================================================
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Relatório de Clientes"

    # =====================================================
    # 5. MAPEAMENTO DAS COLUNAS
    # =====================================================
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

    # =====================================================
    # 6. ESCREVER CABEÇALHO
    # =====================================================
    headers = [
        MAPEAMENTO_COLUNAS.get(col, col)
        for col in colunas_selecionadas
        if col in MAPEAMENTO_COLUNAS
    ]

    ws.append(headers)

    # =====================================================
    # 7. ESCREVER DADOS
    # =====================================================
    for cliente in queryset:
        linha = []

        for col in colunas_selecionadas:

            # Ignora campos que não existem no model
            if col not in MAPEAMENTO_COLUNAS:
                continue

            valor = getattr(cliente, col, '')

            if valor is None:
                valor = ''

            linha.append(str(valor))

        ws.append(linha)

    # =====================================================
    # 8. AJUSTAR LARGURA DAS COLUNAS
    # =====================================================
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

    # =====================================================
    # 9. GERAR DOWNLOAD
    # =====================================================
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
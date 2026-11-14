from django.shortcuts import render,get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from clientes.models import Cliente
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.utils.dateparse import parse_date
from django.utils.formats import date_format
from datetime import timedelta
from django.db.models import Sum, Q
from django.db.models import Case, When, F, CharField
import csv
import json
from io import BytesIO
from django.http import HttpResponse
from openpyxl import Workbook
from django.contrib.auth.models import User
from django.utils import timezone
from accounts.models import HistoricoConexao,PerfilUsuario
from datetime import datetime, time, timedelta
from django.views.decorators.http import require_GET,require_POST
from django.db import models
from django.db import transaction
from accounts.views import registrar_transicao_conexao
from django.db.models import Count
from django.db.models.functions import TruncMonth

@login_required
def relatorios(request):

    # =====================================================
    # TODOS OS CLIENTES
    # =====================================================

    clientes_queryset = Cliente.objects.all().order_by(
        '-data_inclusao'
    )

    paginator = Paginator(clientes_queryset, 5)

    pagina_atual = request.GET.get('page', 1)

    clientes = paginator.get_page(pagina_atual)

    # =====================================================
    # CLIENTES JURÍDICOS
    # =====================================================

    clientes_juridicos_queryset = Cliente.objects.filter(
        tipo_cliente='juridico'
    ).order_by('-data_inclusao')

    paginator_juridicos = Paginator(
        clientes_juridicos_queryset, 5
    )

    pagina_juridicos = request.GET.get(
        'page_juridicos', 1
    )

    clientes_juridicos = paginator_juridicos.get_page(
        pagina_juridicos
    )

    # VALOR MOVIMENTADO - JURÍDICOS

    valor_movimentado_juridicos = (
        clientes_juridicos_queryset.aggregate(
            total=Sum('valor_gasto')
        )['total'] or 0
    )

    valor_movimentado_juridicos = (
        f"{valor_movimentado_juridicos:,.2f}"
        .replace(",", "X")
        .replace(".", ",")
        .replace("X", ".")
    )

    # =====================================================
    # CLIENTES FÍSICOS
    # =====================================================

    clientes_fisicos_queryset = Cliente.objects.filter(
        tipo_cliente='fisico'
    ).order_by('-data_inclusao')

    paginator_fisicos = Paginator(
        clientes_fisicos_queryset, 5
    )

    pagina_fisicos = request.GET.get(
        'page_fisicos', 1
    )

    clientes_fisicos = paginator_fisicos.get_page(
        pagina_fisicos
    )

    # VALOR MOVIMENTADO - FÍSICOS

    valor_movimentado_fisicos = (
        clientes_fisicos_queryset.aggregate(
            total=Sum('valor_gasto')
        )['total'] or 0
    )

    valor_movimentado_fisicos = (
        f"{valor_movimentado_fisicos:,.2f}"
        .replace(",", "X")
        .replace(".", ",")
        .replace("X", ".")
    )

    # =====================================================
    # VALOR MOVIMENTADO GERAL
    # =====================================================

    valor_movimentado = (
        clientes_queryset.aggregate(
            total=Sum('valor_gasto')
        )['total'] or 0
    )

    valor_movimentado = (
        f"{valor_movimentado:,.2f}"
        .replace(",", "X")
        .replace(".", ",")
        .replace("X", ".")
    )
    
    categorias_juridicos = (
        Cliente.objects
        .filter(tipo_cliente='juridico')
        .exclude(categoria__isnull=True)
        .exclude(categoria__exact='')
        .values_list('categoria', flat=True)
        .distinct()
        .order_by('categoria')
    )
    
    cidades_juridicos = (
        Cliente.objects
        .filter(tipo_cliente='juridico')
        .exclude(cidade__isnull=True)
        .exclude(cidade__exact='')
        .values_list('cidade', flat=True)
        .distinct()
        .order_by('cidade')
    )

    # =====================================================
    # CONTEXTO
    # =====================================================

    context = {
        # Todos os clientes
        'clientes': clientes,
        'paginator': paginator,
        'valor_movimentado': valor_movimentado,

        # Clientes jurídicos
        'clientes_juridicos': clientes_juridicos,
        'paginator_juridicos': paginator_juridicos,
        'valor_movimentado_juridicos': valor_movimentado_juridicos,

        # Clientes físicos
        'clientes_fisicos': clientes_fisicos,
        'paginator_fisicos': paginator_fisicos,
        'valor_movimentado_fisicos': valor_movimentado_fisicos,
        
        'categorias_juridicos': categorias_juridicos,
        'cidades_juridicos': cidades_juridicos,
    }

    return render(
        request,
        'relatorios.html',
        context
    )

@login_required
def filtrar_clientes_juridicos(request):

    if request.method != 'GET':
        return JsonResponse({
            'erro': 'Método não permitido.'
        }, status=405)

    # =========================================
    # RECEBER DATAS
    # =========================================
    data_inicial_raw = request.GET.get('data_inicial', '')
    data_final_raw = request.GET.get('data_final', '')

    data_inicial = parse_date(data_inicial_raw) if data_inicial_raw else None
    data_final = parse_date(data_final_raw) if data_final_raw else None

    if data_inicial_raw and not data_inicial:
        return JsonResponse({
            'erro': 'Data inicial inválida.'
        }, status=400)

    if data_final_raw and not data_final:
        return JsonResponse({
            'erro': 'Data final inválida.'
        }, status=400)

    if data_inicial and data_final and data_inicial > data_final:
        return JsonResponse({
            'erro': 'A data inicial não pode ser maior que a data final.'
        }, status=400)

    # =========================================
    # CONSULTA DOS CLIENTES JURÍDICOS
    # =========================================

    clientes_queryset = Cliente.objects.filter(
        tipo_cliente='juridico'
    )

    # FILTRO POR PERÍODO
    if data_inicial:
        clientes_queryset = clientes_queryset.filter(
            data_inclusao__gte=data_inicial
        )

    if data_final:
        clientes_queryset = clientes_queryset.filter(
            data_inclusao__lt=data_final + timedelta(days=1)
        )


    # FILTRO POR STATUS
    status_selecionado = request.GET.get('status', 'todos').strip().lower()

    if status_selecionado == 'ativo':
        clientes_queryset = clientes_queryset.filter(
            status__iexact='Ativo'
        )

    elif status_selecionado == 'inativo':
        clientes_queryset = clientes_queryset.filter(
            status__iexact='Inativo'
        )

    elif status_selecionado != 'todos':
        return JsonResponse(
            {'erro': 'Status informado inválido.'},
            status=400
        )
        
    # FILTRO POR CATEGORIA
    categoria_selecionada = request.GET.get(
        'categoria', 'todos'
    ).strip()

    if categoria_selecionada.lower() != 'todos':

        clientes_queryset = clientes_queryset.filter(
            categoria__iexact=categoria_selecionada
        )
        
    cidade_selecionada = request.GET.get('cidade', '').strip()

    if cidade_selecionada:
        clientes_queryset = clientes_queryset.filter(
            cidade__icontains=cidade_selecionada
        )
        
    # FILTRO POR ESTADO
    estado_selecionado = request.GET.get(
        'estado', ''
    ).strip().upper()

    if estado_selecionado:
        clientes_queryset = clientes_queryset.filter(
            estado__iexact=estado_selecionado
        )
        
    # =========================================
    # ORDENAÇÃO
    # =========================================

    ordenar_por = request.GET.get(
        'ordenar_por', 'razao_social'
    ).strip()

    ordem = request.GET.get(
        'ordem', 'asc'
    ).strip().lower()

    campos_ordenacao = [
        'razao_social',
        'data_inclusao',
        'valor_gasto'
    ]

    if ordenar_por not in campos_ordenacao:
        return JsonResponse({
            'erro': 'Campo de ordenação inválido.'
        }, status=400)

    if ordem not in ['asc', 'desc']:
        return JsonResponse({
            'erro': 'Ordem de classificação inválida.'
        }, status=400)

    prefixo = '-' if ordem == 'desc' else ''

    if ordenar_por == 'razao_social':

        clientes_queryset = clientes_queryset.annotate(
            _nome_ordenacao=Case(
                When(
                    razao_social__isnull=True,
                    then=F('nome')
                ),
                When(
                    razao_social='',
                    then=F('nome')
                ),
                default=F('razao_social'),
                output_field=CharField()
            )
        ).order_by(
            f'{prefixo}_nome_ordenacao',
            'id'
        )

    else:

        clientes_queryset = clientes_queryset.order_by(
            f'{prefixo}{ordenar_por}',
            'id'
        )
        
    # =========================================
    # PESQUISA GERAL
    # =========================================

    pesquisa = request.GET.get('pesquisa', '').strip()

    if pesquisa:

        clientes_queryset = clientes_queryset.filter(
            Q(razao_social__icontains=pesquisa) |
            Q(nome__icontains=pesquisa) |
            Q(cnpj__icontains=pesquisa) |
            Q(email__icontains=pesquisa) |
            Q(telefone__icontains=pesquisa)
        )

    # =========================================
    # RESUMO
    # =========================================
    total_clientes = clientes_queryset.count()

    valor_movimentado = (
        clientes_queryset.aggregate(
            total=Sum('valor_gasto')
        )['total'] or 0
    )

    valor_movimentado = (
        f"{valor_movimentado:,.2f}"
        .replace(",", "X")
        .replace(".", ",")
        .replace("X", ".")
    )

    # =========================================
    # PAGINAÇÃO
    # =========================================
    paginator = Paginator(clientes_queryset, 5)

    pagina = paginator.get_page(
        request.GET.get('page', 1)
    )

    # =========================================
    # FORMATAR RESULTADOS
    # =========================================
    resultados = []

    for cliente in pagina:

        resultados.append({

            'nome': (
                getattr(cliente, 'razao_social', None) or cliente.nome or '-'
            ),
            
            'categoria': cliente.categoria or '-',

            'cnpj': cliente.cnpj or '-',

            'email': cliente.email or '-',

            'telefone': cliente.telefone or '-',

            'cidade': cliente.cidade or '-',

            'estado': cliente.estado or '-',

            'status': cliente.status or 'Inativo',

            'data_inclusao': (
                date_format(cliente.data_inclusao, 'd/m/Y')
                if cliente.data_inclusao else '-'
            ),

            'valor_gasto': (
                f"{cliente.valor_gasto or 0:,.2f}"
                .replace(",", "X")
                .replace(".", ",")
                .replace("X", ".")
            ),

            'ultima_compra': (
                date_format(cliente.ultima_compra, 'd/m/Y')
                if cliente.ultima_compra else '-'
            )

        })

    # =========================================
    # RESPOSTA AJAX
    # =========================================
    return JsonResponse({

        'resultados': resultados,

        'total_clientes': total_clientes,

        'valor_movimentado': valor_movimentado,

        'paginacao': {
            'pagina_atual': pagina.number,
            'total_paginas': paginator.num_pages,
            'inicio': pagina.start_index() if total_clientes else 0,
            'fim': pagina.end_index() if total_clientes else 0,
            'tem_anterior': pagina.has_previous(),
            'tem_proxima': pagina.has_next(),
            'pagina_anterior': (
                pagina.previous_page_number()
                if pagina.has_previous() else None
            ),
            'pagina_proxima': (
                pagina.next_page_number()
                if pagina.has_next() else None
            ),
            'intervalo': list(
                paginator.get_elided_page_range(
                    number=pagina.number,
                    on_each_side=2,
                    on_ends=1
                )
            )
        }

    })
    
@login_required
def exportar_clientes_juridicos(request):

    if request.method != 'GET':
        return JsonResponse({
            'erro': 'Método não permitido.'
        }, status=405)

    # =========================================
    # COLUNAS SELECIONADAS
    # =========================================

    colunas_disponiveis = {
        'nome_razao_social': 'Nome / Razão Social',
        'nome_tipo': 'Tipo',
        'nome_categoria': 'Categoria',
        'nome_cnpj': 'CNPJ',
        'nome_email': 'E-mail',
        'nome_telefone': 'Telefone / WhatsApp',
        'nome_cidade': 'Cidade / Estado',
        'nome_status': 'Status',
        'nome_data_cadastro': 'Data do Cadastro',
        'nome_valor_gasto_total': 'Valor Gasto Total',
        'nome_ultima_compra': 'Última Compra',
    }

    colunas = request.GET.getlist('colunas')

    if not colunas:
        return JsonResponse({
            'erro': 'Selecione pelo menos uma coluna para exportar.'
        }, status=400)

    if any(coluna not in colunas_disponiveis for coluna in colunas):
        return JsonResponse({
            'erro': 'Uma ou mais colunas informadas são inválidas.'
        }, status=400)

    formato = request.GET.get('formato', 'csv').lower()

    if formato not in ['csv', 'xlsx', 'json']:
        return JsonResponse({
            'erro': 'Formato de arquivo inválido.'
        }, status=400)

    # =========================================
    # CONSULTA DOS CLIENTES JURÍDICOS
    # =========================================

    clientes_queryset = Cliente.objects.filter(
        tipo_cliente='juridico'
    )

    # PERÍODO

    data_inicial_raw = request.GET.get('data_inicial', '')
    data_final_raw = request.GET.get('data_final', '')

    data_inicial = (
        parse_date(data_inicial_raw)
        if data_inicial_raw else None
    )

    data_final = (
        parse_date(data_final_raw)
        if data_final_raw else None
    )

    if data_inicial_raw and not data_inicial:
        return JsonResponse({
            'erro': 'Data inicial inválida.'
        }, status=400)

    if data_final_raw and not data_final:
        return JsonResponse({
            'erro': 'Data final inválida.'
        }, status=400)

    if data_inicial and data_final and data_inicial > data_final:
        return JsonResponse({
            'erro': 'A data inicial não pode ser maior que a data final.'
        }, status=400)

    if data_inicial:
        clientes_queryset = clientes_queryset.filter(
            data_inclusao__gte=data_inicial
        )

    if data_final:
        clientes_queryset = clientes_queryset.filter(
            data_inclusao__lt=data_final + timedelta(days=1)
        )

    # STATUS

    status = request.GET.get('status', 'todos').strip().lower()

    if status == 'ativo':
        clientes_queryset = clientes_queryset.filter(
            status__iexact='Ativo'
        )

    elif status == 'inativo':
        clientes_queryset = clientes_queryset.filter(
            status__iexact='Inativo'
        )

    elif status != 'todos':
        return JsonResponse({
            'erro': 'Status informado inválido.'
        }, status=400)

    # CATEGORIA

    categoria = request.GET.get('categoria', 'todos').strip()

    if categoria.lower() != 'todos':
        clientes_queryset = clientes_queryset.filter(
            categoria__iexact=categoria
        )

    # CIDADE

    cidade = request.GET.get('cidade', '').strip()

    if cidade:
        clientes_queryset = clientes_queryset.filter(
            cidade__icontains=cidade
        )

    # ESTADO

    estado = request.GET.get('estado', '').strip().upper()

    if estado:
        clientes_queryset = clientes_queryset.filter(
            estado__iexact=estado
        )

    # PESQUISA

    pesquisa = request.GET.get('pesquisa', '').strip()

    if pesquisa:
        clientes_queryset = clientes_queryset.filter(
            Q(razao_social__icontains=pesquisa) |
            Q(nome__icontains=pesquisa) |
            Q(cnpj__icontains=pesquisa) |
            Q(email__icontains=pesquisa) |
            Q(telefone__icontains=pesquisa)
        )

    # =========================================
    # ORDENAÇÃO
    # =========================================

    ordenar_por = request.GET.get(
        'ordenar_por', 'razao_social'
    ).strip()

    ordem = request.GET.get('ordem', 'asc').strip().lower()

    campos_ordenacao = [
        'razao_social',
        'data_inclusao',
        'valor_gasto'
    ]

    if ordenar_por not in campos_ordenacao:
        return JsonResponse({
            'erro': 'Campo de ordenação inválido.'
        }, status=400)

    if ordem not in ['asc', 'desc']:
        return JsonResponse({
            'erro': 'Ordem de classificação inválida.'
        }, status=400)

    prefixo = '-' if ordem == 'desc' else ''

    if ordenar_por == 'razao_social':

        clientes_queryset = clientes_queryset.annotate(
            _nome_ordenacao=Case(
                When(
                    razao_social__isnull=True,
                    then=F('nome')
                ),
                When(
                    razao_social='',
                    then=F('nome')
                ),
                default=F('razao_social'),
                output_field=CharField()
            )
        ).order_by(
            f'{prefixo}_nome_ordenacao',
            'id'
        )

    else:
        clientes_queryset = clientes_queryset.order_by(
            f'{prefixo}{ordenar_por}',
            'id'
        )

    # =========================================
    # PREPARAR DADOS
    # =========================================

    resultados = []

    for cliente in clientes_queryset:

        dados_cliente = {
            'nome_razao_social': (
                getattr(cliente, 'razao_social', None)
                or cliente.nome
                or '-'
            ),

            'nome_tipo': 'Jurídico',

            'nome_categoria': cliente.categoria or '-',

            'nome_cnpj': cliente.cnpj or '-',

            'nome_email': cliente.email or '-',

            'nome_telefone': cliente.telefone or '-',

            'nome_cidade': (
                f'{cliente.cidade or "-"} / {cliente.estado or "-"}'
            ),

            'nome_status': cliente.status or 'Inativo',

            'nome_data_cadastro': (
                date_format(cliente.data_inclusao, 'd/m/Y')
                if cliente.data_inclusao else '-'
            ),

            'nome_valor_gasto_total': (
                f'R$ {cliente.valor_gasto or 0:,.2f}'
                .replace(',', 'X')
                .replace('.', ',')
                .replace('X', '.')
            ),

            'nome_ultima_compra': (
                date_format(cliente.ultima_compra, 'd/m/Y')
                if cliente.ultima_compra else '-'
            ),
        }

        resultados.append({
            colunas_disponiveis[coluna]: dados_cliente[coluna]
            for coluna in colunas
        })

    # =========================================
    # EXPORTAR JSON
    # =========================================

    if formato == 'json':

        response = HttpResponse(
            json.dumps(
                resultados,
                ensure_ascii=False,
                indent=4
            ),
            content_type='application/json; charset=utf-8'
        )

        response['Content-Disposition'] = (
            'attachment; filename="clientes_juridicos.json"'
        )

        return response

    # =========================================
    # EXPORTAR CSV
    # =========================================
    if formato == 'csv':

        response = HttpResponse(
            content_type='text/csv; charset=cp1252'
        )

        response['Content-Disposition'] = (
            'attachment; filename="clientes_juridicos.csv"'
        )

        writer = csv.writer(
            response,
            delimiter=',',
            quotechar='"',
            quoting=csv.QUOTE_NONNUMERIC
        )

        # Cabeçalho
        if resultados:
            writer.writerow(resultados[0].keys())

            for resultado in resultados:
                valores = []

                for valor in resultado.values():

                    if valor is None:
                        valor = ''

                    elif isinstance(valor, str):
                        valor = valor.replace('\r', '').replace('\n', ' ')

                    valores.append(valor)

                writer.writerow(valores)

        else:
            writer.writerow([
                colunas_disponiveis[coluna]
                for coluna in colunas
            ])

        return response

    # =========================================
    # EXPORTAR XLSX
    # =========================================
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = 'Clientes Jurídicos'

    cabecalhos = [
        colunas_disponiveis[coluna]
        for coluna in colunas
    ]

    worksheet.append(cabecalhos)

    for resultado in resultados:
        worksheet.append(list(resultado.values()))

    # Ajustar largura das colunas
    for coluna_excel in worksheet.columns:

        maior_largura = max(
            len(str(celula.value or ''))
            for celula in coluna_excel
        )

        worksheet.column_dimensions[
            coluna_excel[0].column_letter
        ].width = min(maior_largura + 3, 45)

    arquivo = BytesIO()
    workbook.save(arquivo)
    arquivo.seek(0)

    response = HttpResponse(
        arquivo.getvalue(),
        content_type=(
            'application/vnd.openxmlformats-officedocument.'
            'spreadsheetml.sheet'
        )
    )

    response['Content-Disposition'] = (
        'attachment; filename="clientes_juridicos.xlsx"'
    )

    return response

# =====================================================
# FILTRAR CLIENTES FÍSICOS
# =====================================================

@login_required
def filtrar_clientes_fisicos(request):

    if request.method != 'GET':
        return JsonResponse({
            'erro': 'Método não permitido.'
        }, status=405)

    # =========================================
    # RECEBER E VALIDAR DATAS
    # =========================================

    data_inicial_raw = request.GET.get('data_inicial', '')
    data_final_raw = request.GET.get('data_final', '')

    data_inicial = (
        parse_date(data_inicial_raw)
        if data_inicial_raw else None
    )

    data_final = (
        parse_date(data_final_raw)
        if data_final_raw else None
    )

    if data_inicial_raw and not data_inicial:
        return JsonResponse({
            'erro': 'Data inicial inválida.'
        }, status=400)

    if data_final_raw and not data_final:
        return JsonResponse({
            'erro': 'Data final inválida.'
        }, status=400)

    if data_inicial and data_final and data_inicial > data_final:
        return JsonResponse({
            'erro': 'A data inicial não pode ser maior que a data final.'
        }, status=400)

    # =========================================
    # CONSULTA EXCLUSIVA DE CLIENTES FÍSICOS
    # =========================================

    clientes_fisicos_queryset = Cliente.objects.filter(
        tipo_cliente='fisico'
    )

    # =========================================
    # FILTRO POR PERÍODO
    # =========================================

    if data_inicial:
        clientes_fisicos_queryset = clientes_fisicos_queryset.filter(
            data_inclusao__gte=data_inicial
        )

    if data_final:
        clientes_fisicos_queryset = clientes_fisicos_queryset.filter(
            data_inclusao__lt=data_final + timedelta(days=1)
        )

    # =========================================
    # FILTRO POR STATUS
    # =========================================

    status_selecionado = request.GET.get(
        'status', 'todos'
    ).strip().lower()

    if status_selecionado == 'ativo':

        clientes_fisicos_queryset = clientes_fisicos_queryset.filter(
            status__iexact='Ativo'
        )

    elif status_selecionado == 'inativo':

        clientes_fisicos_queryset = clientes_fisicos_queryset.filter(
            status__iexact='Inativo'
        )

    elif status_selecionado != 'todos':

        return JsonResponse({
            'erro': 'Status informado inválido.'
        }, status=400)

    # =========================================
    # FILTRO POR CIDADE
    # =========================================

    cidade_selecionada = request.GET.get(
        'cidade', ''
    ).strip()

    if cidade_selecionada:

        clientes_fisicos_queryset = clientes_fisicos_queryset.filter(
            cidade__icontains=cidade_selecionada
        )

    # =========================================
    # FILTRO POR ESTADO
    # =========================================

    estado_selecionado = request.GET.get(
        'estado', ''
    ).strip().upper()

    if estado_selecionado:

        clientes_fisicos_queryset = clientes_fisicos_queryset.filter(
            estado__iexact=estado_selecionado
        )

    # =========================================
    # PESQUISA GERAL
    # =========================================

    pesquisa = request.GET.get(
        'pesquisa', ''
    ).strip()

    if pesquisa:

        clientes_fisicos_queryset = clientes_fisicos_queryset.filter(
            Q(nome__icontains=pesquisa) |
            Q(cpf__icontains=pesquisa) |
            Q(email__icontains=pesquisa) |
            Q(telefone__icontains=pesquisa)
        )

    # =========================================
    # ORDENAÇÃO
    # =========================================

    ordenar_por = request.GET.get(
        'ordenar_por', 'nome'
    ).strip()

    ordem = request.GET.get(
        'ordem', 'asc'
    ).strip().lower()

    campos_ordenacao = [
        'nome',
        'data_inclusao',
        'valor_gasto'
    ]

    if ordenar_por not in campos_ordenacao:

        return JsonResponse({
            'erro': 'Campo de ordenação inválido.'
        }, status=400)

    if ordem not in ['asc', 'desc']:

        return JsonResponse({
            'erro': 'Ordem de classificação inválida.'
        }, status=400)

    prefixo = '-' if ordem == 'desc' else ''

    clientes_fisicos_queryset = clientes_fisicos_queryset.order_by(
        f'{prefixo}{ordenar_por}',
        'id'
    )

    # =========================================
    # RESUMO DOS CLIENTES FÍSICOS
    # =========================================

    total_clientes_fisicos = clientes_fisicos_queryset.count()

    valor_movimentado_fisicos = (
        clientes_fisicos_queryset.aggregate(
            total=Sum('valor_gasto')
        )['total'] or 0
    )

    valor_movimentado_fisicos = (
        f"{valor_movimentado_fisicos:,.2f}"
        .replace(",", "X")
        .replace(".", ",")
        .replace("X", ".")
    )

    # =========================================
    # PAGINAÇÃO
    # =========================================

    paginator_fisicos = Paginator(
        clientes_fisicos_queryset,
        5
    )

    pagina_fisicos = paginator_fisicos.get_page(
        request.GET.get('page', 1)
    )

    # =========================================
    # FORMATAR RESULTADOS
    # =========================================

    resultados_fisicos = []

    for cliente in pagina_fisicos:

        resultados_fisicos.append({

            'nome': cliente.nome or '-',

            'tipo': 'Físico',

            'cpf': cliente.cpf or '-',

            'email': cliente.email or '-',

            'telefone': cliente.telefone or '-',

            'cidade': cliente.cidade or '-',

            'estado': cliente.estado or '-',

            'status': cliente.status or 'Inativo',

            'data_inclusao': (
                date_format(cliente.data_inclusao, 'd/m/Y')
                if cliente.data_inclusao else '-'
            ),

            'valor_gasto': (
                f"{cliente.valor_gasto or 0:,.2f}"
                .replace(",", "X")
                .replace(".", ",")
                .replace("X", ".")
            ),

            'ultima_compra': (
                date_format(cliente.ultima_compra, 'd/m/Y')
                if cliente.ultima_compra else '-'
            )

        })

    # =========================================
    # RESPOSTA AJAX - CLIENTES FÍSICOS
    # =========================================

    return JsonResponse({

        'resultados': resultados_fisicos,

        'total_clientes': total_clientes_fisicos,

        'total_pessoa_fisica': total_clientes_fisicos,

        'valor_movimentado': valor_movimentado_fisicos,

        'paginacao': {

            'pagina_atual': pagina_fisicos.number,

            'total_paginas': paginator_fisicos.num_pages,

            'inicio': (
                pagina_fisicos.start_index()
                if total_clientes_fisicos else 0
            ),

            'fim': (
                pagina_fisicos.end_index()
                if total_clientes_fisicos else 0
            ),

            'tem_anterior': pagina_fisicos.has_previous(),

            'tem_proxima': pagina_fisicos.has_next(),

            'pagina_anterior': (
                pagina_fisicos.previous_page_number()
                if pagina_fisicos.has_previous() else None
            ),

            'pagina_proxima': (
                pagina_fisicos.next_page_number()
                if pagina_fisicos.has_next() else None
            ),

            'intervalo': list(
                paginator_fisicos.get_elided_page_range(
                    number=pagina_fisicos.number,
                    on_each_side=2,
                    on_ends=1
                )
            )

        }

    })


# =====================================================
# EXPORTAR CLIENTES FÍSICOS
# =====================================================

@login_required
def exportar_clientes_fisicos(request):

    if request.method != 'GET':
        return JsonResponse({
            'erro': 'Método não permitido.'
        }, status=405)

    # =========================================
    # COLUNAS DISPONÍVEIS PARA CLIENTES FÍSICOS
    # =========================================

    colunas_disponiveis_fisicos = {

        'nome': 'Nome',

        'tipo': 'Tipo',

        'cpf': 'CPF',

        'email': 'E-mail',

        'telefone': 'Telefone / WhatsApp',

        'cidade_estado': 'Cidade / Estado',

        'status': 'Status',

        'data_cadastro': 'Data do Cadastro',

        'valor_gasto_total': 'Valor Gasto Total',

        'ultima_compra': 'Última Compra',

    }

    colunas_fisicos = request.GET.getlist('colunas')

    if not colunas_fisicos:

        return JsonResponse({
            'erro': 'Selecione pelo menos uma coluna para exportar.'
        }, status=400)

    if any(
        coluna not in colunas_disponiveis_fisicos
        for coluna in colunas_fisicos
    ):

        return JsonResponse({
            'erro': 'Uma ou mais colunas informadas são inválidas.'
        }, status=400)

    # =========================================
    # FORMATO DE EXPORTAÇÃO
    # =========================================

    formato = request.GET.get(
        'formato', 'csv'
    ).lower()

    if formato not in ['csv', 'xlsx', 'json']:

        return JsonResponse({
            'erro': 'Formato de arquivo inválido.'
        }, status=400)

    # =========================================
    # CONSULTA EXCLUSIVA DE CLIENTES FÍSICOS
    # =========================================

    clientes_fisicos_queryset = Cliente.objects.filter(
        tipo_cliente='fisico'
    )

    # =========================================
    # FILTRO POR PERÍODO
    # =========================================

    data_inicial_raw = request.GET.get(
        'data_inicial', ''
    )

    data_final_raw = request.GET.get(
        'data_final', ''
    )

    data_inicial = (
        parse_date(data_inicial_raw)
        if data_inicial_raw else None
    )

    data_final = (
        parse_date(data_final_raw)
        if data_final_raw else None
    )

    if data_inicial_raw and not data_inicial:

        return JsonResponse({
            'erro': 'Data inicial inválida.'
        }, status=400)

    if data_final_raw and not data_final:

        return JsonResponse({
            'erro': 'Data final inválida.'
        }, status=400)

    if data_inicial and data_final and data_inicial > data_final:

        return JsonResponse({
            'erro': 'A data inicial não pode ser maior que a data final.'
        }, status=400)

    if data_inicial:

        clientes_fisicos_queryset = clientes_fisicos_queryset.filter(
            data_inclusao__gte=data_inicial
        )

    if data_final:

        clientes_fisicos_queryset = clientes_fisicos_queryset.filter(
            data_inclusao__lt=data_final + timedelta(days=1)
        )

    # =========================================
    # FILTRO POR STATUS
    # =========================================

    status = request.GET.get(
        'status', 'todos'
    ).strip().lower()

    if status == 'ativo':

        clientes_fisicos_queryset = clientes_fisicos_queryset.filter(
            status__iexact='Ativo'
        )

    elif status == 'inativo':

        clientes_fisicos_queryset = clientes_fisicos_queryset.filter(
            status__iexact='Inativo'
        )

    elif status != 'todos':

        return JsonResponse({
            'erro': 'Status informado inválido.'
        }, status=400)

    # =========================================
    # FILTRO POR CIDADE
    # =========================================

    cidade = request.GET.get(
        'cidade', ''
    ).strip()

    if cidade:

        clientes_fisicos_queryset = clientes_fisicos_queryset.filter(
            cidade__icontains=cidade
        )

    # =========================================
    # FILTRO POR ESTADO
    # =========================================

    estado = request.GET.get(
        'estado', ''
    ).strip().upper()

    if estado:

        clientes_fisicos_queryset = clientes_fisicos_queryset.filter(
            estado__iexact=estado
        )

    # =========================================
    # PESQUISA GERAL
    # =========================================

    pesquisa = request.GET.get(
        'pesquisa', ''
    ).strip()

    if pesquisa:

        clientes_fisicos_queryset = clientes_fisicos_queryset.filter(
            Q(nome__icontains=pesquisa) |
            Q(cpf__icontains=pesquisa) |
            Q(email__icontains=pesquisa) |
            Q(telefone__icontains=pesquisa)
        )

    # =========================================
    # ORDENAÇÃO
    # =========================================

    ordenar_por = request.GET.get(
        'ordenar_por', 'nome'
    ).strip()

    ordem = request.GET.get(
        'ordem', 'asc'
    ).strip().lower()

    campos_ordenacao = [
        'nome',
        'data_inclusao',
        'valor_gasto'
    ]

    if ordenar_por not in campos_ordenacao:

        return JsonResponse({
            'erro': 'Campo de ordenação inválido.'
        }, status=400)

    if ordem not in ['asc', 'desc']:

        return JsonResponse({
            'erro': 'Ordem de classificação inválida.'
        }, status=400)

    prefixo = '-' if ordem == 'desc' else ''

    clientes_fisicos_queryset = clientes_fisicos_queryset.order_by(
        f'{prefixo}{ordenar_por}',
        'id'
    )

    # =========================================
    # PREPARAR DADOS PARA EXPORTAÇÃO
    # =========================================

    resultados_fisicos = []

    for cliente in clientes_fisicos_queryset:

        dados_cliente_fisico = {

            'nome': cliente.nome or '-',

            'tipo': 'Físico',

            'cpf': cliente.cpf or '-',

            'email': cliente.email or '-',

            'telefone': cliente.telefone or '-',

            'cidade_estado': (
                f'{cliente.cidade or "-"} / {cliente.estado or "-"}'
            ),

            'status': cliente.status or 'Inativo',

            'data_cadastro': (
                date_format(cliente.data_inclusao, 'd/m/Y')
                if cliente.data_inclusao else '-'
            ),

            'valor_gasto_total': (
                f'R$ {cliente.valor_gasto or 0:,.2f}'
                .replace(',', 'X')
                .replace('.', ',')
                .replace('X', '.')
            ),

            'ultima_compra': (
                date_format(cliente.ultima_compra, 'd/m/Y')
                if cliente.ultima_compra else '-'
            ),

        }

        resultados_fisicos.append({

            colunas_disponiveis_fisicos[coluna]:
                dados_cliente_fisico[coluna]

            for coluna in colunas_fisicos

        })

    # =========================================
    # EXPORTAR JSON
    # =========================================

    if formato == 'json':

        response = HttpResponse(
            json.dumps(
                resultados_fisicos,
                ensure_ascii=False,
                indent=4
            ),
            content_type='application/json; charset=utf-8'
        )

        response['Content-Disposition'] = (
            'attachment; filename="clientes_fisicos.json"'
        )

        return response

    # =========================================
    # EXPORTAR CSV
    # =========================================

    if formato == 'csv':

        response = HttpResponse(
            content_type='text/csv; charset=cp1252'
        )

        response['Content-Disposition'] = (
            'attachment; filename="clientes_fisicos.csv"'
        )

        writer = csv.writer(
            response,
            delimiter=',',
            quotechar='"',
            quoting=csv.QUOTE_NONNUMERIC
        )

        # CABEÇALHO
        cabecalhos = [
            colunas_disponiveis_fisicos[coluna]
            for coluna in colunas_fisicos
        ]

        writer.writerow(cabecalhos)

        # DADOS
        for resultado in resultados_fisicos:

            valores = []

            for valor in resultado.values():

                if valor is None:

                    valor = ''

                elif isinstance(valor, str):

                    valor = valor.replace(
                        '\r', ''
                    ).replace(
                        '\n', ' '
                    )

                valores.append(valor)

            writer.writerow(valores)

        return response

    # =========================================
    # EXPORTAR XLSX
    # =========================================

    workbook = Workbook()

    worksheet = workbook.active

    worksheet.title = 'Clientes Físicos'

    cabecalhos = [
        colunas_disponiveis_fisicos[coluna]
        for coluna in colunas_fisicos
    ]

    worksheet.append(cabecalhos)

    for resultado in resultados_fisicos:

        worksheet.append(
            list(resultado.values())
        )

    # AJUSTAR LARGURA DAS COLUNAS

    for coluna_excel in worksheet.columns:

        maior_largura = max(
            len(str(celula.value or ''))
            for celula in coluna_excel
        )

        worksheet.column_dimensions[
            coluna_excel[0].column_letter
        ].width = min(maior_largura + 3, 45)

    arquivo = BytesIO()

    workbook.save(arquivo)

    arquivo.seek(0)

    response = HttpResponse(
        arquivo.getvalue(),
        content_type=(
            'application/vnd.openxmlformats-officedocument.'
            'spreadsheetml.sheet'
        )
    )

    response['Content-Disposition'] = (
        'attachment; filename="clientes_fisicos.xlsx"'
    )

    return response


def _obter_usuarios_filtrados(request):
    """
    Retorna os usuários aplicando os filtros compartilhados
    entre a visualização e a exportação.
    """
    usuarios = User.objects.select_related("perfil").all()
    data_inicial = parse_date(request.GET.get("data_inicial", ""))
    data_final = parse_date(request.GET.get("data_final", ""))
    status = request.GET.get("status", "todos")
    conexao = request.GET.get("conexao", "todos")
    acesso = request.GET.get("acesso", "").strip()
    pesquisa = request.GET.get("pesquisa", "").strip()
    ordenar_por = request.GET.get("ordenar_por", "nome")
    ordem = request.GET.get("ordem", "asc")

    # FILTRO POR PERÍODO
    if data_inicial:
        usuarios = usuarios.filter(date_joined__date__gte=data_inicial)

    if data_final:
        usuarios = usuarios.filter(date_joined__date__lte=data_final)

    # STATUS DA CONTA
    if status == "Ativo":
        usuarios = usuarios.filter(is_active=True)

    elif status == "Inativo":
        usuarios = usuarios.filter(is_active=False)

    # STATUS DE CONEXÃO
    if conexao in ["online", "ausente", "offline"]:
        limite_presenca = timezone.now() - timedelta(seconds=90)
        
        if conexao == "online":
            usuarios = usuarios.filter(
                perfil__status_conexao="online",
                perfil__ultimo_ping__gte=limite_presenca
            )
        elif conexao == "ausente":
            usuarios = usuarios.filter(
                perfil__status_conexao="ausente",
                perfil__ultimo_ping__gte=limite_presenca
            )

        elif conexao == "offline":
            usuarios = usuarios.filter(
                Q(perfil__status_conexao="offline") |
                Q(perfil__ultimo_ping__lt=limite_presenca) |
                Q(perfil__ultimo_ping__isnull=True)
            )

    # TIPO DE ACESSO
    if acesso:
        usuarios = usuarios.filter(perfil__acesso__icontains=acesso)

    # PESQUISA GERAL
    if pesquisa:
        usuarios = usuarios.filter(
            Q(first_name__icontains=pesquisa) |
            Q(last_name__icontains=pesquisa) |
            Q(username__icontains=pesquisa) |
            Q(email__icontains=pesquisa) |
            Q(perfil__telefone__icontains=pesquisa) |
            Q(perfil__cpf__icontains=pesquisa) |
            Q(perfil__cnpj__icontains=pesquisa) |
            Q(perfil__rg__icontains=pesquisa) |
            Q(perfil__cidade__icontains=pesquisa) |
            Q(perfil__estado__icontains=pesquisa) |
            Q(perfil__acesso__icontains=pesquisa)
        ).distinct()

    # ORDENAÇÃO
    campos_ordenacao = {
        "nome": "first_name",
        "username": "username",
        "data_cadastro": "date_joined",
        "acesso": "perfil__acesso",
    }

    campo = campos_ordenacao.get(ordenar_por, "first_name")

    if ordem == "desc":
        campo = f"-{campo}"

    usuarios = usuarios.order_by(campo, "username")

    return usuarios


def _formatar_usuario_relatorio(usuario):
    perfil = getattr(usuario, "perfil", None)

    nome = f"{usuario.first_name} {usuario.last_name}".strip()

    return {
        "nome": nome or usuario.username,
        "username": usuario.username,
        "email": usuario.email or "",
        "telefone": perfil.telefone if perfil else "",
        "cpf": perfil.cpf if perfil else "",
        "cnpj": perfil.cnpj if perfil else "",
        "rg": perfil.rg if perfil else "",
        "acesso": perfil.acesso if perfil else "",
        "status": "Ativo" if usuario.is_active else "Inativo",
        "status_conexao": obter_status_conexao(perfil),
        "cidade": perfil.cidade if perfil else "",
        "estado": perfil.estado if perfil else "",
        "data_cadastro": (
            usuario.date_joined.strftime("%d/%m/%Y")
            if usuario.date_joined else ""
        ),
        "data_nascimento": (
            perfil.data_nascimento.strftime("%d/%m/%Y")
            if perfil and perfil.data_nascimento else ""
        ),
    }


def filtrar_usuarios(request):
    """
    Filtra usuários e retorna os resultados em JSON,
    incluindo resumo e paginação.
    """

    usuarios = _obter_usuarios_filtrados(request)

    # RESUMO
    total_usuarios = usuarios.count()
    total_ativos = usuarios.filter(is_active=True).count()
    total_inativos = usuarios.filter(is_active=False).count()

    # PAGINAÇÃO
    paginator = Paginator(usuarios, 10)
    pagina = paginator.get_page(request.GET.get("page", 1))

    resultados = [
        _formatar_usuario_relatorio(usuario)
        for usuario in pagina.object_list
    ]

    intervalo = [
        "…" if str(numero) == paginator.ELLIPSIS else numero
        for numero in paginator.get_elided_page_range(
            pagina.number,
            on_each_side=1,
            on_ends=1
        )
    ]

    dados = {
        "resultados": resultados,

        "total_usuarios": total_usuarios,
        "total_ativos": total_ativos,
        "total_inativos": total_inativos,

        "paginacao": {
            "pagina_atual": pagina.number,
            "total_paginas": paginator.num_pages,
            "tem_anterior": pagina.has_previous(),
            "tem_proxima": pagina.has_next(),
            "pagina_anterior": (
                pagina.previous_page_number()
                if pagina.has_previous() else None
            ),
            "pagina_proxima": (
                pagina.next_page_number()
                if pagina.has_next() else None
            ),
            "inicio": pagina.start_index() if total_usuarios else 0,
            "fim": pagina.end_index() if total_usuarios else 0,
            "intervalo": intervalo,
        }
    }

    return JsonResponse(dados)


def exportar_usuarios(request):
    """
    Exporta os usuários filtrados em CSV, XLSX ou JSON.
    """

    usuarios = _obter_usuarios_filtrados(request)

    formato = request.GET.get("formato", "csv").lower()

    colunas_disponiveis = {
        "nome": "NOME COMPLETO",
        "username": "USUÁRIO",
        "email": "E-MAIL",
        "telefone": "TELEFONE",
        "cpf": "CPF",
        "cnpj": "CNPJ",
        "rg": "RG",
        "acesso": "ACESSO",
        "status": "STATUS DA CONTA",
        "status_conexao": "STATUS DE CONEXÃO",
        "cidade": "CIDADE",
        "estado": "ESTADO",
        "data_cadastro": "DATA DO CADASTRO",
        "data_nascimento": "DATA DE NASCIMENTO",
    }

    colunas = request.GET.getlist("colunas")

    # Mantém somente colunas válidas e na ordem definida
    colunas = [
        coluna for coluna in colunas
        if coluna in colunas_disponiveis
    ]

    if not colunas:
        return JsonResponse(
            {"erro": "Selecione pelo menos uma coluna para exportar."},
            status=400
        )

    dados = [
        _formatar_usuario_relatorio(usuario)
        for usuario in usuarios
    ]

    cabecalhos = [
        colunas_disponiveis[coluna]
        for coluna in colunas
    ]


    # CSV
    if formato == "csv":

        resposta = HttpResponse(
            content_type="text/csv; charset=utf-8-sig"
        )

        resposta["Content-Disposition"] = (
            'attachment; filename="relatorio_usuarios.csv"'
        )

        writer = csv.writer(
            resposta,
            delimiter=",",
            quotechar='"',
            quoting=csv.QUOTE_NONNUMERIC
        )

        # Cabeçalho
        writer.writerow(cabecalhos)

        for usuario in dados:

            valores = []

            for coluna in colunas:
                valor = usuario.get(coluna, "")

                # Evita quebras de linha que possam prejudicar a leitura
                if isinstance(valor, str):
                    valor = valor.replace("\r", "").replace("\n", " ")

                valores.append(valor)

            writer.writerow(valores)

        return resposta

    # XLSX
    elif formato == "xlsx":

        from io import BytesIO

        arquivo = BytesIO()

        workbook = Workbook()
        planilha = workbook.active
        planilha.title = "Usuários"

        planilha.append(cabecalhos)

        for usuario in dados:
            planilha.append([
                usuario[coluna]
                for coluna in colunas
            ])

        # Ajusta largura das colunas
        for coluna in planilha.columns:
            maior_tamanho = max(
                len(str(celula.value or ""))
                for celula in coluna
            )

            planilha.column_dimensions[
                coluna[0].column_letter
            ].width = min(maior_tamanho + 3, 40)

        workbook.save(arquivo)
        arquivo.seek(0)

        resposta = HttpResponse(
            arquivo.getvalue(),
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            )
        )

        resposta["Content-Disposition"] = (
            'attachment; filename="relatorio_usuarios.xlsx"'
        )

        return resposta

    # JSON
    elif formato == "json":

        resultado_json = [
            {
                colunas_disponiveis[coluna]: usuario[coluna]
                for coluna in colunas
            }
            for usuario in dados
        ]

        resposta = HttpResponse(
            json.dumps(
                resultado_json,
                ensure_ascii=False,
                indent=4
            ),
            content_type="application/json; charset=utf-8"
        )

        resposta["Content-Disposition"] = (
            'attachment; filename="relatorio_usuarios.json"'
        )

        return resposta

    return JsonResponse(
        {"erro": "Formato de exportação inválido."},
        status=400
    )

def obter_status_conexao(perfil):
    if not perfil or not perfil.ultimo_ping:
        return "offline"

    limite = timezone.now() - timedelta(seconds=90)

    if perfil.ultimo_ping < limite:
        return "offline"

    return perfil.status_conexao


@login_required
@require_GET
def relatorio_tempo_conexao(request):

    data_inicial = request.GET.get("data_inicial")
    data_final = request.GET.get("data_final")

    agora = timezone.now()

    try:
        if data_inicial:
            inicio = timezone.make_aware(
                datetime.combine(
                    datetime.strptime(data_inicial, "%Y-%m-%d").date(),
                    time.min
                )
            )
        else:
            inicio = timezone.make_aware(
                datetime.combine(agora.date(), time.min)
            )

        if data_final:
            fim = timezone.make_aware(
                datetime.combine(
                    datetime.strptime(data_final, "%Y-%m-%d").date(),
                    time.max
                )
            )
        else:
            fim = agora

    except ValueError:
        return JsonResponse({
            "erro": "Período informado inválido."
        }, status=400)

    if inicio > fim:
        return JsonResponse({
            "erro": "A data inicial não pode ser maior que a final."
        }, status=400)

    usuarios = User.objects.select_related("perfil").all().order_by(
        "first_name",
        "username"
    )

    resultados = []

    for usuario in usuarios:

        segundos = {
            "online": 0,
            "ausente": 0,
            "offline": 0
        }

        historicos = HistoricoConexao.objects.filter(
            usuario=usuario,
            inicio__lte=fim
        ).filter(
            models.Q(fim__isnull=True) | models.Q(fim__gte=inicio)
        ).order_by("inicio")

        for registro in historicos:

            inicio_periodo = max(registro.inicio, inicio)

            fim_periodo = min(
                registro.fim or agora,
                fim,
                agora
            )

            if fim_periodo <= inicio_periodo:
                continue

            duracao = (fim_periodo - inicio_periodo).total_seconds()

            if registro.status in segundos:
                segundos[registro.status] += duracao

        def formatar_tempo(valor):
            valor = int(valor)

            horas, resto = divmod(valor, 3600)
            minutos, segundos_restantes = divmod(resto, 60)

            return f"{horas:02d}h {minutos:02d}min {segundos_restantes:02d}s"

        total = sum(segundos.values())

        nome = usuario.get_full_name() or usuario.username

        resultados.append({
            "id": usuario.id,
            "nome": nome,
            "username": usuario.username,
            "tempo_online": formatar_tempo(segundos["online"]),
            "tempo_ausente": formatar_tempo(segundos["ausente"]),
            "tempo_offline": formatar_tempo(segundos["offline"]),
            "tempo_total": formatar_tempo(total)
        })

    return JsonResponse({
        "resultados": resultados
    })
    
    
@login_required
@require_POST
def alterar_status_usuario_admin(request, usuario_id):

    # Somente administradores
    if not (request.user.is_staff or request.user.is_superuser):
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Você não tem permissão para realizar esta ação."
        }, status=403)

    novo_status = request.POST.get("status", "").strip().lower()

    status_validos = ["online", "ausente", "offline"]

    if novo_status not in status_validos:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Status inválido."
        }, status=400)

    usuario = get_object_or_404(User, pk=usuario_id)

    try:
        with transaction.atomic():

            perfil = (
                PerfilUsuario.objects
                .select_for_update()
                .get(usuario=usuario)
            )

            agora = timezone.now()

            # Verifica se o usuário está realmente conectado
            limite = agora - timedelta(seconds=90)

            conectado = (
                perfil.ultimo_ping is not None
                and perfil.ultimo_ping >= limite
                and usuario.is_active
            )

            # Impede colocar usuários desconectados como Online ou Ausente
            if novo_status in ["online", "ausente"] and not conectado:
                return JsonResponse({
                    "sucesso": False,
                    "mensagem": (
                        f"Não é possível alterar para {novo_status.capitalize()}. "
                        "O usuário não está conectado ao sistema."
                    )
                }, status=400)

            # Impede colocar como Offline alguém que ainda está conectado
            if novo_status == "offline" and conectado:
                return JsonResponse({
                    "sucesso": False,
                    "mensagem": (
                        "O usuário ainda está conectado ao sistema. "
                        "Aguarde a desconexão para definir Offline."
                    )
                }, status=400)

            registrar_transicao_conexao(
                usuario,
                novo_status,
                agora
            )

            perfil.status_conexao = novo_status

            perfil.save(update_fields=["status_conexao"])

        return JsonResponse({
            "sucesso": True,
            "mensagem": f"Status de {usuario.username} alterado para {novo_status}.",
            "status": novo_status,
            "usuario_id": usuario.id
        })

    except PerfilUsuario.DoesNotExist:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "O usuário não possui perfil de conexão."
        }, status=400)

    except Exception as erro:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Não foi possível alterar o status."
        }, status=400)
        

@login_required
def dados_business_intelligence(request):
    """
    API central do Business Intelligence.

    Retorna indicadores e dados dos gráficos:
    - Clientes jurídicos e físicos
    - Usuários
    - Evolução de cadastros
    - Distribuição geográfica
    - Status de conexão
    - Tempo de conexão
    """

    try:
        agora = timezone.now()

        # =====================================================
        # 1. FILTROS DE DATA
        # =====================================================

        data_inicial = parse_date(
            request.GET.get("data_inicial", "")
        )

        data_final = parse_date(
            request.GET.get("data_final", "")
        )

        if data_inicial and data_final and data_inicial > data_final:
            return JsonResponse({
                "sucesso": False,
                "erro": "A data inicial não pode ser maior que a data final."
            }, status=400)

        inicio_periodo = None
        fim_periodo = agora

        if data_inicial:
            inicio_periodo = timezone.make_aware(
                datetime.combine(data_inicial, time.min)
            )

        if data_final:
            fim_periodo = timezone.make_aware(
                datetime.combine(
                    data_final + timedelta(days=1),
                    time.min
                )
            )

        # Sem datas informadas, considera os últimos 12 meses
        # para os gráficos e indicadores de novos cadastros.
        if not data_inicial and not data_final:
            inicio_periodo = agora - timedelta(days=365)

        # =====================================================
        # 2. QUERYSETS
        # =====================================================

        clientes = Cliente.objects.all()

        juridicos = clientes.filter(
            tipo_cliente="juridico"
        )

        fisicos = clientes.filter(
            tipo_cliente="fisico"
        )

        usuarios = User.objects.all()

        # Totais gerais: representam o cadastro atual completo.
        total_juridicos = juridicos.count()
        total_fisicos = fisicos.count()
        total_usuarios = usuarios.count()

        usuarios_ativos = usuarios.filter(
            is_active=True
        ).count()

        percentual_ativos = (
            round((usuarios_ativos / total_usuarios) * 100, 1)
            if total_usuarios else 0
        )

        # =====================================================
        # 3. NOVOS CADASTROS NO PERÍODO
        # =====================================================

        juridicos_periodo = juridicos.filter(
            data_inclusao__gte=inicio_periodo,
            data_inclusao__lt=fim_periodo
        ).count()

        fisicos_periodo = fisicos.filter(
            data_inclusao__gte=inicio_periodo,
            data_inclusao__lt=fim_periodo
        ).count()

        usuarios_periodo = usuarios.filter(
            date_joined__gte=inicio_periodo,
            date_joined__lt=fim_periodo
        ).count()

        # =====================================================
        # 4. EVOLUÇÃO MENSAL DE CADASTROS
        # =====================================================

        def evolucao_mensal(queryset, campo_data):
            resultado = (
                queryset
                .filter(
                    **{
                        f"{campo_data}__gte": inicio_periodo,
                        f"{campo_data}__lt": fim_periodo
                    }
                )
                .annotate(
                    mes=TruncMonth(campo_data)
                )
                .values("mes")
                .annotate(total=Count("id"))
                .order_by("mes")
            )

            return {
                item["mes"].strftime("%Y-%m"): item["total"]
                for item in resultado
            }

        evolucao_juridicos = evolucao_mensal(
            juridicos,
            "data_inclusao"
        )

        evolucao_fisicos = evolucao_mensal(
            fisicos,
            "data_inclusao"
        )

        evolucao_usuarios = evolucao_mensal(
            usuarios,
            "date_joined"
        )

        evolucao_clientes = {}

        for dados in [evolucao_juridicos, evolucao_fisicos]:
            for mes, total in dados.items():
                evolucao_clientes[mes] = (
                    evolucao_clientes.get(mes, 0) + total
                )

        meses = sorted(
            set(evolucao_clientes)
            | set(evolucao_usuarios)
        )

        def formatar_evolucao(dados):
            return [
                dados.get(mes, 0)
                for mes in meses
            ]

        # =====================================================
        # 5. DISTRIBUIÇÃO POR ESTADO
        # =====================================================

        def distribuicao_estados(queryset):
            resultado = (
                queryset
                .filter(
                    data_inclusao__gte=inicio_periodo,
                    data_inclusao__lt=fim_periodo
                )
                .exclude(estado__isnull=True)
                .exclude(estado="")
                .values("estado")
                .annotate(total=Count("id"))
                .order_by("-total")
            )

            return {
                item["estado"]: item["total"]
                for item in resultado
            }

        estados_juridicos = distribuicao_estados(juridicos)
        estados_fisicos = distribuicao_estados(fisicos)

        # =====================================================
        # 6. SITUAÇÃO DOS USUÁRIOS
        # =====================================================

        total_inativos = total_usuarios - usuarios_ativos

        # =====================================================
        # 7. STATUS ATUAL DE CONEXÃO
        # =====================================================

        perfis = PerfilUsuario.objects.filter(
            usuario__is_active=True
        )

        status_conexao = {
            "online": perfis.filter(
                status_conexao="online"
            ).count(),

            "ausente": perfis.filter(
                status_conexao="ausente"
            ).count(),

            "offline": perfis.filter(
                status_conexao="offline"
            ).count(),
        }

        # =====================================================
        # 8. TEMPO DE CONEXÃO
        # =====================================================

        historicos = HistoricoConexao.objects.filter(
            inicio__lt=fim_periodo
        ).filter(
            models.Q(fim__isnull=True) |
            models.Q(fim__gt=inicio_periodo)
        )

        tempos_conexao = {
            "online": 0,
            "ausente": 0,
            "offline": 0,
        }

        for registro in historicos.iterator():
            inicio = max(
                registro.inicio,
                inicio_periodo
            )

            fim_registro = registro.fim or agora

            fim = min(
                fim_registro,
                fim_periodo
            )

            segundos = max(
                0,
                int((fim - inicio).total_seconds())
            )

            if registro.status in tempos_conexao:
                tempos_conexao[registro.status] += segundos

        # Converter segundos em horas.
        tempos_conexao_horas = {
            status: round(segundos / 3600, 2)
            for status, segundos in tempos_conexao.items()
        }

        # =====================================================
        # 9. RESPOSTA JSON
        # =====================================================

        return JsonResponse({
            "sucesso": True,

            "indicadores": {
                "total_juridicos": total_juridicos,
                "total_fisicos": total_fisicos,
                "total_usuarios": total_usuarios,
                "usuarios_ativos": usuarios_ativos,
                "usuarios_inativos": total_inativos,
                "percentual_usuarios_ativos": percentual_ativos,

                "novos_juridicos": juridicos_periodo,
                "novos_fisicos": fisicos_periodo,
                "novos_usuarios": usuarios_periodo,
            },

            "evolucao": {
                "meses": meses,
                "clientes": formatar_evolucao(
                    evolucao_clientes
                ),
                "juridicos": formatar_evolucao(
                    evolucao_juridicos
                ),
                "fisicos": formatar_evolucao(
                    evolucao_fisicos
                ),
                "usuarios": formatar_evolucao(
                    evolucao_usuarios
                ),
            },

            "estados": {
                "juridicos": estados_juridicos,
                "fisicos": estados_fisicos,
            },

            "situacao_usuarios": {
                "ativos": usuarios_ativos,
                "inativos": total_inativos,
            },

            "status_conexao": status_conexao,

            "tempo_conexao": tempos_conexao_horas,

            "periodo": {
                "data_inicial": inicio_periodo.date().isoformat(),
                "data_final": (
                    fim_periodo - timedelta(days=1)
                ).date().isoformat(),
            }
        })

    except Exception as erro:
        return JsonResponse({
            "sucesso": False,
            "erro": str(erro)
        }, status=500)

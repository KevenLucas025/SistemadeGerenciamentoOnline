import json
from decimal import Decimal
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST
from django.template.loader import render_to_string
from django.utils import timezone
from produtos.models import Produto, SaidaProduto, HistoricoProduto


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

        # 1. Subtrai a quantidade do produto no estoque e recalcula os totais
        nova_qtd_estoque = produto.quantidade - qtd_solicitada
        tot_sem_estoque, tot_com_estoque = calcular_totais(
            nova_qtd_estoque, produto.valor_unitario, produto.desconto
        )

        dados_up = {
            'quantidade': nova_qtd_estoque,
            'status_saida': 1  # Mantém eternamente 1 - Gerado Saída
        }
        if hasattr(produto, 'valor_total'):
            dados_up['valor_total'] = tot_com_estoque
        if hasattr(produto, 'total_com_desconto'):
            dados_up['total_com_desconto'] = tot_com_estoque
        if hasattr(produto, 'total_sem_desconto'):
            dados_up['total_sem_desconto'] = tot_sem_estoque

        Produto.objects.filter(id=produto.id).update(**dados_up)

        # 2. Cria o registro na tabela de saídas
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
            criado_por=request.user
        )

        # 3. Registra auditoria no histórico
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
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST
from django.template.loader import render_to_string
from django.utils import timezone
from django.db.models import Q
from produtos.models import Produto


@login_required
def estoque_view(request):
    produtos_estoque = Produto.objects.filter(
        status_saida=0
    ).select_related(
        'criado_por', 'cliente'
    ).order_by('-id')

    produtos_saida = Produto.objects.filter(
        status_saida=1
    ).select_related(
        'criado_por', 'cliente'
    ).order_by('-id')

    print("\n" + "=" * 80)
    print(">>> [F5 ESTOQUE]")

    for produto in produtos_estoque:
        print(
            f"ID={produto.id} | "
            f"NOME={produto.nome} | "
            f"CODIGO={produto.codigo} | "
            f"STATUS={produto.status_saida}"
        )

    print(">>> [F5 SAÍDA]")

    for produto in produtos_saida:
        print(
            f"ID={produto.id} | "
            f"NOME={produto.nome} | "
            f"CODIGO={produto.codigo} | "
            f"STATUS={produto.status_saida}"
        )

    print("=" * 80 + "\n")

    contexto = {
        'produtos': produtos_estoque,
        'saidas': produtos_saida,
    }

    return render(
        request,
        'estoque.html',
        contexto
    )


@login_required
@require_GET
def atualizar_tabela_estoque_status(request):
    """
    Endpoint AJAX para devolver as linhas em HTML atualizadas de 'estoque' ou 'saida'.
    """
    tipo = request.GET.get('tipo', 'estoque').lower()

    if tipo == 'saida':
        saidas = Produto.objects.filter(
            status_saida=1
        ).select_related('criado_por', 'cliente').order_by('-id')

        html_linhas = render_to_string(
            'estoque/linhas_tabela_saidas.html',
            {'saidas': saidas},
            request=request
        )
        total = saidas.count()
    else:
        produtos = Produto.objects.filter(
            status_saida=0
        ).select_related(
            'criado_por', 'cliente'
        ).order_by('-id')

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
    print(f">>> [DEBUG] Recebida solicitação de saída para o ID: {produto_id}")

    try:
        produto = get_object_or_404(Produto, id=produto_id)

        # Registra a saída com data e hora exatas da confirmação
        Produto.objects.filter(id=produto_id).update(
            status_saida=1,
            data_saida=timezone.now()
        )

        # Recarrega os dados diretamente do banco
        produto.refresh_from_db()

        print(
            f">>> [DEBUG] Produto ID: {produto.id} | "
            f"Status: {produto.status_saida} | "
            f"Data da saída: {produto.data_saida}"
        )

        return JsonResponse({
            'sucesso': True,
            'mensagem': f'Saída do produto "{produto.nome}" gerada com sucesso!'
        })

    except Exception as e:
        print(f">>> [ERRO]: {str(e)}")

        return JsonResponse({
            'sucesso': False,
            'mensagem': str(e)
        }, status=500)


@login_required
@require_POST
def gerar_estorno_produto(request, produto_id):
    try:
        produto = get_object_or_404(Produto, id=produto_id)

        # Retorna status para 0 diretamente no banco
        dados_estorno = {'status_saida': 0}
        if hasattr(produto, 'data_saida'):
            dados_estorno['data_saida'] = None

        Produto.objects.filter(id=produto_id).update(**dados_estorno)

        return JsonResponse({
            'sucesso': True,
            'mensagem': f'Estorno do produto "{produto.nome}" realizado com sucesso!'
        })

    except Exception as e:
        return JsonResponse({
            'sucesso': False,
            'mensagem': f'Erro interno ao processar estorno: {str(e)}'
        }, status=500)
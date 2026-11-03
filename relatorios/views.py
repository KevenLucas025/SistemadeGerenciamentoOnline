from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from clientes.models import Cliente
from django.core.paginator import Paginator


@login_required
def relatorios(request):
    valor_movimentado = (
        Cliente.objects.aggregate(
            total=Sum('valor_gasto')
        )['total'] or 0
    )

    valor_movimentado = f"{valor_movimentado:,.2f}"
    valor_movimentado = (
        valor_movimentado
        .replace(",", "X")
        .replace(".", ",")
        .replace("X", ".")
    )
    
    clientes_queryset = Cliente.objects.all().order_by(
        '-data_inclusao'
    )
    
    paginator = Paginator(clientes_queryset, 5)
    
    pagina_atual = request.GET.get('page',1)
    clientes = paginator.get_page(pagina_atual)

    return render(
        request,
        'relatorios.html',
        {
            'valor_movimentado': valor_movimentado,
            'clientes': clientes,
            'paginator': paginator
        }
    )
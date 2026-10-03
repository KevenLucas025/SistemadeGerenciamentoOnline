from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from clientes.models import Cliente


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

    return render(
        request,
        'relatorios.html',
        {
            'valor_movimentado': valor_movimentado,
        }
    )
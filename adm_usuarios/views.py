from datetime import timedelta

from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import render
from django.utils import timezone


@login_required
def adm_usuarios(request):

    hoje = timezone.now()

    trinta_dias_atras = hoje - timedelta(days=30)

    # =========================================
    # USUÁRIOS
    # =========================================

    usuarios = User.objects.all().order_by("-date_joined")


    # =========================================
    # BUSCA
    # =========================================

    busca = request.GET.get("busca", "").strip()

    if busca:
        usuarios = usuarios.filter(
            Q(first_name__icontains=busca) |
            Q(last_name__icontains=busca) |
            Q(username__icontains=busca) |
            Q(email__icontains=busca)
        )


    # =========================================
    # STATUS
    # =========================================

    status = request.GET.get("status", "").strip()

    if status == "ativo":

        usuarios = usuarios.filter(
            is_active=True
        )

    elif status == "inativo":

        usuarios = usuarios.filter(
            is_active=False
        )


    # =========================================
    # PAGINAÇÃO
    # =========================================

    # Quantidade de usuários exibidos por página
    usuarios_por_pagina = 5

    paginator = Paginator(
        usuarios,
        usuarios_por_pagina
    )

    pagina = request.GET.get("page", 1)

    usuarios = paginator.get_page(pagina)


    # =========================================
    # ESTATÍSTICAS
    # =========================================

    total_usuarios = User.objects.count()

    usuarios_ativos = User.objects.filter(
        is_active=True
    ).count()

    usuarios_inativos = User.objects.filter(
        is_active=False
    ).count()

    usuarios_novos = User.objects.filter(
        date_joined__gte=trinta_dias_atras
    ).count()


    # =========================================
    # CONTEXTO
    # =========================================

    contexto = {

        "usuarios": usuarios,

        "total_usuarios": total_usuarios,

        "usuarios_ativos": usuarios_ativos,

        "usuarios_inativos": usuarios_inativos,

        "usuarios_novos": usuarios_novos,

        "busca": busca,

        "status_selecionado": status,

    }


    return render(
        request,
        "adm_usuarios.html",
        contexto
    )
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.template.loader import render_to_string
from django.views.decorators.http import require_GET


@login_required
@require_GET
def atualizar_tabela_usuarios_status(request):
    """
    Retorna apenas as linhas HTML da tabela solicitada ('ativos' ou 'inativos').
    """
    status_tipo = request.GET.get("tipo", "ativos").lower()

    if status_tipo == "inativos":
        usuarios_lista = User.objects.filter(is_active=False).select_related("perfil").order_by("-date_joined")
        template_parcial = "usuarios/linhas_tabela_inativos.html"
        context_var = "usuarios_inativos"
    else:
        usuarios_lista = User.objects.filter(is_active=True).select_related("perfil").order_by("-date_joined")
        template_parcial = "usuarios/linhas_tabela_ativos.html"
        context_var = "usuarios"

    context = {
        context_var: usuarios_lista,
        "usuario_atual_id": request.user.id,
        "request": request,
    }

    html_linhas = render_to_string(template_parcial, context, request=request)

    return JsonResponse({
        "sucesso": True,
        "tipo": status_tipo,
        "quantidade": usuarios_lista.count(),
        "html": html_linhas
    })
    
    

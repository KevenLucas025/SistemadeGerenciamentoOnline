from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.template.loader import render_to_string
from django.views.decorators.http import require_GET
from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404
from django.utils import timezone
from accounts.models import PerfilUsuario  
from .models import HistoricoUsuario


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
    
@login_required
@require_POST
def gerar_saida_usuario(request, usuario_id):
    if request.user.id == usuario_id:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Você não pode gerar saída para a sua própria conta conectada."
        }, status=400)

    try:
        usuario = get_object_or_404(User, id=usuario_id)

        if not usuario.is_active:
            return JsonResponse({
                "sucesso": False,
                "mensagem": "Este usuário já está inativo."
            }, status=400)

        # 1. Inativa o usuário no Django
        usuario.is_active = False
        usuario.save()

        # 2. Garante a existência do perfil (evita erro "User has no perfil")
        perfil, _ = PerfilUsuario.objects.get_or_create(usuario=usuario)
        perfil.data_inatividade = timezone.now()
        perfil.save(update_fields=["data_inatividade"])
        
        # 2. Grava no Histórico
        HistoricoUsuario.objects.create(
            acao='saida',
            descricao=f"O usuário {usuario.get_full_name() or usuario.username} teve a saída gerada e foi inativado.",
            usuario_afetado=usuario,
            nome_usuario_afetado=usuario.get_full_name() or usuario.username,
            usuario_responsavel=request.user
        )

        return JsonResponse({
            "sucesso": True,
            "mensagem": f"Saída gerada com sucesso! O usuário '{usuario.username}' agora está inativo."
        })

    except Exception as e:
        return JsonResponse({
            "sucesso": False,
            "mensagem": f"Erro interno ao gerar saída: {str(e)}"
        }, status=500)
        
        
@login_required
def listar_historico(request):
    registros = HistoricoUsuario.objects.all().select_related('usuario_responsavel')
    
    dados = []
    for r in registros:
        dados.append({
            "id": r.id,
            "data_hora": r.data_hora.strftime("%d/%m/%Y %H:%M:%S"),
            "usuario_logado": r.usuario_responsavel.username if r.usuario_responsavel else "Sistema",
            "acao": r.get_acao_display(),
            "descricao": r.descricao,
            
        })

    return JsonResponse({"sucesso": True, "historico": dados})
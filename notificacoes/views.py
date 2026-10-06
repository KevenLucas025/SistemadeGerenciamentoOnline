from datetime import timedelta
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST
from .models import Notificacao


@login_required
@require_GET
def listar_notificacoes(request):
    limite = timezone.now() - timedelta(days=30)

    notificacoes = Notificacao.objects.filter(
        destinatario=request.user,
        criado_em__gte=limite
    ).order_by("-criado_em")

    quantidade_nao_lidas = notificacoes.filter(lida=False).count()

    dados = []
    for notificacao in notificacoes:
        dados.append({
            "id": notificacao.id,
            "mensagem": notificacao.mensagem,
            "tipo": getattr(notificacao, "tipo", "info"),
            "lida": notificacao.lida,
            "criado_em": (
                timezone.localtime(notificacao.criado_em).strftime("%d/%m/%Y %H:%M")
                if notificacao.criado_em
                else "-"
            ),
        })

    return JsonResponse({
        "sucesso": True,
        "quantidade_nao_lidas": quantidade_nao_lidas,
        "notificacoes": dados,
    })


@login_required
@require_POST
def marcar_como_lida(request, notificacao_id):
    try:
        notificacao = Notificacao.objects.get(
            id=notificacao_id,
            destinatario=request.user
        )

        notificacao.lida = True
        notificacao.save(update_fields=["lida"])

        return JsonResponse({"sucesso": True})

    except Notificacao.DoesNotExist:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Notificação não encontrada."
        }, status=404)


@login_required
@require_POST
def marcar_todas_lidas(request):
    """Marca todas as notificações pendentes do usuário logado como lidas."""
    Notificacao.objects.filter(
        destinatario=request.user,
        lida=False
    ).update(lida=True)

    return JsonResponse({
        "sucesso": True,
        "mensagem": "Todas as notificações foram marcadas como lidas."
    })


@login_required
@require_GET
def historico_notificacoes(request):
    """Retorna todo o histórico de notificações do usuário logado."""
    notificacoes = Notificacao.objects.filter(
        destinatario=request.user
    ).order_by("-criado_em")[:100]

    dados = []
    for notificacao in notificacoes:
        dados.append({
            "id": notificacao.id,
            "mensagem": notificacao.mensagem,
            "tipo": getattr(notificacao, "tipo", "info"),
            "lida": notificacao.lida,
            "criado_em": (
                timezone.localtime(notificacao.criado_em).strftime("%d/%m/%Y %H:%M")
                if notificacao.criado_em
                else "-"
            ),
        })

    return JsonResponse({
        "sucesso": True,
        "notificacoes": dados,
    })
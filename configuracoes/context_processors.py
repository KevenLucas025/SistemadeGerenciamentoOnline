
from .models import PreferenciasUsuario
from django.contrib.auth.models import User


def preferencias_usuario(request):
    tema = "escuro"
    tema_conta_identificada = False

    if request.user.is_authenticated:

        preferencias = getattr(
            request.user,
            "preferencias",
            None
        )

        if preferencias:
            tema = preferencias.tema

    else:
        # Recupera o tema da conta informada no login.
        usuario_input = request.POST.get("username", "").strip()

        if usuario_input:

            usuario = User.objects.filter(
                username__iexact=usuario_input
            ).first()

            if not usuario:
                usuario = User.objects.filter(
                    email__iexact=usuario_input
                ).first()

            if usuario:

                preferencias = PreferenciasUsuario.objects.filter(
                    usuario=usuario
                ).first()

                if preferencias:
                    tema = preferencias.tema
                    tema_conta_identificada = True

    return {
        "tema_usuario": tema,
        "tema_conta_identificada": tema_conta_identificada,
    }

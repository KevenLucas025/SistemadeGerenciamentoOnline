
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.shortcuts import render, redirect
from django.views.decorators.http import require_http_methods
from django.db import transaction

from .models import PreferenciasUsuario, ConfiguracoesSistema
from .forms import (
    PreferenciasUsuarioForm,
    ConfiguracoesSistemaForm
)


@login_required
@require_http_methods(["GET", "POST"])
def configuracoes(request):

    preferencias, _ = PreferenciasUsuario.objects.get_or_create(
        usuario=request.user
    )

    configuracoes_sistema = ConfiguracoesSistema.obter_configuracoes()

    if request.method == "POST":

        preferencias_form = PreferenciasUsuarioForm(
            request.POST,
            instance=preferencias
        )

        # Validação das preferências pessoais
        preferencias_validas = preferencias_form.is_valid()

        # Configurações compartilhadas somente para administradores
        if request.user.is_staff:

            sistema_form = ConfiguracoesSistemaForm(
                request.POST,
                instance=configuracoes_sistema
            )

            sistema_valido = sistema_form.is_valid()

        else:

            sistema_form = ConfiguracoesSistemaForm(
                instance=configuracoes_sistema
            )

            # Não validar formulário que não foi enviado
            sistema_valido = True

        if preferencias_validas and sistema_valido:

            with transaction.atomic():

                preferencias_form.save()

                if request.user.is_staff:
                    sistema_form.save()

            messages.success(
                request,
                "Configurações salvas com sucesso!"
            )

            return redirect("configuracoes")

    else:

        preferencias_form = PreferenciasUsuarioForm(
            instance=preferencias
        )

        sistema_form = ConfiguracoesSistemaForm(
            instance=configuracoes_sistema
        )

    context = {
        "preferencias_form": preferencias_form,
        "sistema_form": sistema_form,
        "configuracoes_sistema": configuracoes_sistema,
        "pode_editar_sistema": request.user.is_staff,
    }

    return render(
        request,
        "configuracoes.html",
        context
    )

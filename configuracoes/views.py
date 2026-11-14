from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.shortcuts import render, redirect
from django.views.decorators.http import require_http_methods
from .models import PreferenciasUsuario, ConfiguracoesSistema
from .forms import (PreferenciasUsuarioForm,ConfiguracoesSistemaForm)


@login_required
@require_http_methods(["GET", "POST"])
def configuracoes(request):

    preferencias, _ = PreferenciasUsuario.objects.get_or_create(
        usuario=request.user
    )

    preferencias_form = PreferenciasUsuarioForm(
        instance=preferencias
    )

    configuracoes_sistema = ConfiguracoesSistema.obter_configuracoes()

    sistema_form = ConfiguracoesSistemaForm(
        instance=configuracoes_sistema
    )

    if request.method == "POST":

        preferencias_form = PreferenciasUsuarioForm(
            request.POST,
            instance=preferencias
        )

        # Somente administradores podem alterar
        # as configurações compartilhadas.
        if request.user.is_staff:

            sistema_form = ConfiguracoesSistemaForm(
                request.POST,
                instance=configuracoes_sistema
            )

        else:
            sistema_form = ConfiguracoesSistemaForm(
                instance=configuracoes_sistema
            )

        if preferencias_form.is_valid() and sistema_form.is_valid():

            preferencias_form.save()

            if request.user.is_staff:
                sistema_form.save()

            messages.success(
                request,
                "Configurações salvas com sucesso!"
            )

            return redirect("configuracoes")

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

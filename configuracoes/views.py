
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
        
        print(
            "POST confirmar_exclusao:",
            request.POST.get("confirmar_exclusao")
        )

        print(
            "Valor validado pelo formulário:",
            preferencias_form.data.get("confirmar_exclusao")
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

            sistema_valido = True

        # =====================================================
        # DIAGNÓSTICO TEMPORÁRIO
        # =====================================================

        print("\n========== DIAGNÓSTICO CONFIGURAÇÕES ==========")

        print(
            "Página inicial recebida:",
            request.POST.get("pagina_inicial")
        )

        print(
            "Preferências válidas:",
            preferencias_validas
        )

        print(
            "Erros das preferências:",
            preferencias_form.errors
        )

        print(
            "Configurações do sistema válidas:",
            sistema_valido
        )

        if request.user.is_staff:
            print(
                "Erros do sistema:",
                sistema_form.errors
            )

        print("===============================================\n")

        # =====================================================
        # SALVAMENTO
        # =====================================================

        if preferencias_validas and sistema_valido:

            with transaction.atomic():

                preferencias_form.save()

                if request.user.is_staff:
                    sistema_form.save()
            
            print(
                "Valor da instância após save:",
                preferencias.confirmar_exclusao
            )

            # Confirma o valor efetivamente persistido no banco
            preferencias.refresh_from_db()

            print(
                "Página inicial salva no banco:",
                preferencias.pagina_inicial
            )

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

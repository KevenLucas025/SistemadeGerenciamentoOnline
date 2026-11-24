from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.urls import reverse
from .models import PerfilUsuario
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.utils import timezone
import json
from datetime import timedelta
from accounts.models import HistoricoConexao



def login_view(request):
    active_pane = (
        'register'
        if 'register' in request.GET or 'cadastro' in request.GET
        else 'login'
    )

    context = {
        'active_pane': active_pane,
        'esconder_menu': True,
    }

    if request.method == 'POST':
        usuario_input = request.POST.get('username', '').strip()
        senha_input = request.POST.get('password', '').strip()

        # Preserva o usuário digitado caso ocorra algum erro.
        context['usuario_digitado'] = usuario_input

        if not usuario_input or not senha_input:
            messages.error(request, 'Por favor, preencha todos os campos.')
            return render(request, 'accounts/login.html', context)

        user_obj = User.objects.filter(username=usuario_input).first()

        if not user_obj:
            user_obj = User.objects.filter(email=usuario_input).first()

        if not user_obj:
            messages.error(request, 'Usuário ou e-mail não cadastrado.')
            return render(request, 'accounts/login.html', context)

        user = authenticate(
            request,
            username=user_obj.username,
            password=senha_input
        )

        if user is not None:
            login(request, user)
            return redirect('pagina_inicial')

        messages.error(request, 'Usuário ou senha inválidos.')
        return render(request, 'accounts/login.html', context)

    return render(request, 'accounts/login.html', context)



def register(request):
    if request.method == 'POST':
        nome_completo = request.POST.get('nome_completo', '').strip()
        username = request.POST.get('new_user', '').strip()
        email = request.POST.get('new_email', '').strip()
        password = request.POST.get('new_pass', '').strip()
        confirm = request.POST.get('new_confirm', '').strip()

        if not nome_completo or not username or not email or not password or not confirm:
            messages.error(request, 'Preencha todos os campos.')
            return redirect(f"{reverse('login')}?register")

        if password != confirm:
            messages.error(request, 'As senhas não coincidem.')
            return redirect(f"{reverse('login')}?register")

        if User.objects.filter(username=username).exists():
            messages.error(request, 'Usuário já existe.')
            return redirect(f"{reverse('login')}?register")

        if User.objects.filter(email=email).exists():
            messages.error(request, 'E-mail já cadastrado.')
            return redirect(f"{reverse('login')}?register")

        usuario = User.objects.create_user(
            username=username, 
            email=email, 
            password=password, 
            first_name=nome_completo
        )
        PerfilUsuario.objects.create(
            usuario=usuario,
            senha_visivel=password
        )
        messages.success(request, 'Conta criada com sucesso!')
        return redirect(f"{reverse('login')}?cadastro")

    return redirect('login')


@login_required
@require_POST
def atualizar_status_usuario(request):
    status = request.POST.get("status", "").strip().lower()

    status_validos = ["online", "ausente", "offline"]

    if status not in status_validos:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Status inválido."
        }, status=400)

    try:
        perfil = request.user.perfil
        agora = timezone.now()

        registrar_transicao_conexao(
            request.user,
            status,
            agora
        )

        perfil.status_conexao = status
        perfil.ultimo_ping = agora

        perfil.save(update_fields=[
            "status_conexao",
            "ultimo_ping"
        ])

        return JsonResponse({
            "sucesso": True,
            "status": perfil.status_conexao,
            "mensagem": "Status atualizado com sucesso."
        })

    except Exception as erro:
        return JsonResponse({
            "sucesso": False,
            "mensagem": str(erro)
        }, status=400)

        
        

@login_required
@require_POST
def atualizar_presenca(request):
    try:
        perfil = request.user.perfil

        agora = timezone.now()
        ultimo_ping = perfil.ultimo_ping
        limite = timedelta(seconds=90)

        # Verifica se a conexão anterior expirou.
        if ultimo_ping and agora - ultimo_ping > limite:

            momento_offline = ultimo_ping + limite

            # Registra o início do período offline.
            registrar_transicao_conexao(
                request.user,
                "offline",
                momento_offline
            )

            # Se o status manual for online ou ausente,
            # registra o retorno ao status escolhido.
            if perfil.status_conexao != "offline":
                registrar_transicao_conexao(
                    request.user,
                    perfil.status_conexao,
                    agora
                )

        else:
            # Garante que exista um histórico inicial.
            registrar_transicao_conexao(
                request.user,
                perfil.status_conexao,
                agora
            )

        # Atualiza somente o horário do ping.
        perfil.ultimo_ping = agora
        perfil.save(update_fields=["ultimo_ping"])

        return JsonResponse({
            "sucesso": True,
            "status": perfil.status_conexao
        })

    except Exception as erro:
        return JsonResponse({
            "sucesso": False,
            "mensagem": str(erro)
        }, status=400)

def registrar_transicao_conexao(usuario, novo_status, momento=None):
    """
    Encerra o período anterior e inicia um novo
    somente quando houver mudança de status.
    """

    momento = momento or timezone.now()

    historico_aberto = (
        HistoricoConexao.objects
        .filter(usuario=usuario, fim__isnull=True)
        .order_by("-inicio")
        .first()
    )

    if historico_aberto:
        if historico_aberto.status == novo_status:
            return

        historico_aberto.fim = momento
        historico_aberto.save(update_fields=["fim"])

    HistoricoConexao.objects.create(
        usuario=usuario,
        status=novo_status,
        inicio=momento
    )
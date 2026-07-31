from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.urls import reverse
from .models import PerfilUsuario

def login_view(request):
    if request.method == 'POST':
        usuario_input = request.POST.get('username', '').strip()
        senha_input = request.POST.get('password', '').strip()

        if not usuario_input or not senha_input:
            messages.error(request, 'Por favor, preencha todos os campos.')
            return render(request, 'accounts/login.html')

        user_obj = User.objects.filter(username=usuario_input).first()
        if not user_obj:
            user_obj = User.objects.filter(email=usuario_input).first()

        if not user_obj:
            messages.error(request, 'Usuário ou e-mail não cadastrado.')
            return render(request, 'accounts/login.html')

        user = authenticate(request, username=user_obj.username, password=senha_input)
        if user is not None:
            login(request, user)
            return redirect('dashboard')

        messages.error(request, 'Usuário ou senha inválidos.')

    active_pane = 'register' if 'register' in request.GET or 'cadastro' in request.GET else 'login'
    return render(request, 'accounts/login.html', {'active_pane': active_pane})

def register(request):
    if request.method == 'POST':
        nome_completo = request.POST.get('nome_completo', '').strip()
        username = request.POST.get('new_user', '').strip()
        email = request.POST.get('new_email', '').strip()
        password = request.POST.get('new_pass', '').strip()
        confirm = request.POST.get('new_confirm', '').strip()

        # Usamos reverse('login') para obter a URL correta e concatenamos os parâmetros dinamicamente
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

        usuario = User.objects.create_user(username=username, email=email, password=password, first_name=nome_completo)
        PerfilUsuario.objects.create(
            usuario=usuario,
            senha_visivel=password
        )
        messages.success(request, 'Conta criada com sucesso!')
        return redirect(f"{reverse('login')}?cadastro")

    return redirect('login')


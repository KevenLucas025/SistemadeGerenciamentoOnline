from datetime import timedelta
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.core.paginator import Paginator
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404, render
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.core.validators import validate_email
from django.views.decorators.http import require_http_methods
from accounts.models import PerfilUsuario
from datetime import timedelta, date, datetime, time

@login_required
def adm_usuarios(request):

    hoje = timezone.now()
    trinta_dias_atras = hoje - timedelta(days=30)

    usuarios = User.objects.select_related(
        "perfil"
    ).all().order_by("-date_joined")

    # =========================================
    # BUSCA
    # =========================================

    busca = request.GET.get("busca", "").strip()

    if busca:
        termos = busca.split()

        for termo in termos:
            usuarios = usuarios.filter(
                Q(first_name__icontains=termo) |
                Q(last_name__icontains=termo) |
                Q(username__icontains=termo) |
                Q(email__icontains=termo)
            )

    # =========================================
    # FILTRO DE PERFIL
    # =========================================

    perfis = {
        "administrador": "Administrador",
        "gerente": "Gerente",
        "analista": "Analista",
        "assistente": "Assistente",
        "comum": "Usuário Comum",
        "visualizador": "Visualizador",
    }

    perfil = request.GET.get("perfil", "").strip().lower()

    if perfil in perfis:
        usuarios = usuarios.filter(
            perfil__acesso__iexact=perfis[perfil]
        )
    else:
        perfil = ""

    # =========================================
    # FILTRO DE STATUS
    # =========================================

    status = request.GET.get("status", "").strip()

    if status in ["ativo", "inativo", "bloqueado"]:
        usuarios = usuarios.filter(
            perfil__status_conta=status
        )
    else:
        status = ""

    # =========================================
    # FILTROS AVANÇADOS
    # =========================================

    hoje_data = timezone.localdate()

    # PERÍODO DE CADASTRO

    periodo_cadastro = request.GET.get(
        "periodo_cadastro", ""
    ).strip()

    if periodo_cadastro == "este_mes":

        inicio_mes = hoje_data.replace(day=1)

        usuarios = usuarios.filter(
            date_joined__date__gte=inicio_mes,
            date_joined__date__lte=hoje_data
        )

    elif periodo_cadastro == "mes_passado":

        inicio_mes_atual = hoje_data.replace(day=1)

        fim_mes_passado = inicio_mes_atual - timedelta(days=1)

        inicio_mes_passado = fim_mes_passado.replace(day=1)

        usuarios = usuarios.filter(
            date_joined__date__gte=inicio_mes_passado,
            date_joined__date__lte=fim_mes_passado
        )

    elif periodo_cadastro == "7_dias":

        limite = timezone.now() - timedelta(days=7)

        usuarios = usuarios.filter(
            date_joined__gte=limite
        )

    elif periodo_cadastro == "30_dias":

        limite = timezone.now() - timedelta(days=30)

        usuarios = usuarios.filter(
            date_joined__gte=limite
        )

    elif periodo_cadastro == "personalizado":

        data_inicial = request.GET.get("data_inicial", "")
        data_final = request.GET.get("data_final", "")

        try:
            inicio = date.fromisoformat(data_inicial)
            fim = date.fromisoformat(data_final)

            if inicio <= fim:
                usuarios = usuarios.filter(
                    date_joined__date__gte=inicio,
                    date_joined__date__lte=fim
                )

        except (ValueError, TypeError):
            pass

    else:
        periodo_cadastro = ""

    # =========================================
    # FILTRO DE ÚLTIMO ACESSO
    # =========================================

    ultimo_acesso = request.GET.get(
        "ultimo_acesso", ""
    ).strip()

    agora = timezone.now()

    if ultimo_acesso == "7_dias":

        usuarios = usuarios.filter(
            last_login__gte=agora - timedelta(days=7)
        )

    elif ultimo_acesso == "30_dias":

        usuarios = usuarios.filter(
            last_login__gte=agora - timedelta(days=30)
        )

    elif ultimo_acesso == "sem_30_dias":

        limite = agora - timedelta(days=30)

        usuarios = usuarios.filter(
            Q(last_login__isnull=True) |
            Q(last_login__lt=limite)
        )

    elif ultimo_acesso == "nunca":

        usuarios = usuarios.filter(
            last_login__isnull=True
        )

    else:
        ultimo_acesso = ""

    # =========================================
    # TOTAL DE RESULTADOS
    # Todos os filtros já foram aplicados
    # =========================================

    total_resultados = usuarios.count()

    # =========================================
    # PAGINAÇÃO
    # =========================================
    paginator = Paginator(usuarios, 5)
    pagina = request.GET.get("page", 1)
    usuarios = paginator.get_page(pagina)

    # =========================================
    # ESTATÍSTICAS GERAIS
    # =========================================

    total_usuarios = User.objects.count()

    usuarios_ativos = User.objects.filter(
        perfil__status_conta="ativo"
    ).count()

    usuarios_inativos = User.objects.filter(
        perfil__status_conta="inativo"
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
        "total_resultados": total_resultados,
        "usuarios_ativos": usuarios_ativos,
        "usuarios_inativos": usuarios_inativos,
        "usuarios_novos": usuarios_novos,

        "busca": busca,
        "status_selecionado": status,
        "perfil_selecionado": perfil,

        "periodo_cadastro_selecionado": periodo_cadastro,
        "ultimo_acesso_selecionado": ultimo_acesso,
    }

    # =========================================
    # RESPOSTA AJAX OU PÁGINA COMPLETA
    # =========================================

    if request.headers.get("X-Requested-With") == "XMLHttpRequest":

        return render(
            request,
            "adm_usuarios/tabela_usuarios_adm.html",
            contexto
        )

    return render(
        request,
        "adm_usuarios.html",
        contexto
    )
    
    
@login_required
def visualizar_usuario(request, usuario_id):

    usuario = get_object_or_404(User, id=usuario_id)

    if request.method != "GET":
        return JsonResponse(
            {"sucesso": False, "mensagem": "Método não permitido."},
            status=405
        )

    # Identificação do perfil
    perfil = usuario.perfil.acesso or "Não informado"

    dados = {
        "id": usuario.id,
        "nome": usuario.get_full_name() or usuario.username,
        "primeiro_nome": usuario.first_name,
        "usuario": usuario.username,
        "email": usuario.email or "Não informado",
        "perfil": perfil,
        "status": usuario.perfil.status_conta,
        "is_active": usuario.is_active,
        "is_staff": usuario.is_staff,
        "is_superuser": usuario.is_superuser,
        "data_cadastro": timezone.localtime(
            usuario.date_joined
        ).strftime("%d/%m/%Y às %H:%M"),
        "ultimo_acesso": (
            timezone.localtime(usuario.last_login).strftime(
                "%d/%m/%Y às %H:%M"
            )
            if usuario.last_login
            else "Nunca acessou"
        ),
    }

    return JsonResponse({
        "sucesso": True,
        "usuario": dados
    })



@login_required
@require_http_methods(["GET", "POST"])
def editar_usuario(request, usuario_id):

    # PERMISSÃO ADMINISTRATIVA
    if not (request.user.is_staff or request.user.is_superuser):
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Você não tem permissão para editar usuários."
        }, status=403)

    usuario = get_object_or_404(User, id=usuario_id)

    try:
        perfil_usuario = usuario.perfil
    except PerfilUsuario.DoesNotExist:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "O perfil deste usuário não foi encontrado."
        }, status=404)

    # MAPEAMENTO DOS PERFIS
    perfis = {
        "administrador": "Administrador",
        "comum": "Usuário Comum",
        "analista": "Analista",
        "gerente": "Gerente",
        "assistente": "Assistente",
        "visualizador": "Visualizador",
    }

    # CARREGAR DADOS ATUAIS
    if request.method == "GET":

        # Converte o nome salvo no banco para o value do select
        perfil_atual = next(
            (
                chave for chave, valor in perfis.items()
                if valor.casefold() == perfil_usuario.acesso.casefold()
            ),
            "comum"
        )

        dados = {
            "id": usuario.id,
            "nome": usuario.first_name,
            "username": usuario.username,
            "email": usuario.email,
            "perfil": perfil_atual,
            "status": perfil_usuario.status_conta,
        }

        return JsonResponse({
            "sucesso": True,
            "usuario": dados
        })

    # RECEBER ALTERAÇÕES
    nome = request.POST.get("nome", "").strip()
    email = request.POST.get("email", "").strip()
    perfil = request.POST.get("perfil", "").strip()
    status = request.POST.get("status", "").strip()

    # VALIDAR NOME
    if not nome:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "O nome é obrigatório."
        }, status=400)

    # VALIDAR E-MAIL
    if not email:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "O e-mail é obrigatório."
        }, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Informe um endereço de e-mail válido."
        }, status=400)

    email_existente = User.objects.filter(
        email__iexact=email
    ).exclude(
        id=usuario.id
    ).exists()

    if email_existente:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Este e-mail já está sendo utilizado por outro usuário."
        }, status=400)

    # VALIDAR PERFIL
    if perfil not in perfis:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Perfil inválido."
        }, status=400)

    # VALIDAR STATUS
    if status not in ["ativo", "inativo", "bloqueado"]:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Status inválido."
        }, status=400)

    # PROTEGER A PRÓPRIA CONTA
    if usuario.id == request.user.id:

        if status != "ativo":
            return JsonResponse({
                "sucesso": False,
                "mensagem": "Você não pode desativar ou bloquear sua própria conta."
            }, status=400)

        if perfil != "administrador":
            return JsonResponse({
                "sucesso": False,
                "mensagem": "Você não pode remover seu próprio perfil administrativo."
            }, status=400)

    # SALVAR ALTERAÇÕES
    try:
        from django.db import transaction

        with transaction.atomic():

            usuario.first_name = nome
            usuario.email = email

            # Permissão administrativa do Django
            usuario.is_staff = perfil == "administrador"

            # Status de acesso
            usuario.is_active = status == "ativo"

            # SALVAR PERFIL PERSONALIZADO
            perfil_usuario.acesso = perfis[perfil]
            perfil_usuario.status_conta = status

            usuario.save()

            perfil_usuario.save(
                update_fields=["acesso", "status_conta"]
            )

        # CONFIRMAR SALVAMENTO
        return JsonResponse({
            "sucesso": True,
            "mensagem": "Usuário atualizado com sucesso!",
            "usuario": {
                "id": usuario.id,
                "nome": usuario.first_name,
                "username": usuario.username,
                "email": usuario.email,
                "perfil": perfil,
                "acesso": perfil_usuario.acesso,
                "status": status
            }
        })

    except IntegrityError:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Não foi possível salvar as alterações por causa de uma restrição do banco de dados."
        }, status=400)

    except Exception:
        import logging
        logging.exception(
            "Erro ao editar usuário ID %s",
            usuario.id
        )

        return JsonResponse({
            "sucesso": False,
            "mensagem": "Ocorreu um erro interno ao atualizar o usuário."
        }, status=500)

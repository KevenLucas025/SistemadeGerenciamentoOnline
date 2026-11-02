from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from produtos.models import Produto
from decimal import Decimal,InvalidOperation
from django.http import JsonResponse
import random
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.views.decorators.http import require_POST
from clientes.models import Cliente,ClienteHistorico
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from accounts.models import PerfilUsuario
from accounts.tokens import localizar_token_planilha
from datetime import datetime
from notificacoes.models import Notificacao
from groq import Groq
from django.conf import settings
import json
from .ia.conhecimento import CONHECIMENTO_SISTEMA
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from datetime import datetime, date
import logging
import uuid
from django.views.decorators.csrf import csrf_protect
from accounts.models import TokenPlanilha
from cadastrar_produtos_massa.views import validar_planilha_produtos
from openpyxl import load_workbook
from .models import AvaliacaoAssistenteIA
from django.contrib.auth.password_validation import validate_password
from django.utils.crypto import get_random_string
from cadastrar_usuarios_massa.views import (
    carregar_dados_existentes,
    verificar_duplicidade,
    formatar_cpf,
    formatar_cnpj,
    formatar_rg,
    formatar_telefone,
    formatar_cep,
    validar_email,
    somente_numeros,
    
)



logger = logging.getLogger(__name__)

CABECALHOS_USUARIOS = [
    "Nome",
    "Usuário",
    "Senha",
    "Confirmar Senha",
    "CEP",
    "Endereço",
    "Número",
    "Cidade",
    "Bairro",
    "Estado",
    "Complemento",
    "Telefone",
    "E-mail",
    "Data de Nascimento",
    "RG",
    "CPF",
    "CNPJ",
]


def moeda_para_decimal(valor):
    if not valor:
        return Decimal("0")
    
    valor = (valor.replace("R$","").replace(".","").replace(",",".").strip())
    
    return Decimal(valor)

def porcentagem_para_decimal(valor):
    if not valor:
        return Decimal("0")

    valor = valor.replace("%", "").strip()

    return Decimal(valor)

@login_required
def dashboard(request):
    return render(request,'dashboard.html')

@login_required
def estoque(request):

    produtos = Produto.objects.all().order_by("-data_cadastro")

    return render(request,"estoque.html",{"produtos": produtos,"saidas": []})


@login_required
def usuarios(request):
    
    usuarios_ativos = User.objects.filter(is_active=True)
    usuarios_inativos = User.objects.filter(is_active=False)
    
    return render(request, 'usuarios.html',{'usuarios': usuarios_ativos, 'usuarios_inativos': usuarios_inativos})

@login_required
def cadastrar_produtos(request):
    if request.method == "POST":
        try:
            cliente_id = request.POST.get("cliente")
            if not cliente_id:
                return JsonResponse({
                    "status":"erro",
                    "mensagem":"Selecione um cliente para vincular o produto"
                },status=400)
                
            cliente_obj = get_object_or_404(Cliente, id=cliente_id)
                
            quantidade = int(request.POST.get("quantidade"))
            valor_unitario = moeda_para_decimal(request.POST.get("valor_unitario"))
            desconto = porcentagem_para_decimal(request.POST.get("desconto"))

            total_sem_desconto = quantidade * valor_unitario
            valor_desconto = total_sem_desconto * (desconto / Decimal("100"))
            total_com_desconto = total_sem_desconto - valor_desconto

            produto = Produto.objects.create(
                nome=request.POST.get("nome"),
                codigo=request.POST.get("codigo"),
                descricao=request.POST.get("descricao"),
                cliente=cliente_obj,
                quantidade=quantidade,
                valor_unitario=valor_unitario,
                desconto=desconto,
                valor_total=total_com_desconto,
                total_sem_desconto=total_sem_desconto,
                total_com_desconto=total_com_desconto,
                data_cadastro=request.POST.get("data_cadastro"),
                imagem=request.FILES.get("imagem"),
                criado_por=request.user,
                status_saida=0
            )
            # =========================================================
            # NOTIFICAÇÃO
            # =========================================================

            mensagem_notificacao = (
                f"{request.user.get_full_name() or request.user.username} "
                f"cadastrou o produto '{produto.nome}'."
            )


            # =========================================================
            # SALVA NOTIFICAÇÃO PARA OS OUTROS USUÁRIOS
            # =========================================================

            usuarios_destinatarios = User.objects.filter(
                is_active=True
            ).exclude(
                id=request.user.id
            )


            notificacoes_criadas = []

            for usuario in usuarios_destinatarios:

                notificacao = Notificacao.objects.create(
                    destinatario=usuario,
                    mensagem=mensagem_notificacao
                )

                notificacoes_criadas.append(notificacao)


            # =========================================================
            # ENVIA PELO WEBSOCKET
            # =========================================================

            channel_layer = get_channel_layer()

            async_to_sync(channel_layer.group_send)(
                "notificacoes_sistema",
                {
                    "type": "notificacao",
                    "usuario_id": request.user.id,
                    "mensagem": mensagem_notificacao,
                }
            )

            # Resposta JSON tratada
            return JsonResponse({
                "status": "ok",
                "mensagem": "Produto cadastrado com sucesso!"
            })

        except Exception as e:
            return JsonResponse({
                "status": "erro",
                "mensagem": f"Erro ao cadastrar produto: {str(e)}"
            }, status=400)

    produtos = (
        Produto.objects
        .select_related("cliente", "criado_por")
        .order_by("-id")
    )
    clientes = Cliente.objects.only(
        "id", "nome"
    ).order_by("nome")

    return render(
        request,
        "produtos.html",
        {
            "produtos": produtos,
            "clientes": clientes
        }
    )

# LEVA ATÉ A PÁGINA DE CADASTRAR USUÁRIOS
@login_required
def cadastrar_usuarios(request):
    usuarios = User.objects.select_related("perfil").all().order_by("-date_joined")
      
    return render(
        request,
        "cadastrar_usuarios.html",
        {
            "usuarios": usuarios,
            "usuario_atual_id": request.user.id,
        }
    )


@login_required
def clientes(request):
    clientes_juridicos = Cliente.objects.filter(tipo_cliente="juridico").order_by("-data_inclusao")
    clientes_fisicos = Cliente.objects.filter(tipo_cliente="fisico").order_by("-data_inclusao")

    return render(
        request,
        "clientes.html",
        {
            "clientes_juridicos": clientes_juridicos,
            "clientes_fisicos": clientes_fisicos,
        }
    )



@login_required
def apagar_produto(request,id):

    if request.method != "POST":
        return JsonResponse({
            "status":"erro",
            "mensagem":"Método inválido."
        })


    try:

        produto = Produto.objects.get(id=id)

        produto.delete()


        return JsonResponse({
            "status":"ok"
        })


    except Produto.DoesNotExist:


        return JsonResponse({
            "status":"erro",
            "mensagem":"Produto não encontrado."
        })
        
@login_required
def atualizar_produto(request, id):

    if request.method != "POST":
        return JsonResponse({
            "status": "erro",
            "mensagem": "Método inválido."
        })

    try:

        produto = Produto.objects.get(id=id)

        quantidade = int(request.POST.get("quantidade"))

        valor_unitario = moeda_para_decimal(
            request.POST.get("valor_unitario")
        )

        desconto = porcentagem_para_decimal(
            request.POST.get("desconto")
        )

        total_sem_desconto = quantidade * valor_unitario

        valor_desconto = total_sem_desconto * (desconto / Decimal("100"))

        total_com_desconto = total_sem_desconto - valor_desconto

        produto.nome = request.POST.get("nome")
        produto.descricao = request.POST.get("descricao")
        produto.quantidade = quantidade
        produto.valor_unitario = valor_unitario
        produto.desconto = desconto
        produto.total_sem_desconto = total_sem_desconto
        produto.total_com_desconto = total_com_desconto
        produto.valor_total = total_com_desconto
        produto.data_cadastro = request.POST.get("data_cadastro")

        if request.FILES.get("imagem"):
            produto.imagem = request.FILES.get("imagem")

        produto.save()

        return JsonResponse({
            "status": "ok"
        })

    except Produto.DoesNotExist:

        return JsonResponse({
            "status": "erro",
            "mensagem": "Produto não encontrado."
        })
        
@login_required
def atualizar_tabela_produtos(request):

    produtos = Produto.objects.select_related("criado_por").all()

    # ============================
    # FILTRO
    # ============================
    tipo = request.GET.get("tipo")
    valor = request.GET.get("valor")

    if tipo and valor:

        if tipo == "nome":
            produtos = produtos.filter(
                nome__icontains=valor
            )

        elif tipo == "cliente":
            produtos = produtos.filter(
                cliente__icontains=valor
            )

        elif tipo == "codigo":
            produtos = produtos.filter(
                codigo__icontains=valor
            )

        elif tipo == "criado_por":
            produtos = produtos.filter(
                criado_por__username__icontains=valor
            )

        elif tipo == "data_cadastro":
            produtos = produtos.filter(
                data_cadastro=valor
            )

    # ============================
    # ORDENAÇÃO
    # ============================
    ordem = request.GET.get("ordem")

    if ordem == "asc":
        produtos = produtos.order_by("nome")

    elif ordem == "desc":
        produtos = produtos.order_by("-nome")

    else:
        produtos = produtos.order_by("-id")

    return render(
        request,
        "tabela_body.html",
        {
            "produtos": produtos
        }
    )
    
@login_required
def duplicar_produto(request,id):
    if request.method == "POST":
        produto_original = get_object_or_404(Produto,id=id)
        
        novo_codigo = f"PRD-{random.randint(100000,999999)}"
        
        while Produto.objects.filter(codigo=novo_codigo).exists():
            novo_codigo = f"PRD-{random.randint(100000, 999999)}"
            
            # Cria uma nova instância copiando os dados do original
        novo_produto = Produto.objects.create(
            nome=f"{produto_original.nome} (Cópia)",
            codigo=novo_codigo,
            descricao=produto_original.descricao,
            cliente=produto_original.cliente,
            quantidade=produto_original.quantidade,
            valor_unitario=produto_original.valor_unitario,
            desconto=produto_original.desconto,
            total_sem_desconto=produto_original.total_sem_desconto,
            total_com_desconto=produto_original.total_com_desconto,
            valor_total=produto_original.valor_total,
            imagem=produto_original.imagem, # Copia a referência da imagem
            data_cadastro=produto_original.data_cadastro,
            criado_por=request.user,
            status_saida=produto_original.status_saida
        )
        return JsonResponse({
           "status": "ok",
            "mensagem": f"Produto duplicado com sucesso! Novo ID: {novo_produto.id}" 
        })

    return JsonResponse({"status": "erro", "mensagem": "Método inválido."}, status=400)

@login_required
def obter_usuario(request, usuario_id):
    try:
        usuario = User.objects.select_related("perfil").get(
            id=usuario_id
        )

        perfil = getattr(usuario, "perfil", None)

        # Trata a URL da imagem com segurança
        foto_url = ""
        if perfil and perfil.imagem:
            try:
                foto_url = perfil.imagem.url
            except ValueError:
                foto_url = ""

        return JsonResponse({
            "sucesso": True,
            "usuario": {
                "id": usuario.id,
                "nome": usuario.get_full_name() or usuario.username,
                "username": usuario.username,
                "email": usuario.email,

                "cep": getattr(perfil, "cep", "") or "",
                "endereco": getattr(perfil, "endereco", "") or "",
                "numero": getattr(perfil, "numero", "") or "",
                "bairro": getattr(perfil, "bairro", "") or "",
                "cidade": getattr(perfil, "cidade", "") or "",
                "estado": getattr(perfil, "estado", "") or "",
                "complemento": getattr(perfil, "complemento", "") or "",
                "telefone": getattr(perfil, "telefone", "") or "",

                "data_nascimento": (
                    perfil.data_nascimento.strftime("%Y-%m-%d")
                    if perfil and perfil.data_nascimento
                    else ""
                ),

                "rg": getattr(perfil, "rg", "") or "",
                "cpf": getattr(perfil, "cpf", "") or "",
                "cnpj": getattr(perfil, "cnpj", "") or "",

                "perfil": getattr(perfil, "acesso", "") or "",
                "acesso": getattr(perfil, "acesso", "") or "",
                
                # Campos da imagem enviados para o JS
                "imagem": foto_url,
                "foto_url": foto_url,
            }
        })

    except User.DoesNotExist:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Usuário não encontrado."
        }, status=404)
        
@login_required
@require_POST
def atualizar_usuario(request, usuario_id):
    try:
        usuario = get_object_or_404(User, id=usuario_id)
        
        # Garante a existência do perfil para evitar erro 500
        perfil, _ = PerfilUsuario.objects.get_or_create(usuario=usuario)

        # 1. Dados do Usuário
        usuario.first_name = request.POST.get("nome", "").strip()
        usuario.username = request.POST.get("username", "").strip()
        usuario.email = request.POST.get("email", "").strip()

        senha = request.POST.get("senha", "").strip()
        if senha:
            usuario.set_password(senha)

        usuario.save()

        # 2. Dados do Perfil
        perfil.cep = request.POST.get("cep", "").strip()
        perfil.endereco = request.POST.get("endereco", "").strip()
        perfil.numero = request.POST.get("numero", "").strip()
        perfil.cidade = request.POST.get("cidade", "").strip()
        perfil.bairro = request.POST.get("bairro", "").strip()
        perfil.estado = request.POST.get("estado", "").strip()
        perfil.complemento = request.POST.get("complemento", "").strip()
        perfil.telefone = request.POST.get("telefone", "").strip()

        perfil.rg = request.POST.get("rg", "").strip()
        perfil.cpf = request.POST.get("cpf", "").strip()
        perfil.cnpj = request.POST.get("cnpj", "").strip()

        data_nascimento = request.POST.get("data_nascimento", "").strip()
        if data_nascimento:
            try:
                perfil.data_nascimento = datetime.strptime(data_nascimento, "%Y-%m-%d").date()
            except ValueError:
                perfil.data_nascimento = None
        else:
            perfil.data_nascimento = None

        acesso = request.POST.get("acesso", "").strip()
        perfil.acesso = acesso if acesso else "Usuário Comum"

        if request.FILES.get("imagem"):
            perfil.imagem = request.FILES.get("imagem")

        perfil.save()

        return JsonResponse({
            "sucesso": True,
            "mensagem": "Usuário atualizado com sucesso!"
        })

    except Exception as e:
        print(f"Erro ao atualizar usuário: {e}")
        return JsonResponse({
            "sucesso": False,
            "mensagem": f"Erro interno ao atualizar usuário: {str(e)}"
        }, status=500)
        
@login_required
def cadastrar_usuario(request):

    if request.method != "POST":
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Método inválido."
        }, status=405)

    try:

        # =========================================
        # DADOS DO USUÁRIO
        # =========================================

        nome = request.POST.get("nome", "").strip()
        username = request.POST.get("username", "").strip()
        senha = request.POST.get("senha", "").strip()
        email = request.POST.get("email", "").strip()

        # =========================================
        # VALIDAÇÕES
        # =========================================

        if not nome:
            return JsonResponse({
                "sucesso": False,
                "campo": "nome",
                "mensagem": "Informe o nome do usuário."
            }, status=400)

        if not username:
            return JsonResponse({
                "sucesso": False,
                "campo": "username",
                "mensagem": "Informe o nome de usuário."
            }, status=400)

        if not senha:
            return JsonResponse({
                "sucesso": False,
                "campo": "senha",
                "mensagem": "Informe a senha."
            }, status=400)

        if not email:
            return JsonResponse({
                "sucesso": False,
                "campo": "email",
                "mensagem": "Informe o e-mail."
            }, status=400)

        # =========================================
        # VERIFICA SE USERNAME JÁ EXISTE
        # =========================================

        if User.objects.filter(username=username).exists():

            return JsonResponse({
                "sucesso": False,
                "campo": "username",
                "mensagem": "Este nome de usuário já está cadastrado."
            }, status=400)

        # =========================================
        # VERIFICA SE E-MAIL JÁ EXISTE
        # =========================================

        if User.objects.filter(email=email).exists():

            return JsonResponse({
                "sucesso": False,
                "campo": "email",
                "mensagem": "Este e-mail já está cadastrado."
            }, status=400)

        # =========================================
        # CRIA O USER
        # =========================================

        usuario = User.objects.create_user(
            username=username,
            email=email,
            password=senha
        )

        usuario.first_name = nome

        usuario.save()

        # =========================================
        # PERFIL
        # =========================================

        perfil = usuario.perfil

        perfil.cep = request.POST.get("cep", "").strip()
        perfil.endereco = request.POST.get("endereco", "").strip()
        perfil.numero = request.POST.get("numero", "").strip()
        perfil.cidade = request.POST.get("cidade", "").strip()
        perfil.bairro = request.POST.get("bairro", "").strip()
        perfil.estado = request.POST.get("estado", "").strip()
        perfil.complemento = request.POST.get("complemento", "").strip()
        perfil.telefone = request.POST.get("telefone", "").strip()

        perfil.rg = request.POST.get("rg", "").strip()
        perfil.cpf = request.POST.get("cpf", "").strip()
        perfil.cnpj = request.POST.get("cnpj", "").strip()

        # =========================================
        # DATA DE NASCIMENTO
        # =========================================

        data_nascimento = request.POST.get(
            "data_nascimento",
            ""
        ).strip()

        if data_nascimento:

            from datetime import datetime

            perfil.data_nascimento = datetime.strptime(
                data_nascimento,
                "%Y-%m-%d"
            ).date()

        else:

            perfil.data_nascimento = None

        # =========================================
        # ACESSO
        # =========================================

        acesso = request.POST.get(
            "acesso",
            ""
        ).strip()

        if acesso:
            perfil.acesso = acesso
        else:
            perfil.acesso = "Usuário"

        # =========================================
        # FOTO
        # =========================================

        if request.FILES.get("imagem"):
            perfil.imagem = request.FILES.get("imagem")

        # =========================================
        # SALVA PERFIL
        # =========================================

        perfil.save()

        # =========================================
        # RESPOSTA
        # =========================================

        return JsonResponse({
            "sucesso": True,
            "mensagem": "Usuário cadastrado com sucesso!",
            "usuario_id": usuario.id
        })

    except Exception as e:

        return JsonResponse({
            "sucesso": False,
            "mensagem": f"Erro ao cadastrar usuário: {str(e)}"
        }, status=400)
        
@login_required       
def verificar_username(request):
    username = request.GET.get('username', '').strip()
    usuario_id = request.GET.get('usuario_id', '').strip()

    if not username:
        return JsonResponse({'existe': False})

    # Consulta se o nome de usuário já existe no banco
    query = User.objects.filter(username__iexact=username)

    # Se estiver editando um usuário existente, ignora o próprio ID
    if usuario_id and usuario_id.isdigit():
        query = query.exclude(id=int(usuario_id))

    existe = query.exists()

    return JsonResponse({'existe': existe})

@login_required
def atualizar_tabela_usuarios(request):
    try:
        usuarios = User.objects.select_related("perfil").all().order_by("-date_joined")

        # Filtros
        tipo = request.GET.get("tipo")
        valor = request.GET.get("valor", "").strip()

        if tipo and valor:
            if tipo == "nome":
                usuarios = usuarios.filter(first_name__icontains=valor)
            elif tipo == "usuario":
                usuarios = usuarios.filter(username__icontains=valor)
            elif tipo == "email":
                usuarios = usuarios.filter(email__icontains=valor)
            elif tipo == "telefone":
                usuarios = usuarios.filter(perfil__telefone__icontains=valor)
            elif tipo == "rg":
                usuarios = usuarios.filter(perfil__rg__icontains=valor)
            elif tipo == "cpf":
                usuarios = usuarios.filter(perfil__cpf__icontains=valor)
            elif tipo == "cnpj":
                usuarios = usuarios.filter(perfil__cnpj__icontains=valor)
            elif tipo == "acesso":
                usuarios = usuarios.filter(perfil__acesso__icontains=valor)

        ordem = request.GET.get("ordem")
        if ordem == "asc":
            usuarios = usuarios.order_by("first_name", "username")
        elif ordem == "desc":
            usuarios = usuarios.order_by("-first_name", "-username")

        contexto = {
            "usuarios": usuarios,
            "usuario_atual_id": request.user.id,
        }

        # Verifique se o caminho do seu template está correto
        html = render_to_string("cadastrar_usuarios/tabela_usuarios.html", contexto, request=request)

        return JsonResponse({
            "sucesso": True,
            "html": html
        })

    except Exception as e:
        print(f"Erro ao atualizar tabela de usuários: {e}")
        return JsonResponse({
            "sucesso": False,
            "mensagem": f"Erro ao renderizar tabela: {str(e)}"
        }, status=500)
    
@login_required
def apagar_usuario(request, usuario_id):
    if request.method != "POST":
        return JsonResponse({"sucesso": False, "mensagem": "Método não permitido."}, status=405)

    # Impede que o usuário apague a si mesmo
    if request.user.id == usuario_id:
        return JsonResponse({
            "sucesso": False, 
            "mensagem": "Você não pode apagar o seu próprio usuário enquanto estiver logado."
        }, status=400)

    try:
        usuario = User.objects.get(id=usuario_id)
        usuario.delete()
        return JsonResponse({"sucesso": True, "mensagem": "Usuário removido com sucesso."})

    except User.DoesNotExist:
        return JsonResponse({"sucesso": False, "mensagem": "Usuário não encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"sucesso": False, "mensagem": f"Erro ao apagar usuário: {str(e)}"}, status=500)


@login_required
@require_POST
def cadastrar_cliente(request):
    try:
        tipo_cliente = request.POST.get("tipo_cliente", "").strip()

        # Identificação e Documentos
        nome = request.POST.get("nome", "").strip()
        razao_social = request.POST.get("razao_social", "").strip()
        cnpj = request.POST.get("cnpj", "").strip()
        rg = request.POST.get("rg", "").strip()
        cpf = request.POST.get("cpf", "").strip()
        email = request.POST.get("email", "").strip()

        # CNH
        cnh = request.POST.get("cnh", "").strip() or None
        categoria_cnh = request.POST.get("categoria_cnh", "").strip() or None
        emissao_cnh = request.POST.get("emissao_cnh", "").strip() or None
        vencimento_cnh = request.POST.get("vencimento_cnh", "").strip() or None

        # Contato e Endereço
        telefone = request.POST.get("telefone", "").strip()
        cep = request.POST.get("cep", "").strip()
        endereco = request.POST.get("endereco", "").strip()
        numero = request.POST.get("numero", "").strip()
        cidade = request.POST.get("cidade", "").strip()
        bairro = request.POST.get("bairro", "").strip()
        estado = request.POST.get("estado", "").strip()
        complemento = request.POST.get("complemento", "").strip() or None

        # Controle
        status = request.POST.get("status", "").strip()
        categoria = request.POST.get("categoria", "").strip()
        

        if tipo_cliente not in ["juridico", "fisico"]:
            return JsonResponse({
                "sucesso": False,
                "mensagem": "Selecione um tipo de cliente válido (Físico ou Jurídico)."
            }, status=400)

        if tipo_cliente == "juridico":
            if not all([nome, razao_social, cnpj, rg, cpf, email]):
                return JsonResponse({
                    "sucesso": False,
                    "mensagem": "Para Cliente Jurídico, os campos Nome, Razão Social, CNPJ, RG, CPF e E-mail são obrigatórios."
                }, status=400)
        else:
            cnpj = None
            razao_social = None
            if not all([nome, rg, cpf, email]):
                return JsonResponse({
                    "sucesso": False,
                    "mensagem": "Para Cliente Físico, os campos Nome, RG, CPF e E-mail são obrigatórios."
                }, status=400)

        if not telefone:
            return JsonResponse({"sucesso": False, "mensagem": "O campo Telefone é obrigatório."}, status=400)

        if not all([cep, endereco, numero, cidade, bairro, estado]):
            return JsonResponse({
                "sucesso": False,
                "mensagem": "Todos os campos de endereço são obrigatórios."
            }, status=400)

        if not status:
            return JsonResponse({"sucesso": False, "mensagem": "O campo Status é obrigatório."}, status=400)

        if not categoria:
            return JsonResponse({"sucesso": False, "mensagem": "O campo Categoria do Cliente é obrigatório."}, status=400)

        campos_cnh = [cnh, categoria_cnh, emissao_cnh, vencimento_cnh]
        if any(campos_cnh) and not all(campos_cnh):
            return JsonResponse({
                "sucesso": False,
                "mensagem": "Ao preencher qualquer dado da CNH, todos os campos referentes a ela tornam-se obrigatórios."
            }, status=400)

        cliente = Cliente.objects.create(
            tipo_cliente=tipo_cliente,
            nome=nome,
            razao_social=razao_social,
            cnpj=cnpj,
            rg=rg,
            cpf=cpf,
            email=email,
            cnh=cnh,
            categoria_cnh=categoria_cnh,
            emissao_cnh=emissao_cnh,
            vencimento_cnh=vencimento_cnh,
            telefone=telefone,
            cep=cep,
            endereco=endereco,
            numero=numero,
            complemento=complemento,
            cidade=cidade,
            bairro=bairro,
            estado=estado,
            status=status,
            categoria=categoria,
            modo_valor_gasto = "Automático (somar produtos)"
        )
        
        ClienteHistorico.objects.create(
            cliente=cliente,
            usuario=request.user,
            nome_cliente=cliente.nome,
            tipo_cliente=cliente.tipo_cliente,
            acao="Cadastro",
            descricao=(
                f"Cliente {cliente.nome} "
                f"cadastrado no sistema."
            )
        )

        # CONVERSÃO PARA HORÁRIO LOCAL COM timezone.localtime
        data_inclusao_fmt = timezone.localtime(cliente.data_inclusao).strftime("%d/%m/%Y %H:%M") if cliente.data_inclusao else "-"
        data_atualizacao_fmt = timezone.localtime(cliente.ultima_atualizacao).strftime("%d/%m/%Y %H:%M") if cliente.ultima_atualizacao else "-"

        emissao_cnh_fmt = cliente.emissao_cnh.strftime("%d/%m/%Y") if cliente.emissao_cnh else "-"
        vencimento_cnh_fmt = cliente.vencimento_cnh.strftime("%d/%m/%Y") if cliente.vencimento_cnh else "-"
        emissao_cnh_raw = cliente.emissao_cnh.strftime("%Y-%m-%d") if cliente.emissao_cnh else ""
        vencimento_cnh_raw = cliente.vencimento_cnh.strftime("%Y-%m-%d") if cliente.vencimento_cnh else ""

        return JsonResponse({
            "sucesso": True,
            "mensagem": "Cliente cadastrado com sucesso!",
            "cliente": {
                "id": cliente.id,
                "tipo": cliente.tipo_cliente,
                "nome": cliente.nome,
                "razao": cliente.razao_social or "-",
                "data_inclusao": data_inclusao_fmt,
                "cnpj": cliente.cnpj or "-",
                "rg": cliente.rg or "-",
                "cpf": cliente.cpf or "-",
                "email": cliente.email or "-",
                "telefone": cliente.telefone or "-",
                "cnh": cliente.cnh or "-",
                "categoria_cnh": cliente.categoria_cnh or "-",
                "emissao_cnh": emissao_cnh_fmt,
                "vencimento_cnh": vencimento_cnh_fmt,
                "emissao_cnh_raw": emissao_cnh_raw,
                "vencimento_cnh_raw": vencimento_cnh_raw,
                "cep": cliente.cep or "-",
                "estado": cliente.estado or "-",
                "endereco": cliente.endereco or "-",
                "numero": cliente.numero or "-",
                "complemento": cliente.complemento or "-",
                "cidade": cliente.cidade or "-",
                "bairro": cliente.bairro or "-",
                "status": cliente.status,
                "categoria": cliente.categoria or "-",
                "ultima_atualizacao": data_atualizacao_fmt,
                "valor_gasto": "0,00",
                "modo_valor_gasto": cliente.modo_valor_gasto,
                "ultima_compra": "-"
            }
        })

    except Exception as erro:
        print(f"Erro ao cadastrar cliente: {erro}")
        return JsonResponse({
            "sucesso": False,
            "mensagem": f"Erro interno ao cadastrar cliente: {str(erro)}"
        }, status=500)




@login_required
@require_POST
def editar_cliente(request, cliente_id):
    try:
        cliente = get_object_or_404(Cliente, id=cliente_id)

        # Guarda os dados originais antes da edição
        dados_originais = {
            "tipo_cliente": cliente.tipo_cliente,
            "nome": cliente.nome,
            "razao_social": cliente.razao_social,
            "cnpj": cliente.cnpj,
            "rg": cliente.rg,
            "cpf": cliente.cpf,
            "email": cliente.email,
            "telefone": cliente.telefone,
            "cnh": cliente.cnh,
            "categoria_cnh": cliente.categoria_cnh,
            "emissao_cnh": cliente.emissao_cnh,
            "vencimento_cnh": cliente.vencimento_cnh,
            "cep": cliente.cep,
            "estado": cliente.estado,
            "endereco": cliente.endereco,
            "numero": cliente.numero,
            "complemento": cliente.complemento,
            "cidade": cliente.cidade,
            "bairro": cliente.bairro,
            "status": cliente.status,
            "categoria": cliente.categoria,
            "modo_valor_gasto": cliente.modo_valor_gasto,
            "valor_gasto": cliente.valor_gasto,
            "ultima_atualizacao": cliente.ultima_atualizacao,
            "ultima_compra": cliente.ultima_compra,
        }

        tipo_cliente = request.POST.get("tipo_cliente", "").strip()

        # =========================================================
        # 1. CAPTURA DOS CAMPOS SENSÍVEIS (NORMALIZADOS)
        # =========================================================

        # 1. Modo do Valor Gasto
        modo_post = request.POST.get("modo_valor_gasto", "").strip()
        modo_original = cliente.modo_valor_gasto or "Automático (somar produtos)"
        alterou_modo = bool(modo_post and modo_post != modo_original)

        # 2. Valor Gasto Total
        valor_raw = (
            request.POST.get("valor_gasto", "")
            .replace("R$", "")
            .replace(".", "")
            .replace(",", ".")
            .strip()
        )

        alterou_valor = False
        novo_valor_gasto = cliente.valor_gasto

        if valor_raw:
            try:
                valor_convertido = Decimal(valor_raw)

                if abs(valor_convertido - cliente.valor_gasto) > Decimal("0.001"):
                    alterou_valor = True
                    novo_valor_gasto = valor_convertido

            except Exception:
                pass

        # 3. Datas Sensíveis
        data_atualizacao_original_str = (
            timezone.localtime(cliente.ultima_atualizacao).strftime("%d/%m/%Y %H:%M")
            if cliente.ultima_atualizacao
            else "-"
        )

        data_compra_original_str = (
            timezone.localtime(cliente.ultima_compra).strftime("%d/%m/%Y %H:%M")
            if cliente.ultima_compra
            else "-"
        )

        data_atualizacao_post = request.POST.get(
            "ultima_atualizacao",
            ""
        ).strip()

        data_compra_post = request.POST.get(
            "ultima_compra",
            ""
        ).strip()

        alterou_data_atualizacao = bool(
            data_atualizacao_post
            and data_atualizacao_post != data_atualizacao_original_str
        )

        alterou_data_compra = bool(
            data_compra_post
            and data_compra_post != data_compra_original_str
        )

        # =========================================================
        # 2. CHECK SE REALMENTE ALTEROU ALGUM DOS 4 SENSÍVEIS
        # =========================================================

        alterou_dados_sensiveis = (
            alterou_modo
            or alterou_valor
            or alterou_data_atualizacao
            or alterou_data_compra
        )

        # =========================================================
        # 3. VALIDAÇÃO DE SENHA
        # =========================================================

        if alterou_dados_sensiveis:

            senha_confirmacao = request.POST.get(
                "senha_confirmacao",
                ""
            ).strip()

            if not senha_confirmacao:
                return JsonResponse({
                    "sucesso": False,
                    "mensagem": (
                        "Campos de dados sensíveis foram alterados. "
                        "Por favor, informe sua senha para prosseguir."
                    )
                }, status=400)

            if not request.user.check_password(senha_confirmacao):
                return JsonResponse({
                    "sucesso": False,
                    "mensagem": (
                        "Senha incorreta. "
                        "A alteração de dados sensíveis foi bloqueada."
                    )
                }, status=403)

        # =========================================================
        # 4. ATUALIZAÇÃO DOS CAMPOS NORMAIS
        # =========================================================

        cliente.tipo_cliente = tipo_cliente
        cliente.nome = request.POST.get("nome", "").strip()
        cliente.razao_social = (
            request.POST.get("razao_social", "").strip()
            or None
        )

        cliente.cnpj = (
            request.POST.get("cnpj", "").strip() or None
            if tipo_cliente == "juridico"
            else None
        )

        cliente.rg = request.POST.get("rg", "").strip() or None
        cliente.cpf = request.POST.get("cpf", "").strip() or None
        cliente.email = request.POST.get("email", "").strip() or None
        cliente.telefone = request.POST.get("telefone", "").strip()

        cliente.cnh = request.POST.get("cnh", "").strip() or None

        cliente.categoria_cnh = (
            request.POST.get("categoria_cnh", "").strip()
            or None
        )

        cliente.emissao_cnh = (
            request.POST.get("emissao_cnh", "").strip()
            or None
        )

        cliente.vencimento_cnh = (
            request.POST.get("vencimento_cnh", "").strip()
            or None
        )

        cliente.cep = request.POST.get("cep", "").strip()
        cliente.estado = request.POST.get("estado", "").strip()
        cliente.endereco = request.POST.get("endereco", "").strip()
        cliente.numero = request.POST.get("numero", "").strip()

        cliente.complemento = (
            request.POST.get("complemento", "").strip()
            or None
        )

        cliente.cidade = request.POST.get("cidade", "").strip()
        cliente.bairro = request.POST.get("bairro", "").strip()
        cliente.status = request.POST.get("status", "").strip()
        cliente.categoria = request.POST.get("categoria", "").strip()

        # =========================================================
        # ATUALIZA DADOS SENSÍVEIS
        # =========================================================

        if modo_post:
            cliente.modo_valor_gasto = modo_post

        if alterou_valor:
            cliente.valor_gasto = novo_valor_gasto

        # =========================================================
        # SALVA CLIENTE
        # =========================================================

        cliente.save()

        # Atualização automática do valor gasto
        if cliente.modo_valor_gasto == "Automático (somar produtos)":
            cliente.atualizar_valor_gasto_automatico()

        # Recarrega os dados atualizados do banco
        cliente.refresh_from_db()

        # =========================================================
        # 5. IDENTIFICA OS CAMPOS ALTERADOS
        # =========================================================

        campos_alterados = []

        if dados_originais["tipo_cliente"] != cliente.tipo_cliente:
            campos_alterados.append("Tipo de cliente")

        if dados_originais["nome"] != cliente.nome:
            campos_alterados.append("Nome")

        if dados_originais["razao_social"] != cliente.razao_social:
            campos_alterados.append("Razão Social")

        if dados_originais["cnpj"] != cliente.cnpj:
            campos_alterados.append("CNPJ")

        if dados_originais["rg"] != cliente.rg:
            campos_alterados.append("RG")

        if dados_originais["cpf"] != cliente.cpf:
            campos_alterados.append("CPF")

        if dados_originais["email"] != cliente.email:
            campos_alterados.append("E-mail")

        if dados_originais["telefone"] != cliente.telefone:
            campos_alterados.append("Telefone")

        if dados_originais["cnh"] != cliente.cnh:
            campos_alterados.append("CNH")

        if dados_originais["categoria_cnh"] != cliente.categoria_cnh:
            campos_alterados.append("Categoria da CNH")

        if dados_originais["emissao_cnh"] != cliente.emissao_cnh:
            campos_alterados.append("Emissão da CNH")

        if dados_originais["vencimento_cnh"] != cliente.vencimento_cnh:
            campos_alterados.append("Vencimento da CNH")

        if dados_originais["cep"] != cliente.cep:
            campos_alterados.append("CEP")

        if dados_originais["estado"] != cliente.estado:
            campos_alterados.append("Estado")

        if dados_originais["endereco"] != cliente.endereco:
            campos_alterados.append("Endereço")

        if dados_originais["numero"] != cliente.numero:
            campos_alterados.append("Número")

        if dados_originais["complemento"] != cliente.complemento:
            campos_alterados.append("Complemento")

        if dados_originais["cidade"] != cliente.cidade:
            campos_alterados.append("Cidade")

        if dados_originais["bairro"] != cliente.bairro:
            campos_alterados.append("Bairro")

        if dados_originais["status"] != cliente.status:
            campos_alterados.append("Status")

        if dados_originais["categoria"] != cliente.categoria:
            campos_alterados.append("Categoria")

        if dados_originais["modo_valor_gasto"] != cliente.modo_valor_gasto:
            campos_alterados.append("Modo do valor gasto")

        if dados_originais["valor_gasto"] != cliente.valor_gasto:
            campos_alterados.append("Valor gasto")

        if dados_originais["ultima_atualizacao"] != cliente.ultima_atualizacao:
            campos_alterados.append("Última atualização")

        if dados_originais["ultima_compra"] != cliente.ultima_compra:
            campos_alterados.append("Última compra")

        # =========================================================
        # 6. REGISTRA HISTÓRICO DE EDIÇÃO
        # =========================================================

        if campos_alterados:

            campos_formatados = ", ".join(campos_alterados)

            ClienteHistorico.objects.create(
                cliente=cliente,
                usuario=request.user,
                nome_cliente=cliente.nome,
                tipo_cliente=cliente.tipo_cliente,
                acao="Edição",
                descricao=(
                    f"Cliente {cliente.nome} foi editado no sistema. "
                    f"Campos alterados: {campos_formatados}."
                )
            )

        # =========================================================
        # 7. RETORNO DOS DADOS FORMATADOS
        # =========================================================

        data_inclusao_fmt = (
            timezone.localtime(cliente.data_inclusao).strftime(
                "%d/%m/%Y %H:%M"
            )
            if cliente.data_inclusao
            else "-"
        )

        data_atualizacao_fmt = (
            timezone.localtime(cliente.ultima_atualizacao).strftime(
                "%d/%m/%Y %H:%M"
            )
            if cliente.ultima_atualizacao
            else "-"
        )

        ultima_compra_fmt = (
            timezone.localtime(cliente.ultima_compra).strftime(
                "%d/%m/%Y %H:%M"
            )
            if cliente.ultima_compra
            else "-"
        )

        emissao_cnh_fmt = (
            cliente.emissao_cnh.strftime("%d/%m/%Y")
            if cliente.emissao_cnh
            else "-"
        )

        vencimento_cnh_fmt = (
            cliente.vencimento_cnh.strftime("%d/%m/%Y")
            if cliente.vencimento_cnh
            else "-"
        )

        # Formata com separador de milhar '.' e decimal ','
        valor_gasto_fmt = (
            f"{cliente.valor_gasto:,.2f}"
            .replace(",", "X")
            .replace(".", ",")
            .replace("X", ".")
        )

        return JsonResponse({
            "sucesso": True,
            "mensagem": "Cliente atualizado com sucesso!",
            "cliente": {
                "id": cliente.id,
                "tipo": cliente.tipo_cliente,
                "nome": cliente.nome,
                "razao": cliente.razao_social or "-",
                "data_inclusao": data_inclusao_fmt,
                "cnpj": cliente.cnpj or "-",
                "rg": cliente.rg or "-",
                "cpf": cliente.cpf or "-",
                "email": cliente.email or "-",
                "cnh": cliente.cnh or "-",
                "categoria_cnh": cliente.categoria_cnh or "-",
                "emissao_cnh": emissao_cnh_fmt,
                "vencimento_cnh": vencimento_cnh_fmt,
                "emissao_cnh_raw": (
                    cliente.emissao_cnh.strftime("%Y-%m-%d")
                    if cliente.emissao_cnh
                    else ""
                ),
                "vencimento_cnh_raw": (
                    cliente.vencimento_cnh.strftime("%Y-%m-%d")
                    if cliente.vencimento_cnh
                    else ""
                ),
                "telefone": cliente.telefone or "-",
                "cep": cliente.cep or "-",
                "endereco": cliente.endereco or "-",
                "numero": cliente.numero or "-",
                "complemento": cliente.complemento or "-",
                "cidade": cliente.cidade or "-",
                "bairro": cliente.bairro or "-",
                "estado": cliente.estado or "-",
                "status": cliente.status,
                "categoria": cliente.categoria or "-",
                "ultima_atualizacao": data_atualizacao_fmt,
                "valor_gasto": valor_gasto_fmt,
                "modo_valor_gasto": cliente.modo_valor_gasto or "-",
                "ultima_compra": ultima_compra_fmt,
            },
        })

    except Exception as erro:
        print(f"Erro ao editar cliente: {erro}")

        return JsonResponse(
            {
                "sucesso": False,
                "mensagem": f"Erro interno: {str(erro)}"
            },
            status=500
        )


        
@login_required
@require_POST
def excluir_cliente(request, cliente_id):
    try:
        cliente = get_object_or_404(Cliente, id=cliente_id)
        nome_cliente = cliente.nome
        tipo_cliente = cliente.tipo_cliente

        ClienteHistorico.objects.create(
            cliente=cliente,
            usuario=request.user,
            nome_cliente=nome_cliente,
            tipo_cliente=tipo_cliente,
            acao="Exclusão",
            descricao=(
                f"Cliente {nome_cliente} "
                f"foi excluído do sistema."
            )
        )

        cliente.delete()

        return JsonResponse({
            "sucesso": True,
            "mensagem": f"O cliente '{nome_cliente}' foi excluído com sucesso!"
        })

    except Exception as erro:
        print(f"Erro ao excluir cliente: {erro}")
        return JsonResponse({
            "sucesso": False,
            "mensagem": f"Erro interno ao excluir cliente: {str(erro)}"
        }, status=500)

# =========================================================
# ASSISTENTE IA
# =========================================================

@login_required
@require_POST
def chat_ia(request):

    try:

        dados = json.loads(request.body)

        mensagem = dados.get("mensagem", "").strip()

        if not mensagem:
            return JsonResponse({
                "sucesso": False,
                "mensagem": "Digite uma pergunta."
            }, status=400)


        # =================================================
        # VERIFICA API KEY
        # =================================================
        api_key = settings.GROQ_API_KEY

        if not api_key:

            return JsonResponse({
                "sucesso": False,
                "mensagem": "A chave da API da Groq não está configurada."
            }, status=500)


        # =================================================
        # CLIENTE GROQ
        # =================================================

        client = Groq(
            api_key=api_key
        )


        # =================================================
        # SOLICITA RESPOSTA À IA
        # =================================================

        resposta = client.chat.completions.create(

            model="openai/gpt-oss-120b",

           messages=[

            {
                "role": "system",

                "content": f"""
        Você é o Assistente IA do Sistema de Gerenciamento.

        Você deve responder exclusivamente com base
        nas informações reais do sistema fornecidas abaixo.

        Não invente telas.
        Não invente botões.
        Não invente campos.
        Não invente funcionalidades.
        Não invente regras.

        Se a informação não estiver na base de conhecimento,
        diga claramente que você não possui essa informação.

        Responda em português do Brasil.

        BASE DE CONHECIMENTO DO SISTEMA:

        {CONHECIMENTO_SISTEMA}
        """
            },

            {
                "role": "user",
                "content": mensagem
            }

        ],

            temperature=0.7,

            max_tokens=1000
        )


        # =================================================
        # PEGA A RESPOSTA
        # =================================================
        resposta_texto = (
            resposta.choices[0]
            .message
            .content
        )


        # =================================================
        # RETORNA PARA O JAVASCRIPT
        # ================================================

        return JsonResponse({

            "sucesso": True,

            "resposta": resposta_texto

        })


    except Exception as erro:

        print(
            f"Erro no Assistente IA: {erro}"
        )


        return JsonResponse({

            "sucesso": False,

            "mensagem":
                "Não foi possível obter uma resposta da IA."

        }, status=500)
        




@require_POST
@csrf_protect
def avaliar_assistente_ia(request):

    # Exige autenticação.
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "sucesso": False,
                "mensagem": "É necessário estar autenticado.",
            },
            status=401,
        )

    # Lê o JSON enviado pelo JavaScript.
    try:
        dados = json.loads(request.body)

    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {
                "sucesso": False,
                "mensagem": "Dados inválidos.",
            },
            status=400,
        )

    # Valida o identificador da resposta.
    try:
        resposta_id = uuid.UUID(
            str(dados.get("resposta_id", ""))
        )

    except (ValueError, TypeError, AttributeError):
        return JsonResponse(
            {
                "sucesso": False,
                "mensagem": "Identificador de resposta inválido.",
            },
            status=400,
        )

    # Aceita somente os dois tipos de avaliação.
    avaliacao = dados.get("avaliacao")

    if avaliacao not in ("positiva", "negativa"):
        return JsonResponse(
            {
                "sucesso": False,
                "mensagem": "Avaliação inválida.",
            },
            status=400,
        )

    # Cria a avaliação ou atualiza a existente.
    registro, criado = (
        AvaliacaoAssistenteIA.objects.update_or_create(
            usuario=request.user,
            resposta_id=resposta_id,
            defaults={
                "avaliacao": avaliacao,
                "pergunta": str(
                    dados.get("pergunta", "")
                )[:10000],
                "resposta": str(
                    dados.get("resposta", "")
                )[:20000],
            },
        )
    )

    return JsonResponse(
        {
            "sucesso": True,
            "mensagem": "Avaliação registrada com sucesso.",
            "avaliacao": registro.avaliacao,
            "nova": criado,
        }
    )
    



@login_required
@require_POST
def processar_cadastro_produtos_massa(request):
    """
    Cadastra produtos em massa com validação individual.
    Os dados são lidos diretamente do Excel original.
    Produtos inválidos não impedem o processamento das demais linhas.
    """
    logger = logging.getLogger(__name__)

    # =========================================
    # RECEBE E VALIDA O ARQUIVO ORIGINAL
    # =========================================

    arquivo_planilha = request.FILES.get("arquivo_planilha")

    if not arquivo_planilha:
        return JsonResponse({
            "status": "erro",
            "mensagem": "O arquivo original da planilha não foi enviado."
        }, status=400)

    try:
        token_planilha = validar_planilha_produtos(
            arquivo_planilha,
            request.user
        )

        if not token_planilha:
            return JsonResponse({
                "status": "erro",
                "mensagem": (
                    "Planilha não reconhecida, expirada ou já utilizada. "
                    "Baixe um novo modelo oficial."
                )
            }, status=400)

        # =========================================
        # CONSOME O TOKEN DE FORMA ATÔMICA
        # =========================================

        agora = timezone.now()

        token_consumido = TokenPlanilha.objects.filter(
            pk=token_planilha.pk,
            usuario=request.user.perfil,
            tipo="produto",
            utilizado=False,
            expira_em__gt=agora
        ).update(
            utilizado=True,
            utilizado_em=agora
        )

        if token_consumido != 1:
            return JsonResponse({
                "status": "erro",
                "mensagem": (
                    "Esta planilha já foi utilizada ou seu token expirou. "
                    "Baixe um novo modelo oficial."
                )
            }, status=400)

        # =========================================
        # LÊ E VALIDA O EXCEL
        # =========================================

        arquivo_planilha.seek(0)

        workbook = load_workbook(
            arquivo_planilha,
            read_only=True,
            data_only=True
        )

        try:
            aba = workbook[workbook.sheetnames[0]]

            cabecalhos_esperados = [
                "Produto",
                "Quantidade",
                "Valor Unitário",
                "Desconto",
                "Data do Cadastro",
                "Código do Item",
                "Cliente",
                "Descrição"
            ]

            cabecalhos_planilha = next(
                aba.iter_rows(
                    min_row=1,
                    max_row=1,
                    values_only=True
                ),
                None
            )

            if not cabecalhos_planilha:
                raise ValueError(
                    "A planilha não possui cabeçalhos."
                )

            cabecalhos_planilha = [
                str(valor or "").strip()
                for valor in cabecalhos_planilha[:8]
            ]

            if cabecalhos_planilha != cabecalhos_esperados:
                raise ValueError(
                    "Os cabeçalhos da planilha foram alterados ou "
                    "não correspondem ao modelo oficial de produtos."
                )

            # Verifica se existem colunas adicionais preenchidas.
            if len(cabecalhos_planilha) != 8:
                raise ValueError(
                    "A estrutura de colunas da planilha é inválida."
                )

            linhas = aba.iter_rows(
                min_row=2,
                values_only=True
            )

            produtos_recebidos = []

            for numero_linha, linha in enumerate(linhas, start=2):

                if not any(
                    str(valor or "").strip()
                    for valor in linha
                ):
                    continue

                if len(linha) < 8:
                    raise ValueError(
                        f"A linha {numero_linha} possui colunas incompletas."
                    )

                # Impede dados preenchidos fora das oito colunas oficiais.
                if any(
                    str(valor or "").strip()
                    for valor in linha[8:]
                ):
                    raise ValueError(
                        f"A linha {numero_linha} possui dados em "
                        "colunas não permitidas."
                    )

                produtos_recebidos.append({
                    "nome": linha[0],
                    "quantidade": linha[1],
                    "valor_unitario": linha[2],
                    "desconto": linha[3],
                    "data_cadastro": linha[4],
                    "codigo": linha[5],
                    "cliente": linha[6],
                    "descricao": linha[7],
                })

                if len(produtos_recebidos) > 500:
                    raise ValueError(
                        "O limite é de 500 produtos por importação."
                    )

        finally:
            workbook.close()
            arquivo_planilha.seek(0)

        if not produtos_recebidos:
            return JsonResponse({
                "status": "erro",
                "mensagem": "A planilha não contém produtos para cadastro."
            }, status=400)

    except ValueError as erro:
        return JsonResponse({
            "status": "erro",
            "mensagem": str(erro)
        }, status=400)

    except Exception:
        logger.exception(
            "Erro ao ler a planilha de cadastro em massa."
        )

        return JsonResponse({
            "status": "erro",
            "mensagem": (
                "Não foi possível ler a planilha. "
                "Verifique se o arquivo está íntegro."
            )
        }, status=400)

    # =========================================
    # INICIALIZA RESULTADOS
    # =========================================

    resultados = []
    cadastrados = 0
    rejeitados = 0

    # =========================================
    # CONVERSÃO DE DATA
    # =========================================

    def converter_data(valor):
        if not valor:
            raise ValueError(
                "A data de cadastro é obrigatória."
            )

        if isinstance(valor, datetime):
            return valor.date()

        if isinstance(valor, date):
            return valor

        valor = str(valor).strip()

        formatos = [
            "%Y-%m-%d",
            "%d/%m/%Y",
            "%d-%m-%Y",
            "%Y/%m/%d",
            "%m/%d/%y",
            "%m/%d/%Y",
        ]

        for formato in formatos:
            try:
                return datetime.strptime(
                    valor,
                    formato
                ).date()
            except ValueError:
                continue

        raise ValueError(
            f"Data inválida: '{valor}'. "
            "Use DD/MM/AAAA ou uma data válida do Excel."
        )

    # =========================================
    # CONVERSÃO DE INTEIRO
    # =========================================

    def converter_inteiro(valor, campo):
        texto = str(
            valor if valor is not None else ""
        ).strip()

        if not texto:
            raise ValueError(
                f"O campo {campo} é obrigatório."
            )

        try:
            numero_decimal = Decimal(texto)
        except (InvalidOperation, TypeError, ValueError):
            raise ValueError(
                f"O campo {campo} deve conter um número inteiro válido."
            )

        if not numero_decimal.is_finite():
            raise ValueError(
                f"O campo {campo} deve conter um número inteiro válido."
            )

        if numero_decimal != numero_decimal.to_integral_value():
            raise ValueError(
                f"O campo {campo} deve conter um número inteiro."
            )

        numero = int(numero_decimal)

        if numero < 0:
            raise ValueError(
                f"O campo {campo} não pode ser negativo."
            )

        return numero

    # =========================================
    # PRÉ-CARREGA CLIENTES
    # =========================================

    clientes_por_nome = {}

    clientes = Cliente.objects.only(
        "id",
        "nome"
    ).iterator(chunk_size=1000)

    for cliente in clientes:
        chave = (
            cliente.nome or ""
        ).strip().casefold()

        if chave:
            clientes_por_nome.setdefault(
                chave,
                []
            ).append(cliente)

    # =========================================
    # PROCESSAR PRODUTO INDIVIDUALMENTE
    # =========================================

    def processar_produto(item):

        nome = str(
            item.get("nome") or ""
        ).strip()

        descricao = str(
            item.get("descricao") or ""
        ).strip()

        nome_cliente = str(
            item.get("cliente") or ""
        ).strip()

        if not nome:
            raise ValueError(
                "O nome do produto é obrigatório."
            )

        if len(nome) > 150:
            raise ValueError(
                "O nome do produto excede 150 caracteres."
            )

        if len(descricao) > 65535:
            raise ValueError(
                "A descrição do produto é muito extensa."
            )

        if not nome_cliente:
            raise ValueError(
                "A coluna Cliente não foi preenchida."
            )

        clientes_encontrados = clientes_por_nome.get(
            nome_cliente.casefold(),
            []
        )

        if not clientes_encontrados:
            raise ValueError(
                f"O cliente '{nome_cliente}' não está cadastrado no sistema."
            )

        if len(clientes_encontrados) > 1:
            raise ValueError(
                f"Mais de um cliente possui o nome '{nome_cliente}'. "
                "Informe um identificador único para evitar vínculo incorreto."
            )

        cliente_obj = clientes_encontrados[0]

        quantidade = converter_inteiro(
            item.get("quantidade"),
            "Quantidade"
        )

        valor_unitario = moeda_para_decimal(
            str(
                item.get("valor_unitario") or ""
            ).strip()
        )

        desconto_texto = str(
            item.get("desconto") or ""
        ).strip()

        if not desconto_texto:
            desconto = Decimal("0")
        else:
            try:
                desconto = porcentagem_para_decimal(
                    desconto_texto
                )
            except (InvalidOperation, ValueError):
                raise ValueError(
                    "Desconto inválido. Informe um número entre 0 e 100 "
                    "ou deixe a célula em branco."
                )

        if desconto < 0 or desconto > 100:
            raise ValueError(
                "Desconto inválido. Informe um número entre 0 e 100."
            )

        data_cadastro = converter_data(
            item.get("data_cadastro")
        )

        if valor_unitario < Decimal("0"):
            raise ValueError(
                "O valor unitário não pode ser negativo."
            )

        total_sem_desconto = (
            quantidade * valor_unitario
        )

        valor_desconto = (
            total_sem_desconto *
            (desconto / Decimal("100"))
        )

        total_com_desconto = (
            total_sem_desconto - valor_desconto
        )

        codigo = (
            f"PROD-{uuid.uuid4().hex.upper()}"
        )

        produto = Produto(
            nome=nome,
            codigo=codigo,
            descricao=descricao,
            cliente=cliente_obj,
            quantidade=quantidade,
            valor_unitario=valor_unitario,
            desconto=desconto,
            valor_total=total_com_desconto,
            total_sem_desconto=total_sem_desconto,
            total_com_desconto=total_com_desconto,
            data_cadastro=data_cadastro,
            criado_por=request.user,
            status_saida=0,
        )

        produto.full_clean(
            validate_unique=False
        )

        with transaction.atomic():
            produto.save()

        return produto

    # =========================================
    # PROCESSAMENTO INDIVIDUAL DAS LINHAS
    # =========================================

    for indice, item in enumerate(
        produtos_recebidos,
        start=1
    ):

        nome_produto = str(
            item.get("nome") or ""
        ).strip()

        codigo_planilha = str(
            item.get("codigo") or ""
        ).strip()

        try:
            produto = processar_produto(item)

            cadastrados += 1

            resultados.append({
                "linha": indice + 1,
                "status": "sucesso",
                "produto": produto.nome,
                "codigo": produto.codigo,
                "cliente": produto.cliente.nome,
                "mensagem": "Produto cadastrado com sucesso."
            })

        except (
            ValueError,
            InvalidOperation,
            ValidationError
        ) as erro:

            rejeitados += 1

            if isinstance(erro, ValidationError):

                if hasattr(erro, "message_dict"):
                    detalhes = []

                    for campo, mensagens in erro.message_dict.items():
                        detalhes.extend(
                            f"{campo}: {mensagem}"
                            for mensagem in mensagens
                        )

                    mensagem_erro = "; ".join(detalhes)

                else:
                    mensagem_erro = "; ".join(
                        erro.messages
                    )

            else:
                mensagem_erro = str(erro)

            resultados.append({
                "linha": indice + 1,
                "status": "erro",
                "produto": nome_produto,
                "codigo": codigo_planilha,
                "mensagem": mensagem_erro
            })

        except Exception:

            rejeitados += 1

            logger.exception(
                "Erro inesperado no cadastro em massa. "
                "Linha: %s | Produto: %s",
                indice + 1,
                nome_produto or "Sem nome"
            )

            resultados.append({
                "linha": indice + 1,
                "status": "erro",
                "produto": nome_produto or "Produto sem nome",
                "codigo": codigo_planilha,
                "mensagem": (
                    "Erro interno ao cadastrar o produto. "
                    "Consulte os logs do servidor."
                )
            })

    # =========================================
    # RETORNA RESULTADO DO PROCESSAMENTO
    # =========================================
    return JsonResponse({
        "status": "ok",
        "mensagem": "Processamento concluído.",
        "total_recebido": len(produtos_recebidos),
        "cadastrados": cadastrados,
        "rejeitados": rejeitados,
        "resultados": resultados
    })
    
def validar_planilha_usuarios(arquivo, usuario):
    """
    Confere se a planilha é uma planilha oficial de usuários
    e localiza o token correspondente ao usuário logado.
    """

    if not arquivo:
        raise ValueError("Nenhuma planilha foi enviada.")

    try:
        arquivo.seek(0)

        workbook = load_workbook(
            arquivo,
            read_only=True,
            data_only=True
        )

        if "_VALIDACAO" not in workbook.sheetnames:
            workbook.close()
            raise ValueError("Planilha sem identificação de segurança.")

        planilha_validacao = workbook["_VALIDACAO"]

        identificador = planilha_validacao["A1"].value
        versao = planilha_validacao["A2"].value
        token = planilha_validacao["A3"].value

        workbook.close()

        if identificador != "PLANILHA_USUARIOS":
            raise ValueError("Esta não é uma planilha de usuários válida.")

        if str(versao) != "1.0":
            raise ValueError("Versão da planilha não suportada.")

        if not token:
            raise ValueError("Token de segurança não encontrado.")

        arquivo.seek(0)

        token_planilha = localizar_token_planilha(
            token=token,
            tipo="usuario",
            usuario=usuario.perfil
        )

        if not token_planilha:
            raise ValueError("Token inválido ou não pertence a este usuário.")

        return token_planilha

    except ValueError:
        raise

    except Exception:
        raise ValueError("Não foi possível validar a planilha enviada.")

    finally:
        arquivo.seek(0)

@login_required
@require_POST
def processar_cadastro_usuarios_massa(request):

    arquivo = request.FILES.get("arquivo_planilha")

    if not arquivo:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Selecione uma planilha para importar."
        }, status=400)

    if not arquivo.name.lower().endswith(".xlsx"):
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Envie uma planilha no formato .xlsx."
        }, status=400)

    try:
        token_planilha = validar_planilha_usuarios(
            arquivo,
            request.user
        )

    except ValueError as erro:
        return JsonResponse({
            "sucesso": False,
            "mensagem": str(erro)
        }, status=400)

    # Consome o token atomicamente para impedir reutilização.
    agora = timezone.now()

    token_consumido = TokenPlanilha.objects.filter(
        pk=token_planilha.pk,
        usuario=request.user.perfil,
        tipo="usuario",
        utilizado=False,
        expira_em__gt=agora
    ).update(
        utilizado=True,
        utilizado_em=agora
    )

    if token_consumido != 1:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Token expirado ou já utilizado. Baixe uma nova planilha."
        }, status=400)

    try:
        arquivo.seek(0)

        workbook = load_workbook(
            arquivo,
            read_only=True,
            data_only=True
        )

        planilha = workbook.active

        cabecalhos_esperados = [
            "Nome",
            "Usuário",
            "CEP",
            "Endereço",
            "Número",
            "Cidade",
            "Bairro",
            "Estado",
            "Complemento",
            "Telefone",
            "E-mail",
            "Data de Nascimento",
            "RG",
            "CPF",
            "CNPJ",
        ]

        cabecalhos_recebidos = [
            str(celula or "").strip()
            for celula in next(
                planilha.iter_rows(min_row=1, max_row=1, values_only=True)
            )
        ]

        if cabecalhos_recebidos != cabecalhos_esperados:
            workbook.close()

            return JsonResponse({
                "sucesso": False,
                "mensagem": (
                    "Os cabeçalhos da planilha não correspondem "
                    "ao modelo oficial de cadastro de usuários."
                )
            }, status=400)

        # Verifica se existem dados fora das 17 colunas esperadas.
        linhas = list(
            planilha.iter_rows(
                min_row=2,
                max_col=16,
                values_only=True
            )
        )

        if any(
            any(valor is not None for valor in linha[15:])
            for linha in linhas
        ):
            workbook.close()

            return JsonResponse({
                "sucesso": False,
                "mensagem": "A planilha contém dados fora das colunas permitidas."
            }, status=400)

        linhas_com_dados = [
            linha[:15]
            for linha in linhas
            if any(
                valor is not None and str(valor).strip()
                for valor in linha[:15]
            )
        ]

        if len(linhas_com_dados) > 500:
            workbook.close()

            return JsonResponse({
                "sucesso": False,
                "mensagem": "O limite máximo é de 500 usuários por importação."
            }, status=400)

        workbook.close()

    except Exception:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Não foi possível ler a planilha. Verifique o arquivo."
        }, status=400)

    dados_existentes = carregar_dados_existentes()

    cadastrados = []
    rejeitados = []

    for numero_linha, linha in enumerate(linhas_com_dados, start=2):

        dados_linha = dados_existentes.copy()

        try:
            (
                nome,
                username,
                cep,
                endereco,
                numero,
                cidade,
                bairro,
                estado,
                complemento,
                telefone,
                email,
                data_nascimento,
                rg,
                cpf,
                cnpj,
            ) = linha

            # Normalização dos campos textuais.
            nome = str(nome or "").strip()
            username = str(username or "").strip()
            endereco = str(endereco or "").strip()
            numero = str(numero or "").strip()
            cidade = str(cidade or "").strip()
            bairro = str(bairro or "").strip()
            estado = str(estado or "").strip().upper()
            complemento = str(complemento or "").strip()

            if not nome:
                raise ValueError("Nome não informado.")

            if not username:
                raise ValueError("Nome de usuário não informado.")

            if not email:
                raise ValueError("E-mail não informado.")

            email = validar_email(email)

            telefone = formatar_telefone(telefone)
            cep = formatar_cep(cep)

            cpf = formatar_cpf(cpf)
            cnpj = formatar_cnpj(cnpj)
            rg = formatar_rg(rg)

            # Verifica duplicidades no banco e na própria planilha.
            verificar_duplicidade("username", username, dados_linha)
            verificar_duplicidade("email", email, dados_linha)
            verificar_duplicidade("telefone", telefone, dados_linha)
            verificar_duplicidade("rg", rg, dados_linha)
            verificar_duplicidade("cpf", cpf, dados_linha)
            verificar_duplicidade("cnpj", cnpj, dados_linha)

            # Valida a senha conforme AUTH_PASSWORD_VALIDATORS.
            usuario_validacao = User(
                username=username,
                email=email,
                first_name=nome
            )

            senha_temporaria = gerar_senha_temporaria(
                usuario_validacao
            )

            # Validação dos demais campos.
            if estado and len(estado) != 2:
                raise ValueError("Estado deve possuir 2 caracteres.")

            if data_nascimento:
                if isinstance(data_nascimento, datetime):
                    data_nascimento = data_nascimento.date()

                elif isinstance(data_nascimento, date):
                    pass

                else:
                    data_nascimento = datetime.strptime(
                        str(data_nascimento).strip(),
                        "%d/%m/%Y"
                    ).date()

            # Criação do usuário e perfil em uma única transação.
            with transaction.atomic():

                usuario = User.objects.create_user(
                    username=username,
                    email=email,
                    password=senha_temporaria,
                    first_name=nome
                )

                perfil = usuario.perfil

                perfil.cep = cep
                perfil.endereco = endereco
                perfil.numero = numero
                perfil.cidade = cidade
                perfil.bairro = bairro
                perfil.estado = estado
                perfil.complemento = complemento
                perfil.telefone = telefone
                perfil.data_nascimento = data_nascimento
                perfil.rg = rg
                perfil.cpf = cpf
                perfil.cnpj = cnpj

                # Todos começam com acesso de usuário comum.
                perfil.acesso = "Usuário"

                perfil.save()

            # Reserva os valores somente após o cadastro concluído.
            dados_existentes["username"].add(username.casefold())
            dados_existentes["email"].add(email.casefold())
            dados_existentes["telefone"].add(somente_numeros(telefone))

            if rg:
                dados_existentes["rg"].add(somente_numeros(rg))

            if cpf:
                dados_existentes["cpf"].add(somente_numeros(cpf))

            if cnpj:
                dados_existentes["cnpj"].add(somente_numeros(cnpj))

            cadastrados.append({
                "linha": numero_linha,
                "nome": nome,
                "username": username,
                "senha": senha_temporaria,
                "status": "Cadastrado"
            })

        except ValueError as erro:
            rejeitados.append({
                "linha": numero_linha,
                "nome": str(linha[0] or ""),
                "motivo": str(erro)
            })

        except Exception as erro:
            logger.exception(
                "Erro ao cadastrar usuário na linha %s",
                numero_linha
            )

            rejeitados.append({
                "linha": numero_linha,
                "nome": str(linha[0] or ""),
                "motivo": "Erro interno ao cadastrar este usuário."
            })

    resposta = JsonResponse({
        "sucesso": True,
        "total_recebido": len(linhas_com_dados),
        "cadastrados": len(cadastrados),
        "rejeitados": len(rejeitados),
        "resultados": cadastrados,
        "erros": rejeitados,
    })

    resposta["Cache-Control"] = "no-store, private"

    return resposta
    
def gerar_senha_temporaria(usuario):
    caracteres = (
        "abcdefghijkmnopqrstuvwxyz"
        "ABCDEFGHJKLMNPQRSTUVWXYZ"
        "23456789"
        "!@#$%&*"
    )

    for _ in range(10):
        senha = get_random_string(
            length=24,
            allowed_chars=caracteres
        )

        try:
            validate_password(senha, user=usuario)
            return senha

        except ValidationError:
            continue

    raise RuntimeError(
        "Não foi possível gerar uma senha válida."
    )

'''@login_required
def listar_produtos(request):
    
    produtos = Produto.objects.all().order_by("-id")
    
    return render(request, "modais/modal_tabela_produtos.html", {"produtos":produtos})'''
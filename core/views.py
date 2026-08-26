from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from produtos.models import Produto
from decimal import Decimal
from django.http import JsonResponse
import random
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.views.decorators.http import require_POST
from clientes.models import Cliente
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from accounts.models import PerfilUsuario
from datetime import datetime
from notificacoes.models import Notificacao
from django.utils.dateparse import parse_datetime



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

    produtos = Produto.objects.all().order_by("-id")
    clientes = Cliente.objects.all().order_by("nome")

    return render(
        request,
        "produtos.html",
        {
            "produtos": produtos,
            "clientes": clientes
        }
    )
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
def relatorios(request):
    return render(request, 'relatorios.html',{'clientes_relatorio':[]})



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
                # Só considera alteração se o valor numérico for diferente do banco
                if abs(valor_convertido - cliente.valor_gasto) > Decimal("0.001"):
                    alterou_valor = True
                    novo_valor_gasto = valor_convertido
            except Exception:
                pass

        # 3. Datas Sensíveis (Última Compra e Última Atualização)
        data_atualizacao_original_str = (
            timezone.localtime(cliente.ultima_atualizacao).strftime("%d/%m/%Y %H:%M")
            if cliente.ultima_atualizacao else "-"
        )
        data_compra_original_str = (
            timezone.localtime(cliente.ultima_compra).strftime("%d/%m/%Y %H:%M")
            if cliente.ultima_compra else "-"
        )

        data_atualizacao_post = request.POST.get("ultima_atualizacao", "").strip()
        data_compra_post = request.POST.get("ultima_compra", "").strip()

        alterou_data_atualizacao = bool(data_atualizacao_post and data_atualizacao_post != data_atualizacao_original_str)
        alterou_data_compra = bool(data_compra_post and data_compra_post != data_compra_original_str)

        # =========================================================
        # 2. CHECK SE REALMENTE ALTEROU ALGUM DOS 4 SENSÍVEIS
        # =========================================================
        alterou_dados_sensiveis = (
            alterou_modo or
            alterou_valor or
            alterou_data_atualizacao or
            alterou_data_compra
        )

        # =========================================================
        # 3. VALIDAÇÃO DE SENHA (SOMENTE SE ALTEROU DADOS SENSÍVEIS)
        # =========================================================
        if alterou_dados_sensiveis:
            senha_confirmacao = request.POST.get("senha_confirmacao", "").strip()

            if not senha_confirmacao:
                return JsonResponse({
                    "sucesso": False,
                    "mensagem": "Campos de dados sensíveis foram alterados. Por favor, informe sua senha para prosseguir."
                }, status=400)

            if not request.user.check_password(senha_confirmacao):
                return JsonResponse({
                    "sucesso": False,
                    "mensagem": "Senha incorreta. A alteração de dados sensíveis foi bloqueada."
                }, status=403)

        # =========================================================
        # 4. ATUALIZAÇÃO DOS CAMPOS NORMAIS (CATEGORIA, NOME, ETC.)
        # =========================================================
        cliente.tipo_cliente = tipo_cliente
        cliente.nome = request.POST.get("nome", "").strip()
        cliente.razao_social = request.POST.get("razao_social", "").strip() or None
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
        cliente.categoria_cnh = request.POST.get("categoria_cnh", "").strip() or None
        cliente.emissao_cnh = request.POST.get("emissao_cnh", "").strip() or None
        cliente.vencimento_cnh = request.POST.get("vencimento_cnh", "").strip() or None

        cliente.cep = request.POST.get("cep", "").strip()
        cliente.estado = request.POST.get("estado", "").strip()
        cliente.endereco = request.POST.get("endereco", "").strip()
        cliente.numero = request.POST.get("numero", "").strip()
        cliente.complemento = request.POST.get("complemento", "").strip() or None
        cliente.cidade = request.POST.get("cidade", "").strip()
        cliente.bairro = request.POST.get("bairro", "").strip()

        cliente.status = request.POST.get("status", "").strip()
        
        # Categoria do Cliente (Campo Normal)
        cliente.categoria = request.POST.get("categoria", "").strip()

        # Atualiza os dados sensíveis caso tenham sido alterados e aprovados pela senha
        if modo_post:
            cliente.modo_valor_gasto = modo_post
        if alterou_valor:
            cliente.valor_gasto = novo_valor_gasto

        cliente.save()

        if cliente.modo_valor_gasto == "Automático (somar produtos)":
            cliente.atualizar_valor_gasto_automatico()

        # =========================================================
        # 5. RETORNO DOS DADOS FORMATADOS
        # =========================================================
        data_inclusao_fmt = (
            timezone.localtime(cliente.data_inclusao).strftime("%d/%m/%Y %H:%M")
            if cliente.data_inclusao
            else "-"
        )
        data_atualizacao_fmt = (
            timezone.localtime(cliente.ultima_atualizacao).strftime("%d/%m/%Y %H:%M")
            if cliente.ultima_atualizacao
            else "-"
        )
        ultima_compra_fmt = (
            timezone.localtime(cliente.ultima_compra).strftime("%d/%m/%Y %H:%M")
            if cliente.ultima_compra
            else "-"
        )

        emissao_cnh_fmt = (
            cliente.emissao_cnh.strftime("%d/%m/%Y") if cliente.emissao_cnh else "-"
        )
        vencimento_cnh_fmt = (
            cliente.vencimento_cnh.strftime("%d/%m/%Y") if cliente.vencimento_cnh else "-"
        )
        # Formata com separador de milhar '.' e decimal ',' (ex: 144.522,21)
        valor_gasto_fmt = f"{cliente.valor_gasto:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

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
                "emissao_cnh_raw": cliente.emissao_cnh.strftime("%Y-%m-%d") if cliente.emissao_cnh else "",
                "vencimento_cnh_raw": cliente.vencimento_cnh.strftime("%Y-%m-%d") if cliente.vencimento_cnh else "",
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
            {"sucesso": False, "mensagem": f"Erro interno: {str(erro)}"}, status=500
        )
@login_required
@require_POST
def excluir_cliente(request, cliente_id):
    try:
        cliente = get_object_or_404(Cliente, id=cliente_id)
        nome_cliente = cliente.nome
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
        


'''@login_required
def listar_produtos(request):
    
    produtos = Produto.objects.all().order_by("-id")
    
    return render(request, "modais/modal_tabela_produtos.html", {"produtos":produtos})'''
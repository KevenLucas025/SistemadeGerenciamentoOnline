from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from estoque.models import Produto
from decimal import Decimal
from django.http import JsonResponse
import random
from django.shortcuts import get_object_or_404


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
            quantidade = int(request.POST.get("quantidade"))
            valor_unitario = moeda_para_decimal(request.POST.get("valor_unitario"))
            desconto = porcentagem_para_decimal(request.POST.get("desconto"))

            total_sem_desconto = quantidade * valor_unitario
            valor_desconto = total_sem_desconto * (desconto / Decimal("100"))
            total_com_desconto = total_sem_desconto - valor_desconto

            Produto.objects.create(
                nome=request.POST.get("nome"),
                codigo=request.POST.get("codigo"),
                descricao=request.POST.get("descricao"),
                cliente=request.POST.get("cliente"),
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

    return render(
        request,
        "produtos.html",
        {
            "produtos": produtos
        }
    )
@login_required
def cadastrar_usuarios(request):
    return render(request, 'cadastrar_usuarios.html',{'cadastrar_usuarios':[]})


@login_required
def clientes(request):
    return render(request,  'clientes.html',{'clientes':[]})

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

'''@login_required
def listar_produtos(request):
    
    produtos = Produto.objects.all().order_by("-id")
    
    return render(request, "modais/modal_tabela_produtos.html", {"produtos":produtos})'''
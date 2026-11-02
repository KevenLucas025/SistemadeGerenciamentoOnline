from django.shortcuts import render
from django.contrib.auth.decorators import login_required
import re
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from accounts.models import PerfilUsuario


@login_required
def ir_pagina_cadastro_massa_usuarios(request):
    return render(
        request,
        "cadastrar_usuarios_massa.html"
    )

def somente_numeros(valor):
    """Remove todos os caracteres que não sejam números."""
    return re.sub(r"\D", "", str(valor or ""))


def formatar_cpf(valor):
    cpf = somente_numeros(valor)

    if not cpf:
        return ""

    if len(cpf) != 11 or cpf == cpf[0] * 11:
        raise ValueError("CPF inválido.")

    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digito1 = (soma * 10) % 11
    digito1 = 0 if digito1 == 10 else digito1

    if digito1 != int(cpf[9]):
        raise ValueError("CPF inválido.")

    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digito2 = (soma * 10) % 11
    digito2 = 0 if digito2 == 10 else digito2

    if digito2 != int(cpf[10]):
        raise ValueError("CPF inválido.")

    return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}"


def formatar_cnpj(valor):
    cnpj = somente_numeros(valor)

    if not cnpj:
        return ""

    if len(cnpj) != 14:
        raise ValueError("CNPJ deve conter exatamente 14 dígitos.")

    return (
        f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/"
        f"{cnpj[8:12]}-{cnpj[12:]}"
    )


def formatar_rg(valor):
    rg = somente_numeros(valor)

    if not rg:
        return ""

    if not 7 <= len(rg) <= 9:
        raise ValueError("RG deve possuir entre 7 e 9 dígitos.")

    # Máscara compatível com o formatador JavaScript enviado.
    rg = rg.zfill(9)

    return f"{rg[:2]}.{rg[2:5]}.{rg[5:8]}-{rg[8:]}"


def formatar_telefone(valor):
    telefone = somente_numeros(valor)

    if not telefone:
        raise ValueError("Telefone não informado.")

    if len(telefone) not in (10, 11):
        raise ValueError("Telefone deve possuir 10 ou 11 dígitos.")

    ddd = telefone[:2]
    numero = telefone[2:]

    if len(numero) == 9:
        return f"({ddd}) {numero[:5]}-{numero[5:]}"

    return f"({ddd}) {numero[:4]}-{numero[4:]}"


def formatar_cep(valor):
    cep = somente_numeros(valor)

    if not cep:
        return ""

    if len(cep) != 8:
        raise ValueError("CEP deve possuir 8 dígitos.")

    return f"{cep[:5]}-{cep[5:]}"


def validar_email(valor):
    email = str(valor or "").strip().lower()

    if not email:
        raise ValueError("E-mail não informado.")

    try:
        validate_email(email)
    except ValidationError:
        raise ValueError("E-mail inválido.")

    return email


def carregar_dados_existentes():
    """
    Carrega os dados já cadastrados para evitar consultas
    repetidas ao banco durante a importação.
    """

    dados = {
        "username": set(),
        "email": set(),
        "telefone": set(),
        "rg": set(),
        "cpf": set(),
        "cnpj": set(),
    }

    for usuario in User.objects.all().only("username", "email"):
        dados["username"].add(usuario.username.strip().casefold())
        dados["email"].add(usuario.email.strip().casefold())

    for perfil in PerfilUsuario.objects.all().only(
        "telefone", "rg", "cpf", "cnpj"
    ):
        if perfil.telefone:
            dados["telefone"].add(somente_numeros(perfil.telefone))

        if perfil.rg:
            dados["rg"].add(somente_numeros(perfil.rg))

        if perfil.cpf:
            dados["cpf"].add(somente_numeros(perfil.cpf))

        if perfil.cnpj:
            dados["cnpj"].add(somente_numeros(perfil.cnpj))

    return dados


def verificar_duplicidade(campo, valor, dados_existentes):
    """
    Verifica se um valor já está cadastrado ou foi utilizado
    anteriormente na mesma importação.
    """

    if not valor:
        return

    if campo in ("username", "email"):
        valor = valor.strip().casefold()
    else:
        valor = somente_numeros(valor)

    if valor in dados_existentes[campo]:
        nomes = {
            "username": "Nome de usuário",
            "email": "E-mail",
            "telefone": "Telefone",
            "rg": "RG",
            "cpf": "CPF",
            "cnpj": "CNPJ",
        }

        raise ValueError(f"{nomes[campo]} já cadastrado ou repetido na planilha.")

    # Reserva o valor para impedir duplicidade nas próximas linhas.
    dados_existentes[campo].add(valor)

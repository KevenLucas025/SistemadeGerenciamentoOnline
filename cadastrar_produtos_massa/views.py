from io import BytesIO
import pandas as pd
from django.http import Http404, HttpResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.styles import Protection
from accounts.tokens import gerar_token_planilha
from accounts.tokens import localizar_token_planilha
from openpyxl import load_workbook
import logging

logger = logging.getLogger(__name__)


# LEVA ATÉ A PÁGINA DE CADASTRAR PRODUTOS EM MASSA
@login_required
def ir_pagina_produtos_massa(request):
    return render(
        request,
        "cadastrar_produtos_massa.html",
    )
    
    
@login_required
def baixar_planilha_exemplo(request, tipo):
    if tipo == "produtos":
        nome_arquivo = "Produtos Exemplo.xlsx"
        nome_aba = "Produtos"
    
        dados = {
            "Produto": [
                "Notebook Exemplo",
                "Mouse sem Fio",
                "Impressora Exemplo",
                "Monitor Full HD",
            ],
            "Quantidade": [10, 50, 5, 20],
            "Valor Unitário": [4500.00, 150.00, 1200.00, 900.00],
            "Desconto": [5, "Sem desconto", 10, "Sem desconto"],
            "Data do Cadastro": [
                "10/05/2024",
                "10/04/2024",
                "10/03/2024",
                "10/02/2024",
            ],
            "Código do Item": [
                "Gerado automaticamente",
                "Gerado automaticamente",
                "Gerado automaticamente",
                "Gerado automaticamente",
            ],
            "Cliente": [
                "João da Silva",
                "Maria Oliveira",
                "Pedro Santos",
                "Carla Lima",
            ],
            "Descrição": [
                "Notebook com 16GB RAM e SSD",
                "Mouse sem fio",
                "Impressora multifuncional",
                "Monitor de 24 polegadas",
            ],
        }
    elif tipo == "usuarios":
        nome_arquivo = "Usuarios Exemplos.xlsx"
        nome_aba = "Usuários"

        dados = {
            "Nome": [
                "Usuário Exemplo 1",
                "Usuário Exemplo 2",
                "Usuário Exemplo 3",
                "Usuário Exemplo 4",
            ],
            "Usuário": [
                "Exemplo 1",
                "Exemplo 2",
                "Exemplo 3",
                "Exemplo 4",
            ],
            "CEP": [
                "00000-001",
                "00000-002",
                "00000-003",
                "00000-004",
            ],
            "Endereço": [
                "Rua A",
                "Rua B",
                "Rua C",
                "Rua D",
            ],
            "Número": [123, 456, 789, 101],
            "Cidade": [
                "Campinas",
                "Sumaré",
                "São Paulo",
                "Monte Mor",
            ],
            "Bairro": [
                "Centro",
                "Zona Sul",
                "Zona Norte",
                "Zona Leste",
            ],
            "Estado": ["SP", "SP", "SP", "SP"],
            "Complemento": [
                "Apto 1",
                "Opcional",
                "Opcional",
                "Casa 2",
            ],
            "Telefone": [
                "(11) 00000-0001",
                "(11) 00000-0002",
                "(11) 00000-0003",
                "(11) 00000-0004",
            ],
            "E-mail": [
                "usuario1@exemplo.com",
                "usuario2@exemplo.com",
                "usuario3@exemplo.com",
                "usuario4@exemplo.com",
            ],
            "Data de Nascimento": [
                "01/01/2000",
                "02/02/1995",
                "03/03/1990",
                "04/04/1985",
            ],
            "RG": [
                "00.000.000-1",
                "00.000.000-2",
                "00.000.000-3",
                "00.000.000-4",
            ],
            "CPF": [
                "529.982.247-25",
                "111.444.777-35",
                "935.411.347-80",
                "168.995.350-09",
            ],
            "CNPJ": [
                "11.222.333/0001-81",
                "12.345.678/0001-95",
                "45.723.174/0001-10",
                "61.234.567/0001-15",
            ],
        }
    else:
        raise Http404("Tipo de planilha não encontrado.")
    
    df = pd.DataFrame(dados)
    
    arquivo = BytesIO()
    
    df.to_excel(
        arquivo,
        index=False,
        engine="openpyxl",
        sheet_name=nome_aba,
    )
    
    arquivo.seek(0)
    
    workbook = load_workbook(arquivo)
    worksheet = workbook[nome_aba]
    
    # ESTILO DO CABEÇALHO
    for cell in worksheet[1]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill(
            fill_type="solid",
            fgColor="334155",
        )
        cell.alignment = Alignment(
            horizontal="center",
            vertical="center",
        )
        
    # =========================================
    # PROTEÇÃO DOS CABEÇALHOS
    # =========================================

    # DESBLOQUEIA TODAS AS CÉLULAS UTILIZADAS
    for linha in worksheet.iter_rows():
        for cell in linha:
            cell.protection = Protection(locked=False)

    # DESBLOQUEIA AS CÉLULAS VAZIAS ATÉ A LINHA 501
    for linha in range(worksheet.max_row + 1, 502):
        for coluna in range(1, len(df.columns) + 1):
            worksheet.cell(
                row=linha,
                column=coluna
            ).protection = Protection(locked=False)

    # BLOQUEIA SOMENTE OS CABEÇALHOS
    for cell in worksheet[1]:
        cell.protection = Protection(locked=True)

    # ATIVA A PROTEÇÃO
    worksheet.protection.password = "1234"
    worksheet.protection.sheet = True
    
    # DIAGNÓSTICO DA PROTEÇÃO
    """print("A1 bloqueada:", worksheet["A1"].protection.locked)
    print("A2 bloqueada:", worksheet["A2"].protection.locked)
    print("B2 bloqueada:", worksheet["B2"].protection.locked)
    print("Proteção ativa:", worksheet.protection.sheet)"""

    # AJUSTA A LARGURA DAS COLUNAS
    for coluna in worksheet.columns:
        maior_largura = 0
        letra_coluna = get_column_letter(coluna[0].column)

        for cell in coluna:
            cell.alignment = Alignment(
                horizontal="center",
                vertical="center",
            )

            if cell.value is not None:
                maior_largura = max(
                    maior_largura,
                    len(str(cell.value)),
                )

        worksheet.column_dimensions[letra_coluna].width = min(
            maior_largura + 2,
            45,
        )

    worksheet.freeze_panes = "A2"
    worksheet.auto_filter.ref = worksheet.dimensions
    
    # =========================================
    # IDENTIFICAÇÃO DA PLANILHA
    # =========================================
    # Converte o tipo recebido pela URL
    tipos_planilha = {
        "produtos": "produto",
        "usuarios": "usuario",
    }

    tipo_token = tipos_planilha.get(tipo)

    if not tipo_token:
        raise Http404("Tipo de planilha não encontrado.")

    # Gera token individual para o usuário autenticado
    token = gerar_token_planilha(
        usuario=request.user.perfil,
        tipo=tipo_token
    )

    # Cria a aba exclusiva de identificação
    aba_validacao = workbook.create_sheet("_VALIDACAO")

    aba_validacao["A1"] = f"PLANILHA_{tipo.upper()}"
    aba_validacao["A2"] = "1.0"
    aba_validacao["A3"] = token

    # Oculta completamente a aba na interface normal do Excel
    aba_validacao.sheet_state = "veryHidden"

    # SALVA A FORMATAÇÃO NO ARQUIVO EM MEMÓRIA
    arquivo_formatado = BytesIO()
    workbook.save(arquivo_formatado)
    arquivo_formatado.seek(0)

    # DEVOLVE O ARQUIVO PARA DOWNLOAD
    response = HttpResponse(
        arquivo_formatado.getvalue(),
        content_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
    )

    response["Content-Disposition"] = (
        f'attachment; filename="{nome_arquivo}"'
    )

    return response

def validar_planilha_produtos(arquivo, usuario):
    """
    Valida a identificação da planilha de produtos
    utilizando o token individual registrado no banco.
    """

    workbook = None

    try:
        arquivo.seek(0)

        workbook = load_workbook(
            arquivo,
            read_only=True,
            data_only=True
        )

        if "_VALIDACAO" not in workbook.sheetnames:
            return None

        aba = workbook["_VALIDACAO"]

        identificador = aba["A1"].value
        versao = aba["A2"].value
        token = aba["A3"].value

        if identificador != "PLANILHA_PRODUTOS":
            return None

        if versao != "1.0":
            return None

        return localizar_token_planilha(
            token=token,
            tipo="produto",
            usuario=usuario.perfil
        )

    except Exception:
        logger.exception("Erro ao validar a planilha de produtos.")
        return None

    finally:
        if workbook:
            workbook.close()

        arquivo.seek(0)
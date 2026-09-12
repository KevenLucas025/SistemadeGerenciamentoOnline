from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.template.loader import render_to_string
from django.views.decorators.http import require_GET
from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404
from django.utils import timezone
from accounts.models import PerfilUsuario  
from .models import HistoricoUsuario
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl import Workbook
from openpyxl.utils import get_column_letter
from io import BytesIO
from django.http import HttpResponse
from xhtml2pdf import pisa
from django.views.decorators.http import require_http_methods
import json
import csv
from django.core.cache import cache
from datetime import datetime

CACHE_KEY_HISTORICO_PAUSADO = "historico_atividades_pausado"


@login_required
@require_GET
def atualizar_tabela_usuarios_status(request):
    """
    Retorna apenas as linhas HTML da tabela solicitada ('ativos' ou 'inativos').
    """
    status_tipo = request.GET.get("tipo", "ativos").lower()

    if status_tipo == "inativos":
        usuarios_lista = User.objects.filter(is_active=False).select_related("perfil").order_by("-date_joined")
        template_parcial = "usuarios/linhas_tabela_inativos.html"
        context_var = "usuarios_inativos"
    else:
        usuarios_lista = User.objects.filter(is_active=True).select_related("perfil").order_by("-date_joined")
        template_parcial = "usuarios/linhas_tabela_ativos.html"
        context_var = "usuarios"

    context = {
        context_var: usuarios_lista,
        "usuario_atual_id": request.user.id,
        "request": request,
    }

    html_linhas = render_to_string(template_parcial, context, request=request)

    return JsonResponse({
        "sucesso": True,
        "tipo": status_tipo,
        "quantidade": usuarios_lista.count(),
        "html": html_linhas
    })
    
@login_required
@require_POST
def gerar_saida_usuario(request, usuario_id):
    if request.user.id == usuario_id:
        return JsonResponse({
            "sucesso": False,
            "mensagem": "Você não pode gerar saída para a sua própria conta conectada."
        }, status=400)

    try:
        usuario = get_object_or_404(User, id=usuario_id)

        if not usuario.is_active:
            return JsonResponse({
                "sucesso": False,
                "mensagem": "Este usuário já está inativo."
            }, status=400)

        # 1. Inativa o usuário no Django
        usuario.is_active = False
        usuario.save()

        # 2. Garante a existência do perfil (evita erro "User has no perfil")
        perfil, _ = PerfilUsuario.objects.get_or_create(usuario=usuario)
        perfil.data_inatividade = timezone.now()
        perfil.save(update_fields=["data_inatividade"])
        
        # 3. Grava no Histórico apenas se NÃO estiver pausado
        historico_pausado = cache.get(CACHE_KEY_HISTORICO_PAUSADO, False)
        if not historico_pausado:
            HistoricoUsuario.objects.create(
                acao='saida',
                descricao=f"O usuário {usuario.get_full_name() or usuario.username} teve a saída gerada e foi inativado.",
                usuario_afetado=usuario,
                nome_usuario_afetado=usuario.get_full_name() or usuario.username,
                usuario_responsavel=request.user
            )

        return JsonResponse({
            "sucesso": True,
            "mensagem": f"Saída gerada com sucesso! O usuário '{usuario.username}' agora está inativo."
        })

    except Exception as e:
        return JsonResponse({
            "sucesso": False,
            "mensagem": f"Erro interno ao gerar saída: {str(e)}"
        }, status=500)
        
        
@login_required
def listar_historico(request):
    ordem = request.GET.get("ordem", "desc").lower()
    data_filtro = request.GET.get("data", "").strip()

    campo_ordem = "data_hora" if ordem == "asc" else "-data_hora"
    queryset = HistoricoUsuario.objects.all().select_related('usuario_responsavel')

    # Filtra por data específica se fornecida no padrão DD/MM/AAAA
    if data_filtro:
        try:
            data_obj = datetime.strptime(data_filtro, "%d/%m/%Y").date()
            queryset = queryset.filter(data_hora__date=data_obj)
        except ValueError:
            pass  # Se a data estiver incompleta ou inválida, ignora o filtro

    registros = queryset.order_by(campo_ordem)

    dados = []
    for r in registros:
        dados.append({
            "id": r.id,
            "data_hora": r.data_hora.strftime("%d/%m/%Y %H:%M:%S"),
            "usuario_logado": r.usuario_responsavel.username if r.usuario_responsavel else "Sistema",
            "acao": r.get_acao_display() if hasattr(r, 'get_acao_display') else r.acao,
            "descricao": r.descricao,
        })

    return JsonResponse({"sucesso": True, "historico": dados, "ordem": ordem})


@login_required
@require_POST
def apagar_historico(request):
    try:
        dados = json.loads(request.body)
        ids = dados.get('ids', [])
        
        if not ids:
            return JsonResponse({'sucesso': False, 'mensagem': 'Nenhum item selecionado.'}, status=400)
            
        deletados, _ = HistoricoUsuario.objects.filter(id__in=ids).delete()
        return JsonResponse({'sucesso': True, 'mensagem': f'{deletados} registro(s) apagado(s) com sucesso!'})
    except Exception as e:
        return JsonResponse({'sucesso': False, 'mensagem': f'Erro ao apagar histórico: {str(e)}'}, status=500)
    
def _obter_queryset_historico(request):
    """
    Filtra os IDs caso venham na query string (?ids=1,2,3),
    senão retorna todo o histórico.
    """
    ids_param = request.GET.get('ids', '').strip()
    qs = HistoricoUsuario.objects.all().select_related('usuario_responsavel').order_by('-data_hora')
    
    if ids_param:
        ids = [int(i) for i in ids_param.split(',') if i.isdigit()]
        if ids:
            qs = qs.filter(id__in=ids)
    return qs
    
@login_required
@require_GET
def exportar_historico_csv(request):
    queryset = _obter_queryset_historico(request)

    # utf-8-sig garante que acentos fiquem certos tanto no Excel quanto no Bloco de Notas/VSCode
    response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
    response['Content-Disposition'] = 'attachment; filename="historico_usuarios.csv"'

    # delimiter=',' -> Delimitador padrão clássico CSV
    # quoting=csv.QUOTE_ALL -> Coloca " " em todas as colunas de texto/valores, garantindo o visual legítimo de CSV
    writer = csv.writer(
        response, 
        delimiter=',', 
        quotechar='"', 
        quoting=csv.QUOTE_NONNUMERIC
    )

    # Cabeçalho
    writer.writerow(['ID', 'DATA / HORA', 'USUARIO RESPONSAVEL', 'ACAO', 'DESCRICAO'])

    for reg in queryset:
        usuario = reg.usuario_responsavel.username if reg.usuario_responsavel else "Sistema"
        acao = reg.get_acao_display() if hasattr(reg, 'get_acao_display') else reg.acao
        
        # Limpa eventuais quebras de linha dentro da descrição para não quebrar a linha do CSV
        descricao_limpa = (reg.descricao or '').replace('\r', '').replace('\n', ' ')

        writer.writerow([
            int(reg.id),
            reg.data_hora.strftime("%d/%m/%Y %H:%M:%S"),
            usuario,
            acao,
            descricao_limpa
        ])

    return response


@login_required
@require_GET
def exportar_historico_excel(request):
    queryset = _obter_queryset_historico(request)

    wb = Workbook()
    ws = wb.active
    ws.title = "Histórico de Atividades"

    # Cabeçalho simples
    headers = ['ID', 'DATA / HORA', 'USUÁRIO RESPONSÁVEL', 'AÇÃO', 'DESCRIÇÃO']
    ws.append(headers)

    # Inserção direta das linhas sem estilos
    for reg in queryset:
        usuario = reg.usuario_responsavel.username if reg.usuario_responsavel else "Sistema"
        acao = reg.get_acao_display() if hasattr(reg, 'get_acao_display') else reg.acao

        ws.append([
            reg.id,
            reg.data_hora.strftime("%d/%m/%Y %H:%M:%S"),
            usuario,
            acao,
            reg.descricao
        ])

    # Apenas autoajuste de largura para os textos não ficarem cortados
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or '')
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 3, 10)

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    response = HttpResponse(
        buffer.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="historico_usuarios.xlsx"'
    return response

@login_required
@require_GET
def exportar_historico_pdf(request):
    queryset = _obter_queryset_historico(request)
    
    dados_historico = []
    for reg in queryset:
        usuario = reg.usuario_responsavel.username if reg.usuario_responsavel else "Sistema"
        acao = reg.get_acao_display() if hasattr(reg, 'get_acao_display') else reg.acao
        dados_historico.append({
            'id': reg.id,
            'data_hora': reg.data_hora.strftime("%d/%m/%Y %H:%M:%S"),
            'usuario_responsavel': usuario,
            'acao': acao,
            'descricao': reg.descricao
        })

    contexto = {
        'historico': dados_historico,
        'data_emissao': timezone.now().strftime("%d/%m/%Y às %H:%M:%S"),
        'usuario_emissor': request.user.username,
        'total_registros': len(dados_historico),
    }

    # Renderiza o HTML com os dados
    html_string = render_to_string('usuarios/relatorio_historico_pdf.html', contexto)

    # Gera o PDF em memória
    buffer = BytesIO()
    pisa_status = pisa.CreatePDF(html_string, dest=buffer, encoding='utf-8')

    if pisa_status.err:
        return HttpResponse("Erro ao processar e gerar o PDF.", status=500)

    buffer.seek(0)
    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="historico_usuarios.pdf"'
    return response

@login_required
@require_http_methods(["GET", "POST"])
def status_pausa_historico(request):
    """
    GET: Retorna se o histórico está pausado ou ativo.
    POST: Altera o estado (ativo ou pausado) e retorna avisos se já estiver no estado solicitado.
    """
    esta_pausado = cache.get(CACHE_KEY_HISTORICO_PAUSADO, False)

    if request.method == "GET":
        return JsonResponse({
            "sucesso": True,
            "pausado": esta_pausado
        })

    try:
        dados = json.loads(request.body)
        acao = dados.get("acao")  # "ativar" ou "pausar"

        if acao == "ativar":
            if not esta_pausado:
                return JsonResponse({
                    "sucesso": False,
                    "ja_estava": True,
                    "pausado": False,
                    "mensagem": "O histórico de atividades já está ativo."
                })
            cache.set(CACHE_KEY_HISTORICO_PAUSADO, False, timeout=None)
            return JsonResponse({
                "sucesso": True,
                "ja_estava": False,
                "pausado": False,
                "mensagem": "Histórico de atividades ativado com sucesso!"
            })

        elif acao == "pausar":
            if esta_pausado:
                return JsonResponse({
                    "sucesso": False,
                    "ja_estava": True,
                    "pausado": True,
                    "mensagem": "O histórico de atividades já está pausado."
                })
            cache.set(CACHE_KEY_HISTORICO_PAUSADO, True, timeout=None)
            return JsonResponse({
                "sucesso": True,
                "ja_estava": False,
                "pausado": True,
                "mensagem": "Histórico de atividades pausado com sucesso!"
            })

        return JsonResponse({"sucesso": False, "mensagem": "Ação inválida."}, status=400)

    except Exception as e:
        return JsonResponse({"sucesso": False, "mensagem": f"Erro interno: {str(e)}"}, status=500)
    

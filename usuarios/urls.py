from django.urls import path
from . import views

urlpatterns = [
    path("atualizar-status/", views.atualizar_tabela_usuarios_status, name="atualizar_tabela_usuarios_status"),
    path("gerar-saida/<int:usuario_id>/", views.gerar_saida_usuario, name="gerar_saida_usuario"),
    path('historico/listar/', views.listar_historico, name='listar_historico'),
    path('historico/apagar/', views.apagar_historico, name='apagar_historico'),
    path("historico/exportar-csv/", views.exportar_historico_csv, name="exportar_historico_csv"),
    path("historico/exportar-excel/", views.exportar_historico_excel, name="exportar_historico_excel"),
    path("historico/exportar-pdf/", views.exportar_historico_pdf, name="exportar_historico_pdf"),
    path("historico/status-pausa/", views.status_pausa_historico, name="status_pausa_historico"),
    path('exportar-excel/', views.exportar_usuarios_tabela_excel, name='exportar_usuarios_tabela_excel'),
    path('exportar-pdf/', views.exportar_usuarios_tabela_pdf, name='exportar_usuarios_tabela_pdf'),
    
]
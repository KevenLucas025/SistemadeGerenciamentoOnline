from django.urls import path
from . import views

urlpatterns = [
    # Suas rotas existentes...
    path('relatorio/excel/', views.exportar_relatorio_excel, name='exportar_relatorio_excel'),
    path('historico/',views.historico_clientes,name='historico_cliente'),
    path('historico/atualizar/',views.atualizar_historico_cliente, name='atualizar_historico_cliente'),
    path('historico/apagar/', views.apagar_historico_clientes, name='apagar_historico_clientes'),
    path("historico/exportar-csv-clientes/", views.exportar_historico_csv_clientes, name="exportar_historico_csv_clientes"),
    path("historico/exportar-excel-clientes/", views.exportar_historico_excel_clientes, name="exportar_historico_excel_clientes"),
    path("historico/exportar-pdf-clientes/", views.exportar_historico_pdf_clientes, name="exportar_historico_pdf_clientes"),
    path("historico/status-pausa-clientes/", views.status_pausa_historico_clientes, name="status_pausa_historico_clientes"),
    path('historico/listar-clientes/', views.listar_historico_clientes, name='listar_historico_clientes'),


]
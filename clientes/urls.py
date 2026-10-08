from django.urls import path
from . import views

urlpatterns = [
    # Suas rotas existentes...
    path('relatorio/excel/', views.exportar_relatorio_excel, name='exportar_relatorio_excel'),
    path('historico/',views.historico_clientes,name='historico_cliente'),
    path('historico/atualizar/',views.atualizar_historico_cliente, name='atualizar_historico_cliente'),
    path('historico/apagar/', views.apagar_historico_clientes, name='apagar_historico_clientes '),
]
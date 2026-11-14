from django.urls import path
from . import views

 
urlpatterns = [
    path('', views.relatorios, name='relatorios'),
    path('filtrar-clientes-juridicos/',views.filtrar_clientes_juridicos,name='filtrar_clientes_juridicos'),
    path('exportar-clientes-juridicos/',views.exportar_clientes_juridicos,name='exportar_clientes_juridicos'),
    path('filtrar-clientes-fisicos/',views.filtrar_clientes_fisicos,name='filtrar_clientes_fisicos'),
    path('exportar-clientes-fisicos/',views.exportar_clientes_fisicos,name='exportar_clientes_fisicos'),
    path('filtrar-usuarios/',views.filtrar_usuarios,name='filtrar_usuarios'),
    path('exportar-usuarios/',views.exportar_usuarios,name='exportar_usuarios'), 
    path("tempo-conexao/",views.relatorio_tempo_conexao,name="relatorio_tempo_conexao"),
    path("usuarios/<int:usuario_id>/alterar-status/",views.alterar_status_usuario_admin,name="alterar_status_usuario_admin"),
    path("relatorios/business-intelligence/",views.dados_business_intelligence,name="dados_business_intelligence"),
 
 ] 
 
 
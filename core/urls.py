from django.urls import path, include
from . import views
from usuarios.views import atualizar_tabela_usuarios_status

urlpatterns = [
    path('dashboard/', views.dashboard, name='dashboard'),
    #path('estoque/', views.estoque, name='estoque'),
    path('produtos/', views.cadastrar_produtos, name='produtos'),
    path('cadastrar_usuarios/', views.cadastrar_usuarios, name='cadastrar_usuarios'),
    path('clientes/', views.clientes, name='clientes'),
    path('relatorios/', views.relatorios, name='relatorios'),
    
    # PRODUTOS
    path('produtos/apagar/<int:id>/', views.apagar_produto, name="apagar_produto"),
    path('produtos/atualizar/<int:id>/', views.atualizar_produto, name="atualizar_produto"),
    path("produtos/atualizar-tabela/", views.atualizar_tabela_produtos, name="atualizar_tabela_produtos"),
    path("produtos/duplicar/<int:id>/", views.duplicar_produto, name="duplicar_produto"),
    
    # ESTOQUE 
    path('estoque/',include('estoque.urls')),
    
   
    # USUÁRIOS (Rotas específicas primeiro)
    path("usuarios/cadastrar/", views.cadastrar_usuario, name="cadastrar_usuario"),
    path("usuarios/atualizar/<int:usuario_id>/", views.atualizar_usuario, name="atualizar_usuario"),
    path("usuarios/atualizar-tabela/", views.atualizar_tabela_usuarios, name="atualizar_tabela_usuarios"),
    path("usuarios/atualizar-status/", atualizar_tabela_usuarios_status, name="atualizar_tabela_usuarios_status"),
    path("usuarios/verificar-username/", views.verificar_username, name="verificar_username"),
    path("usuarios/apagar/<int:usuario_id>/", views.apagar_usuario, name="apagar_usuario"),
    path("usuarios/<int:usuario_id>/", views.obter_usuario, name="obter_usuario"),
    path("usuarios/", views.usuarios, name="usuarios"),
    
    # USUÁRIOS (OBRIGATÓRIO PARA ENCONTRAR O GERAR SAIDA)
    path('usuarios/', include('usuarios.urls')),
    
    # ADM USUÁRIOS
    path('adm_usuarios/', include('adm_usuarios.urls')),
    
    # CLIENTES
    path("clientes/cadastrar/", views.cadastrar_cliente, name="cadastrar_cliente"),
    path('clientes/editar/<int:cliente_id>/', views.editar_cliente, name='editar_cliente'),
    path('clientes/excluir/<int:cliente_id>/', views.excluir_cliente, name='excluir_cliente'),
    
    
]
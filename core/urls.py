from django.urls import path
from . import views


urlpatterns = [

    path('dashboard/',views.dashboard,name='dashboard'),
    path('estoque/',views.estoque,name='estoque'),
    path('usuarios/',views.usuarios, name='usuarios'),
    path('produtos/',views.cadastrar_produtos,name='produtos'),
    path('cadastrar_usuarios/',views.cadastrar_usuarios,name='cadastrar_usuarios'),
    path('clientes/',views.clientes,name='clientes'),
    path('relatorios/', views.relatorios,name='relatorios'),
    path('produtos/apagar/<int:id>/',views.apagar_produto,name="apagar_produto"),
    path('produtos/atualizar/<int:id>/', views.atualizar_produto,name="atualizar_produto"),
    path("produtos/atualizar-tabela/",views.atualizar_tabela_produtos,name="atualizar_tabela_produtos")

]
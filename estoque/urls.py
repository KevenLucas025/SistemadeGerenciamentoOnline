from django.urls import path
from . import views

urlpatterns = [
    path('', views.estoque_view, name='estoque'),
    path('atualizar-status/', views.atualizar_tabela_estoque_status, name='atualizar_tabela_estoque_status'),
    path('gerar-saida/<int:produto_id>/', views.gerar_saida_produto, name='gerar_saida_produto'),
    path('gerar-estorno/<int:produto_id>/', views.gerar_estorno_produto, name='gerar_estorno_produto'),
    path('historico/listar/', views.carregar_historico_produtos, name='carregar_historico_produtos'),
]
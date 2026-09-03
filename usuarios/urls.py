from django.urls import path
from . import views

urlpatterns = [
    path("atualizar-status/", views.atualizar_tabela_usuarios_status, name="atualizar_tabela_usuarios_status"),
    path("gerar-saida/<int:usuario_id>/", views.gerar_saida_usuario, name="gerar_saida_usuario"),
    
]
from django.urls import path
from . import views

urlpatterns = [
    path("atualizar-status/", views.atualizar_tabela_usuarios_status, name="atualizar_tabela_usuarios_status"),
    
]
from django.urls import path
from . import views


urlpatterns = [
    path("",views.adm_usuarios,name="adm_usuarios"),
    path("usuarios/<int:usuario_id>/visualizar/",views.visualizar_usuario,name="visualizar_usuario"),
    path("usuarios/<int:usuario_id>/editar/",views.editar_usuario,name="editar_usuario"),
]
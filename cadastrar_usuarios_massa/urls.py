from django.urls import path, include
from . import views

urlpatterns = [
    path('cadastrar_usuarios_massa/',views.ir_pagina_cadastro_massa_usuarios,name='cadastrar_usuarios_massa')
]
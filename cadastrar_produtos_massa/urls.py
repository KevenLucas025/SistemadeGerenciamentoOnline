from django.urls import path, include
from . import views

urlpatterns = [
    path('cadastrar_produtos_massa/',views.ir_pagina_produtos_massa, name='cadastrar_produtos_massa'),
    path('planilhas-exemplo/<str:tipo>/',views.baixar_planilha_exemplo, name='baixar_planilha_exemplo'),
]

from django.urls import path
from . import views

urlpatterns = [
    path("", views.listar_notificacoes, name="listar_notificacoes"),
    path("<int:notificacao_id>/ler/", views.marcar_como_lida, name="marcar_como_lida"),
    path("ler-todas/", views.marcar_todas_lidas, name="marcar_todas_lidas"),
    path("historico/", views.historico_notificacoes, name="historico_notificacoes"),
]
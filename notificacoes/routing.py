from django.urls import path
from .consumers import NotificacaoConsumer


websocket_urlpatterns = [path("ws/notificacoes/",NotificacaoConsumer.as_asgi()),]
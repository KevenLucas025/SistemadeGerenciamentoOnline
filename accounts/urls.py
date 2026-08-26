from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('register/', views.register, name='register'),
    path('atualizar-status/', views.atualizar_status_usuario, name='atualizar_status_usuario'),
]
from django.urls import path
from . import views


urlpatterns = [
    path("",views.adm_usuarios,name="adm_usuarios"),
]
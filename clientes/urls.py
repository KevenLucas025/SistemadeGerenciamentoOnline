from django.urls import path
from . import views

urlpatterns = [
    # Suas rotas existentes...
    path('relatorio/excel/', views.exportar_relatorio_excel, name='exportar_relatorio_excel'),
]
from django.contrib import admin
from .models import PreferenciasUsuario, ConfiguracoesSistema


@admin.register(PreferenciasUsuario)
class PreferenciasUsuarioAdmin(admin.ModelAdmin):
    list_display = (
        "usuario",
        "tema",
        "atualizado_em",
    )
    search_fields = ("usuario__username",)


@admin.register(ConfiguracoesSistema)
class ConfiguracoesSistemaAdmin(admin.ModelAdmin):
    list_display = (
        "quantidade_minima_estoque",
        "tempo_inatividade_sessao",
        "atualizado_em",
    )

    def has_add_permission(self, request):
        return not ConfiguracoesSistema.objects.exists()
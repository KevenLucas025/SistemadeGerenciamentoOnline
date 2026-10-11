from django.contrib import admin

from .models import AvaliacaoAssistenteIA


@admin.register(AvaliacaoAssistenteIA)
class AvaliacaoAssistenteIAAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "usuario",
        "avaliacao",
        "criada_em",
        "atualizada_em",
    )

    list_filter = (
        "avaliacao",
        "criada_em",
    )

    search_fields = (
        "usuario__username",
        "usuario__email",
        "pergunta",
        "resposta",
    )

    readonly_fields = (
        "usuario",
        "resposta_id",
        "pergunta",
        "resposta",
        "avaliacao",
        "criada_em",
        "atualizada_em",
    )

    date_hierarchy = "criada_em"

    list_per_page = 30

    def has_add_permission(self, request):
        return False
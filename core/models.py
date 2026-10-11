import uuid

from django.conf import settings
from django.db import models


class AvaliacaoAssistenteIA(models.Model):

    AVALIACAO_CHOICES = [
        ("positiva", "Positiva"),
        ("negativa", "Negativa"),
    ]

    id = models.BigAutoField(primary_key=True)

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="avaliacoes_assistente_ia",
    )

    resposta_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
    )

    pergunta = models.TextField(
        blank=True,
        default="",
    )

    resposta = models.TextField(
        blank=True,
        default="",
    )

    avaliacao = models.CharField(
        max_length=10,
        choices=AVALIACAO_CHOICES,
    )

    criada_em = models.DateTimeField(
        auto_now_add=True,
    )

    atualizada_em = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = "Avaliação do Assistente IA"
        verbose_name_plural = "Avaliações do Assistente IA"

        constraints = [
            models.UniqueConstraint(
                fields=["usuario", "resposta_id"],
                name="unique_avaliacao_usuario_resposta",
            ),
        ]

        ordering = ["-criada_em"]

    def __str__(self):
        return (
            f"{self.usuario} - "
            f"{self.get_avaliacao_display()} - "
            f"{self.criada_em:%d/%m/%Y %H:%M}"
        )
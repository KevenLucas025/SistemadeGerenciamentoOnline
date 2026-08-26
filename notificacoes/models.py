from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


class Notificacao(models.Model):

    destinatario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notificacoes"
    )

    mensagem = models.TextField()

    lida = models.BooleanField(default=False)

    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]

    def __str__(self):
        return f"{self.destinatario.username} - {self.mensagem}"

    @classmethod
    def ultimos_30_dias(cls):
        limite = timezone.now() - timedelta(days=30)

        return cls.objects.filter(
            criado_em__gte=limite
        )
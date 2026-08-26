from django.db import models
from django.contrib.auth.models import User
from django.dispatch import receiver
from django.db.models.signals import post_save


class PerfilUsuario(models.Model):
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('ausente', 'Ausente'),
        ('offline', 'Offline'),
    ]

    status_conexao = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='online'
    )

    usuario = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="perfil"
    )

    # senha_visivel REMOVIDO DAQUI

    cep = models.CharField(max_length=9, blank=True)
    endereco = models.CharField(max_length=255, blank=True)
    numero = models.CharField(max_length=20, blank=True)
    cidade = models.CharField(max_length=100, blank=True)
    bairro = models.CharField(max_length=100, blank=True)
    estado = models.CharField(max_length=2, blank=True)
    complemento = models.CharField(max_length=255, blank=True)

    telefone = models.CharField(max_length=20, blank=True)
    data_nascimento = models.DateField(null=True, blank=True)

    rg = models.CharField(max_length=20, blank=True)
    cpf = models.CharField(max_length=14, blank=True)
    cnpj = models.CharField(max_length=18, blank=True)

    segredo = models.CharField(max_length=255, blank=True)
    ultima_troca_senha = models.DateTimeField(null=True, blank=True)
    data_senha_cadastrada = models.DateTimeField(auto_now_add=True)

    acesso = models.CharField(
        max_length=30,
        default="Usuário"
    )

    imagem = models.ImageField(
        upload_to="usuarios/",
        blank=True,
        null=True
    )

    def __str__(self):
        return self.usuario.username


@receiver(post_save, sender=User)
def criar_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        PerfilUsuario.objects.create(usuario=instance)


@receiver(post_save, sender=User)
def salvar_perfil_usuario(sender, instance, **kwargs):
    if hasattr(instance, 'perfil'):
        instance.perfil.save()
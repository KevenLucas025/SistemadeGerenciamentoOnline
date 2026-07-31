from django.db import models
from django.contrib.auth.models import User


class Produto(models.Model):

    nome = models.CharField(max_length=150)

    codigo = models.CharField(
        max_length=50,
        unique=True
    )

    descricao = models.TextField(
        blank=True,
        null=True
    )

    cliente = models.CharField(
        max_length=150,
        blank=True
    )

    quantidade = models.PositiveIntegerField(
        default=0
    )

    valor_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    desconto = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0
    )
    
    total_sem_desconto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    
    )
    
    total_com_desconto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )


    valor_total = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    imagem = models.ImageField(
        upload_to="produtos/",
        blank=True,
        null=True
    )

    data_cadastro = models.DateField()

    criado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )
    
    status_saida = models.PositiveBigIntegerField(
        default=0
    )

    def __str__(self):
        return self.nome
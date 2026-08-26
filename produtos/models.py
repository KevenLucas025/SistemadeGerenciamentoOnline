from django.db import models
from django.contrib.auth.models import User
from clientes.models import Cliente
from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete



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

    # RELACIONAMENTO DIRETO COM O MODEL CLIENTE
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.PROTECT,  # Protege o cliente de ser excluído se tiver produtos vinculados (ou models.CASCADE)
        related_name="produtos",
        verbose_name="Cliente"
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

    # =========================================================
    # PROPERTYS DE FORMATAÇÃO MONETÁRIA (PADRÃO PT-BR)
    # =========================================================
    def _formatar_moeda(self, valor):
        if valor is None:
            valor = 0
        return f"R$ {valor:,.2f}".replace(",", "v").replace(".", ",").replace("v", ".")

    @property
    def valor_unitario_formatado(self):
        return self._formatar_moeda(self.valor_unitario)

    @property
    def total_sem_desconto_formatado(self):
        return self._formatar_moeda(self.total_sem_desconto)

    @property
    def total_com_desconto_formatado(self):
        return self._formatar_moeda(self.total_com_desconto)
    
    @property
    def desconto_formatado(self):
        if self.desconto is None:
            return "0%"
        valor_limpo = float(self.desconto)
        if valor_limpo.is_integer():
            return f"{int(valor_limpo)}%"
        return f"{str(valor_limpo).replace('.', ',')}%"
    
@receiver(post_save, sender=Produto)
def atualizar_gasto_cliente_ao_salvar(sender, instance, **kwargs):
    if instance.cliente:
        instance.cliente.atualizar_valor_gasto_automatico()

@receiver(post_delete, sender=Produto)
def atualizar_gasto_cliente_ao_excluir(sender, instance, **kwargs):
    if instance.cliente:
        instance.cliente.atualizar_valor_gasto_automatico()
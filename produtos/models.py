from django.db import models
from django.contrib.auth.models import User
from clientes.models import Cliente
from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete
from django.utils import timezone



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
    
    data_saida = models.DateTimeField(
        null=True,
        blank=True
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
    
class HistoricoProduto(models.Model):
    ACOES_CHOICES = [
        ('SAIDA', 'Saída de Produto'),
        ('ESTORNO', 'Estorno de Produto'),
        ('CRIACAO', 'Criação'),
        ('EDICAO', 'Edição'),
        ('EXCLUSAO', 'Exclusão'),
    ]

    produto = models.ForeignKey(
        Produto, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='historicos'
    )
    nome_produto = models.CharField(max_length=150)
    
    acao = models.CharField(max_length=20, choices=ACOES_CHOICES)
    
    descricao = models.TextField()
    
    usuario = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    data_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-data_hora']
        verbose_name = 'Histórico de Produto'
        verbose_name_plural = 'Históricos de Produtos'

    def __str__(self):
        return f"{self.nome_produto} - {self.get_acao_display()} ({self.data_hora.strftime('%d/%m/%Y %H:%M')})"
    
class SaidaProduto(models.Model):
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name='saidas_registradas')
    quantidade = models.PositiveIntegerField(default=1)
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    desconto = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_sem_desconto = models.DecimalField(max_digits=12, decimal_places=2)
    total_com_desconto = models.DecimalField(max_digits=12, decimal_places=2)
    # Permite receber a data_saida original e manter fixa:
    data_saida = models.DateTimeField(default=timezone.now)
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-data_saida']

    def __str__(self):
        return f"Saída {self.quantidade}x {self.produto.nome} ({self.produto.codigo})"
    
    
@receiver(post_save, sender=Produto)
def atualizar_gasto_cliente_ao_salvar(sender, instance, **kwargs):
    if instance.cliente:
        instance.cliente.atualizar_valor_gasto_automatico()

@receiver(post_delete, sender=Produto)
def atualizar_gasto_cliente_ao_excluir(sender, instance, **kwargs):
    if instance.cliente:
        instance.cliente.atualizar_valor_gasto_automatico()
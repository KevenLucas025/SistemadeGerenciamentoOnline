from django.db import models
from django.db.models import Sum
from decimal import Decimal
from django.utils import timezone


class Cliente(models.Model):

    # =====================================================
    # IDENTIFICAÇÃO
    # =====================================================
    
    TIPO_CLIENTE_CHOICES = [
        ('fisico', 'Pessoa Física'),
        ('juridico', 'Pessoa Jurídica'),
    ]
    
    tipo_cliente = models.CharField(
        max_length=10,
        choices=TIPO_CLIENTE_CHOICES,
        default="fisico"
    )

    nome = models.CharField(
        max_length=150
    )

    razao_social = models.CharField(
        max_length=200,
        blank=True,
        null=True
    )

    cnpj = models.CharField(
        max_length=18,
        blank=True,
        null=True
    )

    rg = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    cpf = models.CharField(
        max_length=14,
        blank=True,
        null=True
    )

    email = models.EmailField(
        blank=True,
        null=True
    )


    # =====================================================
    # CNH
    # =====================================================

    cnh = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    categoria_cnh = models.CharField(
        max_length=10,
        blank=True,
        null=True
    )

    emissao_cnh = models.DateField(
        blank=True,
        null=True
    )

    vencimento_cnh = models.DateField(
        blank=True,
        null=True
    )


    # =====================================================
    # CONTATO
    # =====================================================

    telefone = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )


    # =====================================================
    # ENDEREÇO
    # =====================================================

    cep = models.CharField(
        max_length=9,
        blank=True,
        null=True
    )

    endereco = models.CharField(
        max_length=200,
        blank=True,
        null=True
    )

    numero = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    complemento = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    cidade = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    bairro = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    estado = models.CharField(
        max_length=2,
        blank=True,
        null=True
    )


    # =====================================================
    # CONTROLE DO CLIENTE
    # =====================================================

    status = models.CharField(
        max_length=50,
        default="Ativo"
    )

    categoria = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    data_inclusao = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Data da Inclusão"
    )

    ultima_atualizacao = models.DateTimeField(
        auto_now=True,
        verbose_name="Última Atualização"
    )

    valor_gasto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Valor Gasto Total"
    )
    
    modo_valor_gasto = models.CharField(
        max_length=50,
        default="Automático (somar produtos)",
        verbose_name="Modo Valor Gasto"
    )

    ultima_compra = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Última Compra"
    )


    # =====================================================
    # REPRESENTAÇÃO
    # =====================================================
    def __str__(self):

        return self.nome
    
    def atualizar_valor_gasto_automatico(self):
        if self.modo_valor_gasto == "Automático (somar produtos)":
            resultado = self.produtos.aggregate(
                total_acumulado=Sum('total_com_desconto')
            )
            
            # Acessa a chave correta definida no aggregate
            self.valor_gasto = resultado.get('total_acumulado') or Decimal("0.00")
            
            # Pega a data do produto mais recente cadastrado
            ultimo_produto = self.produtos.order_by("-id").first()
            if ultimo_produto:
                # Registra a data e hora exatas do momento da compra/cadastro
                self.ultima_compra = timezone.now()
            else:
                self.ultima_compra = None

            # Salva os campos atualizados no banco
            self.save(update_fields=['valor_gasto', 'ultima_compra', 'ultima_atualizacao'])
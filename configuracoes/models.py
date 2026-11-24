from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class PreferenciasUsuario(models.Model):

    TEMA_CHOICES = [
        ("escuro", "Escuro"),
        ("claro", "Claro"),
        ("automatico", "Automático"),
    ]


    PAGINA_CHOICES = [
        ("dashboard", "Dashboard"),
        ("estoque", "Estoque"),
        ("produtos", "Produtos"),
        ("clientes", "Clientes"),
        ("relatorios", "Relatórios"),
    ]

    usuario = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="preferencias"
    )

    # ==========================================
    # APARÊNCIA
    # ==========================================

    tema = models.CharField(
        "Tema",
        max_length=15,
        choices=TEMA_CHOICES,
        default="escuro"
    )

    # ==========================================
    # NAVEGAÇÃO
    # ==========================================

    pagina_inicial = models.CharField(
        "Página inicial",
        max_length=20,
        choices=PAGINA_CHOICES,
        default="dashboard"
    )

    # ==========================================
    # CONFIRMAÇÕES
    # ==========================================

    confirmar_exclusao = models.BooleanField(
        "Confirmar exclusões",
        default=True
    )

    confirmar_saida_produto = models.BooleanField(
        "Confirmar saída de produtos",
        default=True
    )
    
    confirmar_saida_usuario = models.BooleanField(
            "Confirmar saída de Usuários",
            default=True
        )

    # ==========================================
    # NOTIFICAÇÕES
    # ==========================================

    notificar_novos_cadastros = models.BooleanField(
        "Notificar novos cadastros",
        default=True
    )

    notificar_saidas = models.BooleanField(
        "Notificar saídas de produtos",
        default=True
    )

    notificar_estoque_baixo = models.BooleanField(
        "Notificar estoque baixo",
        default=True
    )

    notificar_alteracoes = models.BooleanField(
        "Notificar alterações",
        default=True
    )

    notificacoes_sonoras = models.BooleanField(
        "Ativar notificações sonoras",
        default=False
    )

    # ==========================================
    # ATALHOS PERSONALIZADOS
    # ==========================================

    atalhos_personalizados = models.JSONField(
        "Atalhos personalizados",
        default=dict,
        blank=True
    )

    # ==========================================
    # CONTROLE
    # ==========================================

    atualizado_em = models.DateTimeField(
        "Atualizado em",
        auto_now=True
    )

    class Meta:
        verbose_name = "Preferência do usuário"
        verbose_name_plural = "Preferências dos usuários"

    def __str__(self):
        return f"Preferências de {self.usuario.username}"


class ConfiguracoesSistema(models.Model):

    # ==========================================
    # ESTOQUE
    # ==========================================

    quantidade_minima_estoque = models.PositiveIntegerField(
        "Quantidade mínima de estoque",
        default=5,
        validators=[MinValueValidator(0)]
    )

    alertar_estoque_baixo = models.BooleanField(
        "Alertar quando o estoque estiver baixo",
        default=True
    )

    exigir_cliente_saida = models.BooleanField(
        "Exigir cliente na saída de produtos",
        default=True
    )

    confirmar_saida_produto = models.BooleanField(
        "Confirmar saída de produtos",
        default=True
    )
    
    confirmar_saida_usuario = models.BooleanField(
        "Confirmar saída de Usuários",
        default=True
    )

    # ==========================================
    # SEGURANÇA
    # ==========================================

    tempo_inatividade_sessao = models.PositiveIntegerField(
        "Tempo de inatividade da sessão",
        default=30,
        validators=[
            MinValueValidator(5),
            MaxValueValidator(1440)
        ],
        help_text="Tempo em minutos até a expiração da sessão. Mínimo: 5 minutos. Máximo: 1440 minutos."
    )

    registrar_historico_alteracoes = models.BooleanField(
        "Registrar histórico de alterações",
        default=True
    )

    # ==========================================
    # CONTROLE
    # ==========================================

    atualizado_em = models.DateTimeField(
        "Atualizado em",
        auto_now=True
    )

    class Meta:
        verbose_name = "Configuração do sistema"
        verbose_name_plural = "Configurações do sistema"

    def __str__(self):
        return "Configurações gerais do sistema"

    def save(self, *args, **kwargs):
        # Garante que exista apenas uma configuração global.
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def obter_configuracoes(cls):
        configuracoes, _ = cls.objects.get_or_create(pk=1)
        return configuracoes

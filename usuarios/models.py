from django.db import models
from django.contrib.auth.models import User

class HistoricoUsuario(models.Model):
    ACAO_CHOICES = [
        ('saida', 'Gerar Saída'),
        ('cadastro', 'Novo Usuário'),
        ('edicao', 'Edição de Dados'),
        ('perfil', 'Alteração de Perfil'),
    ]

    acao = models.CharField(max_length=50, choices=ACAO_CHOICES, default='saida')
    descricao = models.TextField()
    usuario_afetado = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='historicos_afetados'
    )
    nome_usuario_afetado = models.CharField(max_length=150, blank=True) # Backup se o user for deletado
    usuario_responsavel = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='historicos_gerados'
    )
    data_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-data_hora']

    def __str__(self):
        return f"{self.get_acao_display()} - {self.nome_usuario_afetado} ({self.data_hora.strftime('%d/%m/%Y %H:%M')})"
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import PerfilUsuario, HistoricoConexao


class Command(BaseCommand):
    help = "Verifica usuários com conexão expirada e registra Offline."

    def handle(self, *args, **options):
        agora = timezone.now()
        limite = agora - timedelta(seconds=90)

        perfis = PerfilUsuario.objects.filter(
            ultimo_ping__lt=limite
        ).values_list("usuario_id", flat=True)

        processados = 0

        for usuario_id in perfis:

            with transaction.atomic():

                perfil = (
                    PerfilUsuario.objects
                    .select_for_update()
                    .get(usuario_id=usuario_id)
                )

                # Confirma novamente se o ping expirou.
                if not perfil.ultimo_ping:
                    continue

                if perfil.ultimo_ping >= limite:
                    continue

                inicio_offline = (
                    perfil.ultimo_ping + timedelta(seconds=90)
                )

                historico = (
                    HistoricoConexao.objects
                    .select_for_update()
                    .filter(
                        usuario_id=usuario_id,
                        fim__isnull=True
                    )
                    .order_by("-inicio")
                    .first()
                )

                # Se já está Offline, não cria outro registro.
                if historico and historico.status == "offline":
                    continue

                # Encerra o período anterior.
                if historico:
                    historico.fim = inicio_offline
                    historico.save(update_fields=["fim"])

                # Inicia o período Offline.
                HistoricoConexao.objects.create(
                    usuario_id=usuario_id,
                    status="offline",
                    inicio=inicio_offline
                )

                processados += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Verificação concluída. "
                f"{processados} usuário(s) atualizado(s) para Offline."
            )
        )
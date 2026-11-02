
import hashlib
import secrets

from datetime import timedelta

from django.utils import timezone

from accounts.models import TokenPlanilha


TEMPO_VALIDADE_HORAS = 24


def gerar_token_planilha(usuario, tipo):
    if tipo not in ("produto", "usuario"):
        raise ValueError("Tipo de planilha inválido.")

    token = secrets.token_urlsafe(48)

    token_hash = hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()

    TokenPlanilha.objects.create(
        usuario=usuario,
        token_hash=token_hash,
        tipo=tipo,
        expira_em=timezone.now() + timedelta(
            hours=TEMPO_VALIDADE_HORAS
        )
    )

    return token


def localizar_token_planilha(token, tipo, usuario):
    if not token:
        return None

    token_hash = hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()

    return TokenPlanilha.objects.filter(
        token_hash=token_hash,
        usuario=usuario,
        tipo=tipo,
        utilizado=False,
        expira_em__gt=timezone.now()
    ).first()

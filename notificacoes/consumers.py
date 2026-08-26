from channels.generic.websocket import AsyncWebsocketConsumer
import json


class NotificacaoConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        self.room_group_name = "notificacoes_sistema"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        print(
            f"[WS] CONECTADO | "
            f"Usuário: {self.scope['user']} | "
            f"ID: {self.scope['user'].id} | "
            f"Autenticado: {self.scope['user'].is_authenticated}"
        )


    async def disconnect(self, close_code):

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        print("[WS] DESCONECTADO")


    async def notificacao(self, event):

        usuario_que_realizou_acao = event["usuario_id"]

        usuario_conectado = self.scope["user"]


        print(
            f"[WS] EVENTO RECEBIDO | "
            f"Usuário conectado: {usuario_conectado.username} | "
            f"ID conectado: {usuario_conectado.id} | "
            f"ID quem realizou ação: {usuario_que_realizou_acao}"
        )


        # Não envia para quem realizou a ação
        if usuario_conectado.id == usuario_que_realizou_acao:

            print(
                f"[WS] IGNORADO | "
                f"Usuário {usuario_conectado.username} realizou a ação."
            )

            return


        print(
            f"[WS] ENVIANDO NOTIFICAÇÃO PARA: "
            f"{usuario_conectado.username}"
        )


        await self.send(
            text_data=json.dumps({
                "tipo": "notificacao",
                "mensagem": event["mensagem"],
            })
        )
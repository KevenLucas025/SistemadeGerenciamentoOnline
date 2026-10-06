document.addEventListener("DOMContentLoaded", () => {

    const protocolo = window.location.protocol === "https:"
        ? "wss:"
        : "ws:";

    const socket = new WebSocket(
        `${protocolo}//${window.location.host}/ws/notificacoes/`
    );

    socket.onopen = () => {
        console.log("WebSocket de notificações conectado.");
    };

    socket.onmessage = (evento) => {

        const dados = JSON.parse(evento.data);

        console.log("Nova notificação:", dados);

        mostrarNotificacao(dados.mensagem);
    };

    socket.onclose = () => {
        console.log("WebSocket de notificações desconectado.");
    };

    socket.onerror = (erro) => {
        console.error(
            "Erro no WebSocket:",
            erro
        );
    };


    function mostrarNotificacao(mensagem) {

        const notificacao = document.createElement("div");

        notificacao.className = "notificacao-tempo-real";

        notificacao.innerHTML = `
            <strong>🔔 Nova atividade</strong>
            <span>${mensagem}</span>
        `;

        document.body.appendChild(notificacao);

        setTimeout(() => {
            notificacao.classList.add("saindo");

            setTimeout(() => {
                notificacao.remove();
            }, 300);

        }, 5000);
    }

});

/* =====================================================
   ASSISTENTE IA
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const btnAbrirChatIA =
        document.getElementById("btnAbrirChatIA");

    const btnFecharChatIA =
        document.getElementById("btnFecharChatIA");

    const chatIA =
        document.getElementById("chatIA");

    const inputChatIA =
        document.getElementById("inputChatIA");

    const btnEnviarChatIA =
        document.getElementById("btnEnviarChatIA");

    const chatIAMensagens =
        document.getElementById("chatIAMensagens");


    /* =================================================
       ABRIR CHAT
    ================================================= */

    btnAbrirChatIA.addEventListener("click", function () {

        chatIA.classList.add("aberto");

        inputChatIA.focus();

    });


    /* =================================================
       FECHAR CHAT
    ================================================= */

    btnFecharChatIA.addEventListener("click", function () {

        chatIA.classList.remove("aberto");

    });


    /* =================================================
    ADICIONAR MENSAGEM
    ================================================= */

    function adicionarMensagem(texto, tipo) {

        const mensagem =
            document.createElement("div");

        mensagem.classList.add(
            tipo === "usuario"
                ? "mensagem-usuario"
                : "mensagem-ia"
        );


        /* =================================================
        MENSAGEM DA IA
        ================================================= */

        if (tipo === "ia") {

            /* Se o Marked estiver disponível,
            renderiza Markdown */

            if (
                typeof marked !== "undefined" &&
                typeof marked.parse === "function"
            ) {

                mensagem.innerHTML =
                    marked.parse(texto);

            } else {

                /* Fallback caso o Marked não carregue */

                mensagem.textContent =
                    texto;

            }

        } else {

            /* Mensagem do usuário */

            mensagem.textContent =
                texto;

        }


        chatIAMensagens.appendChild(mensagem);


        chatIAMensagens.scrollTop =
            chatIAMensagens.scrollHeight;

    }


    /* =================================================
       INDICADOR DE CARREGAMENTO
    ================================================= */

    function adicionarCarregando() {

        const mensagem =
            document.createElement("div");

        mensagem.classList.add(
            "mensagem-ia",
            "mensagem-carregando"
        );

        mensagem.id =
            "mensagemIACarregando";

        mensagem.textContent =
            "Estou analisando sua pergunta...";

        chatIAMensagens.appendChild(mensagem);

        chatIAMensagens.scrollTop =
            chatIAMensagens.scrollHeight;

    }


    function removerCarregando() {

        const mensagem =
            document.getElementById(
                "mensagemIACarregando"
            );

        if (mensagem) {

            mensagem.remove();

        }

    }


    /* =================================================
       OBTER CSRF
    ================================================= */

    function obterCSRFToken() {

        const cookies =
            document.cookie.split(";");

        for (let cookie of cookies) {

            cookie = cookie.trim();

            if (cookie.startsWith("csrftoken=")) {

                return decodeURIComponent(
                    cookie.substring(
                        "csrftoken=".length
                    )
                );

            }

        }

        return "";

    }


    /* =================================================
       ENVIAR MENSAGEM
    ================================================= */

    async function enviarMensagem() {

        const pergunta =
            inputChatIA.value.trim();

        if (!pergunta) {

            return;

        }


        /* =================================================
           MOSTRA A PERGUNTA DO USUÁRIO
        ================================================= */

        adicionarMensagem(
            pergunta,
            "usuario"
        );


        /* Limpa o campo */

        inputChatIA.value = "";


        /* =================================================
           DESABILITA CONTROLES
        ================================================= */

        btnEnviarChatIA.disabled = true;

        inputChatIA.disabled = true;


        /* =================================================
           MOSTRA CARREGAMENTO
        ================================================= */

        adicionarCarregando();


        try {

            /* =================================================
               CHAMADA PARA O DJANGO
            ================================================= */

            const resposta =
                await fetch(
                    "/api/chat-ia/",
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "X-CSRFToken":
                                obterCSRFToken()

                        },

                        body: JSON.stringify({

                            mensagem: pergunta

                        })

                    }
                );


            /* =================================================
               CONVERTE RESPOSTA
            ================================================= */

            const dados =
                await resposta.json();


            /* Remove carregamento */

            removerCarregando();


            /* =================================================
               VERIFICA ERRO
            ================================================= */

            if (
                !resposta.ok ||
                !dados.sucesso
            ) {

                adicionarMensagem(

                    dados.mensagem ||
                    "Não foi possível obter uma resposta da IA.",

                    "ia"

                );

                return;

            }


            /* =================================================
               MOSTRA RESPOSTA DA IA
            ================================================= */

            adicionarMensagem(

                dados.resposta,

                "ia"

            );


        } catch (erro) {

            console.error(
                "Erro ao conversar com a IA:",
                erro
            );


            removerCarregando();


            adicionarMensagem(

                "Não foi possível conectar ao Assistente IA.",

                "ia"

            );


        } finally {

            /* =================================================
               REATIVA CONTROLES
            ================================================= */

            btnEnviarChatIA.disabled = false;

            inputChatIA.disabled = false;

            inputChatIA.focus();

        }

    }


    /* =================================================
       BOTÃO ENVIAR
    ================================================= */

    btnEnviarChatIA.addEventListener(
        "click",
        enviarMensagem
    );


    /* =================================================
       ENTER
    ================================================= */

    inputChatIA.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                enviarMensagem();

            }

        }
    );

});


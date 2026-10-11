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

        btnAbrirChatIA.classList.remove("animando");

        /* Reinicia a animação do botão */
        void btnAbrirChatIA.offsetWidth;

        btnAbrirChatIA.classList.add("animando");

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

    function adicionarMensagem(
        texto,
        tipo,
        perguntaRelacionada = ""
    ) {

        const mensagem = document.createElement("div");

        mensagem.classList.add(
            tipo === "usuario"
                ? "mensagem-usuario"
                : "mensagem-ia"
        );


        /* =================================================
           CONTEÚDO DA MENSAGEM
        ================================================= */

        if (tipo === "ia") {

            if (
                typeof marked !== "undefined" &&
                typeof marked.parse === "function"
            ) {

                mensagem.innerHTML = marked.parse(texto);

            } else {

                mensagem.textContent = texto;

            }

        } else {

            mensagem.textContent = texto;

        }


        /* Adiciona a mensagem ao chat */
        chatIAMensagens.appendChild(mensagem);


        /* =================================================
           AVALIAÇÃO DA RESPOSTA DA IA
        ================================================= */

        if (tipo === "ia") {

            const areaAvaliacao =
                document.createElement("div");

            areaAvaliacao.classList.add(
                "avaliacao-chat-ia"
            );


            const textoAvaliacao =
                document.createElement("span");

            textoAvaliacao.classList.add(
                "avaliacao-chat-ia-texto"
            );

            textoAvaliacao.textContent =
                "Esta resposta foi útil?";


            /* Botão positivo */
            const btnPositivo =
                document.createElement("button");

            btnPositivo.type = "button";

            btnPositivo.classList.add(
                "btn-avaliar-ia"
            );

            btnPositivo.dataset.avaliacao =
                "positiva";

            btnPositivo.setAttribute(
                "aria-label",
                "Avaliar resposta positivamente"
            );

            btnPositivo.title =
                "Resposta útil";

            btnPositivo.textContent = "👍";


            /* Botão negativo */
            const btnNegativo =
                document.createElement("button");

            btnNegativo.type = "button";

            btnNegativo.classList.add(
                "btn-avaliar-ia"
            );

            btnNegativo.dataset.avaliacao =
                "negativa";

            btnNegativo.setAttribute(
                "aria-label",
                "Avaliar resposta negativamente"
            );

            btnNegativo.title =
                "Resposta não útil";

            btnNegativo.textContent = "👎";


            /* Mensagem de status */
            const statusAvaliacao =
                document.createElement("span");

            statusAvaliacao.classList.add(
                "avaliacao-chat-ia-status"
            );

            statusAvaliacao.setAttribute(
                "aria-live",
                "polite"
            );


            /* Monta os elementos */
            areaAvaliacao.appendChild(textoAvaliacao);
            areaAvaliacao.appendChild(btnPositivo);
            areaAvaliacao.appendChild(btnNegativo);
            areaAvaliacao.appendChild(statusAvaliacao);

            mensagem.appendChild(areaAvaliacao);


            /* =================================================
               ENVIAR AVALIAÇÃO AO DJANGO
            ================================================= */

            async function enviarAvaliacao(avaliacao) {

                if (
                    areaAvaliacao.dataset.enviando === "true"
                ) {
                    return;
                }

                areaAvaliacao.dataset.enviando = "true";

                const botoes = [
                    btnPositivo,
                    btnNegativo
                ];

                botoes.forEach(function (botao) {
                    botao.disabled = true;
                });

                statusAvaliacao.textContent =
                    "Salvando avaliação...";


                try {

                    /*
                     * Cada resposta recebe um identificador.
                     * O fallback atende ambientes sem randomUUID.
                     */
                    let respostaId;

                    if (
                        typeof crypto !== "undefined" &&
                        typeof crypto.randomUUID === "function"
                    ) {

                        respostaId = crypto.randomUUID();

                    } else {

                        respostaId =
                            "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
                                .replace(/[xy]/g, function (caractere) {

                                    const aleatorio =
                                        Math.random() * 16 | 0;

                                    const valor =
                                        caractere === "x"
                                            ? aleatorio
                                            : (aleatorio & 0x3 | 0x8);

                                    return valor.toString(16);

                                });

                    }


                    /*
                     * Guarda o ID na área da avaliação para
                     * reutilizá-lo caso o usuário tente novamente.
                     */
                    if (!areaAvaliacao.dataset.respostaId) {

                        areaAvaliacao.dataset.respostaId =
                            respostaId;

                    } else {

                        respostaId =
                            areaAvaliacao.dataset.respostaId;

                    }


                    const resposta = await fetch(
                        "/api/chat-ia/avaliar/",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRFToken": obterCSRFToken()
                            },

                            body: JSON.stringify({
                                resposta_id: respostaId,
                                avaliacao: avaliacao,
                                pergunta: perguntaRelacionada,
                                resposta: texto
                            })
                        }
                    );


                    const dados = await resposta.json();


                    if (
                        !resposta.ok ||
                        !dados.sucesso
                    ) {

                        throw new Error(
                            dados.mensagem ||
                            "Não foi possível registrar a avaliação."
                        );

                    }


                    /* Destaca a opção selecionada */
                    botoes.forEach(function (botao) {

                        const selecionado =
                            botao.dataset.avaliacao ===
                            dados.avaliacao;

                        botao.classList.toggle(
                            "selecionado",
                            selecionado
                        );

                        botao.setAttribute(
                            "aria-pressed",
                            selecionado ? "true" : "false"
                        );

                        botao.disabled = false;

                    });


                    areaAvaliacao.dataset.avaliacaoSelecionada =
                        dados.avaliacao;

                    statusAvaliacao.textContent =
                        "Obrigado pela avaliação!";

                } catch (erro) {

                    console.error(
                        "Erro ao registrar avaliação:",
                        erro
                    );

                    statusAvaliacao.textContent =
                        erro.message ||
                        "Não foi possível salvar. Tente novamente.";

                    botoes.forEach(function (botao) {
                        botao.disabled = false;
                    });

                } finally {

                    areaAvaliacao.dataset.enviando = "false";

                }

            }


            /* Eventos dos botões */
            btnPositivo.addEventListener("click", function () {

                enviarAvaliacao("positiva");

            });

            btnNegativo.addEventListener("click", function () {

                enviarAvaliacao("negativa");

            });

        }


        /* Mantém o chat na última mensagem */
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
       OBTER TOKEN CSRF
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


        /* Mostra a pergunta do usuário */
        adicionarMensagem(
            pergunta,
            "usuario"
        );


        /* Limpa o campo */
        inputChatIA.value = "";


        /* Desabilita controles */
        btnEnviarChatIA.disabled = true;

        inputChatIA.disabled = true;


        /* Mostra carregamento */
        adicionarCarregando();


        try {

            /* Chamada existente para o Django */
            const resposta = await fetch(
                "/api/chat-ia/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": obterCSRFToken()
                    },

                    body: JSON.stringify({
                        mensagem: pergunta
                    })
                }
            );


            /* Converte a resposta */
            const dados = await resposta.json();


            /* Remove carregamento */
            removerCarregando();


            /* Verifica erro */
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


            /* Mostra a resposta com os botões de avaliação */
            adicionarMensagem(
                dados.resposta,
                "ia",
                pergunta
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

            /* Reativa os controles */
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


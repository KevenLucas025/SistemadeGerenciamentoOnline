document.addEventListener("DOMContentLoaded", function () {

    // =========================
    // MENSAGENS DO DJANGO
    // =========================

    const mensagens = document.querySelectorAll(
        ".django-message"
    );

    mensagens.forEach(mensagem => {
        mostrarAlerta(
            mensagem.dataset.message,
            mensagem.dataset.tipo
        );
    });


    // =========================
    // MOSTRAR / OCULTAR SENHA
    // =========================
    document.querySelectorAll(".toggle-password").forEach(icon => {
        icon.addEventListener("click", function () {
            const input = this.parentElement.querySelector("input");
            if (!input) return;
            if (input.type === "password") {
                input.type = "text";
                this.classList.replace(
                    "fa-eye",
                    "fa-eye-slash"
                );

            } else {

                input.type = "password";

                this.classList.replace(
                    "fa-eye-slash",
                    "fa-eye"
                );

            }

        });

    });

    // =========================
    // ABAS DE CLIENTES
    // =========================
    const botoes = document.querySelectorAll(".btn-tab-cliente");
    const paginas = document.querySelectorAll(".clientes-pagina");

    botoes.forEach((botao, indice) => {
        botao.addEventListener("click", () => {
            botoes.forEach(btn => btn.classList.remove("ativo"));
            paginas.forEach(pagina => pagina.classList.remove("ativa"));
            botao.classList.add("ativo");
            paginas[indice].classList.add("ativa");

        });
    });

});


// =========================
// FUNÇÃO GLOBAL DOS ALERTAS
// =========================

function mostrarAlerta(msg, tipo = "error") {
    const modalEl = document.getElementById("modalAlertaGlobal");

    if (!modalEl) {
        // Fallback para caso o modal ainda não esteja no HTML
        alert(msg);
        return;
    }

    const modalContent = modalEl.querySelector(".modal-alerta-content");
    const tituloTexto = document.getElementById("modalAlertaTituloTexto");
    const icone = document.getElementById("modalAlertaIcone");
    const corpoMsg = document.getElementById("modalAlertaMensagem");

    if (!modalContent || !tituloTexto || !icone || !corpoMsg) {
        console.error("Elementos internos do modal de alerta não encontrados.");
        alert(msg);
        return;
    }

    // Reseta classes de estado
    modalContent.classList.remove("sucesso", "erro", "alerta");

    // Configura ícone, título e estilo
    const tipoNormalizado = (tipo || "").toLowerCase();

    if (tipoNormalizado === "success" || tipoNormalizado === "sucesso") {
        modalContent.classList.add("sucesso");
        tituloTexto.textContent = "Sucesso";
        icone.className = "fa-solid fa-circle-check";
    } else if (tipoNormalizado === "alerta" || tipoNormalizado === "warning") {
        modalContent.classList.add("alerta");
        tituloTexto.textContent = "Atenção";
        icone.className = "fa-solid fa-triangle-exclamation";
    } else {
        modalContent.classList.add("erro");
        tituloTexto.textContent = "Erro";
        icone.className = "fa-solid fa-circle-xmark";
    }

    corpoMsg.textContent = msg;

    // Cria um backdrop exclusivo para o alerta global
    if (!document.querySelector(".backdrop-alerta-global")) {
        const backdrop = document.createElement("div");
        backdrop.className = "backdrop-alerta-global";
        document.body.appendChild(backdrop);
    }

    // Impede que o Bootstrap crie outro backdrop
    const modalInstancia = bootstrap.Modal.getOrCreateInstance(
        modalEl,
        { backdrop: false }
    );

    modalInstancia.show();

    // Foca automaticamente no botão OK
    setTimeout(() => {
        document.getElementById("btnAlertaOk")?.focus();
    }, 150);
}

// Remove o backdrop quando o alerta for fechado
const modalAlertaGlobal = document.getElementById("modalAlertaGlobal");

if (modalAlertaGlobal) {
    modalAlertaGlobal.addEventListener(
        "hidden.bs.modal",
        function () {
            document
                .querySelector(".backdrop-alerta-global")
                ?.remove();
        }
    );
}


// =========================
// FUNÇÃO CONFIRMAR AÇÃO (PROMISE SIM/NÃO)
// =========================
function confirmarAcao(mensagem, titulo = "Confirmação") {
    return new Promise((resolve) => {
        const modalEl = document.getElementById("modalConfirmacaoGlobal");

        if (!modalEl) {
            // Fallback nativo do navegador caso o modal não esteja no HTML
            const resposta = confirm(mensagem);
            resolve(resposta);
            return;
        }

        const tituloEl = document.getElementById("modalConfirmacaoTitulo");
        const mensagemEl = document.getElementById("modalConfirmacaoMensagem");
        const btnSim = document.getElementById("btnConfirmarSim");
        const btnNao = document.getElementById("btnConfirmarNao");

        if (tituloEl) tituloEl.textContent = titulo;
        if (mensagemEl) mensagemEl.textContent = mensagem;

        const modalInstancia = bootstrap.Modal.getOrCreateInstance(modalEl);

        const handleSim = () => {
            limparEventos();
            modalInstancia.hide();
            resolve(true);
        };

        const handleNao = () => {
            limparEventos();
            modalInstancia.hide();
            resolve(false);
        };

        const handleDismiss = () => {
            limparEventos();
            resolve(false);
        };

        const limparEventos = () => {
            btnSim?.removeEventListener("click", handleSim);
            btnNao?.removeEventListener("click", handleNao);
            modalEl.removeEventListener("hidden.bs.modal", handleDismiss);
        };

        btnSim?.addEventListener("click", handleSim);
        btnNao?.addEventListener("click", handleNao);
        modalEl.addEventListener("hidden.bs.modal", handleDismiss);

        modalInstancia.show();
    });
}


    // =========================
    // MODAL DE LOGOUT
    // =========================
    function abrirModalLogout(event) {

        event?.preventDefault();

        const menuLateral = document.getElementById("menuLateral");
        const modalElement = document.getElementById("modalLogout");

        // Verifica se o modal existe
        if (!modalElement) {
            console.error("Modal de logout não encontrado no HTML.");
            return;
        }

        // Função responsável por abrir o modal
        function exibirModal() {
            const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
            modal.show();
        }

        // Se o menu lateral não existir, abre somente o modal
        if (!menuLateral) {
            exibirModal();
            return;
        }

        const offcanvas = bootstrap.Offcanvas.getInstance(menuLateral);

        // Se o menu não estiver aberto, abre diretamente o modal
        if (!offcanvas || !menuLateral.classList.contains("show")) {
            exibirModal();
            return;
        }

        // Aguarda o fechamento completo do menu lateral
        menuLateral.addEventListener("hidden.bs.offcanvas", function () {
            exibirModal();
        }, { once: true });

        offcanvas.hide();
    }


    // =========================
    // TESTE VISUAL — MODAL DE CONFIRMAÇÃO GLOBAL
    // =========================

    window.testarModalConfirmacaoGlobal = function () {

        if (typeof confirmarAcao !== "function") {
            console.error("A função confirmarAcao não está disponível.");
            return;
        }

        confirmarAcao(
            "Esta é uma mensagem de teste do modal de confirmação global. Deseja realmente continuar?",
            "Confirmar operação"
        ).then((confirmado) => {

            console.log(
                confirmado
                    ? "Teste: botão SIM selecionado."
                    : "Teste: botão NÃO ou fechamento selecionado."
            );

        });

    };

    console.log("Teste do modal global registrado.");



document.addEventListener("DOMContentLoaded", function () {

    // =========================
    // CONTROLE DE PRESENÇA
    // =========================

    const elementoPresenca = document.getElementById("configuracao-presenca");
    const URL_PRESENCA = elementoPresenca?.dataset.url;

    let ultimaInteracao = Date.now();

    const TEMPO_AUSENCIA = 5 * 60 * 1000;
    const INTERVALO_PING = 30 * 1000;

    if (!URL_PRESENCA) {
        console.error("URL de atualização de presença não encontrada.");
        return;
    }

    function obterCookie(nome) {
        const cookies = document.cookie.split(";");

        for (let cookie of cookies) {
            cookie = cookie.trim();

            if (cookie.startsWith(nome + "=")) {
                return decodeURIComponent(
                    cookie.substring(nome.length + 1)
                );
            }
        }

        return null;
    }

    function registrarInteracao() {
        ultimaInteracao = Date.now();
    }

    [
        "mousemove",
        "mousedown",
        "keydown",
        "scroll",
        "touchstart",
        "click"
    ].forEach(evento => {
        document.addEventListener(evento, registrarInteracao, {
            passive: true
        });
    });

    
    async function enviarPresenca() {

        try {
            const resposta = await fetch(URL_PRESENCA, {
                method: "POST",
                headers: {
                    "X-CSRFToken": obterCookie("csrftoken")
                }
            });

            if (!resposta.ok) {
                console.error(
                    "Erro ao atualizar presença:",
                    resposta.status,
                    await resposta.text()
                );
                return;
            }

            const resultado = await resposta.json();

            console.log("Presença atualizada:", resultado.status);

        } catch (erro) {
            console.error("Erro ao atualizar presença:", erro);
        }
    }


    // Envia imediatamente ao carregar
    enviarPresenca();

    // Atualiza a cada 30 segundos
    setInterval(enviarPresenca, INTERVALO_PING);

    // Ao retornar para a aba, atualiza imediatamente
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) {
            enviarPresenca();
        }
    });

});

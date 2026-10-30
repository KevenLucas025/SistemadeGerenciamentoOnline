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

    event.preventDefault();

    // Fecha o menu lateral do Bootstrap
    const menuLateral =
        document.getElementById("menuLateral");

    const offcanvas =
        bootstrap.Offcanvas.getInstance(menuLateral);

    if (offcanvas) {
        offcanvas.hide();
    }

    // Abre o modal depois que o menu começar a fechar
    const modalElement =
        document.getElementById("modalLogout");

    const modal =
        new bootstrap.Modal(modalElement);

    modal.show();

}
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

});

// =========================
// FUNÇÃO DOS ALERTAS
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

    // Reseta classes de estado
    modalContent.classList.remove("sucesso", "erro", "alerta");

    // Configura ícone, título e estilo estilo QMessageBox
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

    const modalInstancia = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstancia.show();

    // Foca automaticamente no botão OK para fechar ao apertar Enter/Espaço
    setTimeout(() => {
        document.getElementById("btnAlertaOk")?.focus();
    }, 150);
}

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

document.addEventListener("DOMContentLoaded", () => {

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


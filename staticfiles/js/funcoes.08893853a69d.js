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

// =========================
// FUNÇÃO DOS ALERTAS
// =========================

function mostrarAlerta(msg, tipo = "error") {

    const toast = document.getElementById("toastAlerta");

    if (!toast) {
        console.error("Elemento #toastAlerta não encontrado.");
        return;
    }

    // Força o z-index a ficar acima do modal (que é 99999)
    toast.style.zIndex = "100000";

    toast.innerText = msg;

    toast.classList.remove(
        "show",
        "hide",
        "sucesso",
        "erro"
    );

    if (tipo === "success" || tipo === "sucesso") {
        toast.classList.add("sucesso");
    } else {
        toast.classList.add("erro");
    }

    // Aparece
    setTimeout(() => {
        toast.classList.add("show");
    }, 50);

    // Desaparece depois de 3,5 segundos
    setTimeout(() => {

        toast.classList.remove("show");
        toast.classList.add("hide");

        setTimeout(() => {

            toast.classList.remove(
                "show",
                "hide",
                "sucesso",
                "erro"
            );

            toast.innerText = "";

        }, 450);

    }, 3500);

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


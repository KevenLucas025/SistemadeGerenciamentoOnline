document.addEventListener("DOMContentLoaded", function () {

    const mensagens = document.querySelectorAll(
        ".django-message"
    );

    mensagens.forEach(mensagem => {

        mostrarAlerta(
            mensagem.dataset.message,
            mensagem.dataset.tipo
        );

    });

});








function mostrarAlerta(msg, tipo = "error") {

    const toast = document.getElementById("toastAlerta");

    if (!toast) {
        console.error("Elemento #toastAlerta não encontrado.");
        return;
    }

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
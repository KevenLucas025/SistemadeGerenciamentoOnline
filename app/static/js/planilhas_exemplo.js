document.addEventListener("DOMContentLoaded", function () {

    const btnPlanilhas = document.getElementById("btnPlanilhasExemplo");
    const modalElemento = document.getElementById("modalPlanilhasExemplo");

    // Verifica se os elementos globais existem.
    if (!btnPlanilhas) {
        console.warn("Botão de planilhas de exemplo não encontrado.");
        return;
    }

    if (!modalElemento) {
        console.error("Modal de planilhas de exemplo não encontrado.");
        return;
    }

    // Abre o modal pelo menu do usuário.
    btnPlanilhas.addEventListener("click", function (event) {
        event.preventDefault();

        if (typeof bootstrap === "undefined") {
            console.error("Bootstrap não foi carregado.");
            return;
        }

        bootstrap.Modal
            .getOrCreateInstance(modalElemento)
            .show();
    });

    // Realiza o download da planilha selecionada.
    modalElemento.querySelectorAll(".opcao-planilha").forEach(function (opcao) {

        opcao.addEventListener("click", function (event) {
            event.preventDefault();

            const url = this.dataset.url;

            if (!url) {
                console.error("URL da planilha não definida.", this);
                return;
            }

            const link = document.createElement("a");

            link.href = url;
            link.style.display = "none";

            document.body.appendChild(link);
            link.click();
            link.remove();
        });

    });

});

document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // ELEMENTOS PRINCIPAIS
    // =====================================================

    const form = document.getElementById("formConfiguracoes");

    const navItems = document.querySelectorAll(".config-nav-item");
    const sections = document.querySelectorAll(".config-section");

    const statusSalvamento = document.getElementById("statusSalvamento");
    

    const btnSalvar = document.getElementById("btnSalvarConfiguracoes");
    const btnDescartar = document.getElementById("btnDescartarConfiguracoes");

    let alteracoesPendentes = false;
    let formularioSendoEnviado = false;


    // =====================================================
    // NAVEGAÇÃO
    // =====================================================

    if (navItems.length === 0 || sections.length === 0) {
        console.error("Menu lateral ou seções de configurações não encontrados.");
        return;
    }

    function abrirCategoria(categoria) {

        const secaoSelecionada = document.getElementById(`section-${categoria}`);

        if (!secaoSelecionada) {
            console.error(`Seção não encontrada: section-${categoria}`);
            return;
        }

        navItems.forEach(item => {

            const selecionado = item.dataset.section === categoria;

            item.classList.toggle("active", selecionado);
            item.setAttribute("aria-current", selecionado ? "page" : "false");

        });

        sections.forEach(section => {
            section.classList.remove("active");
        });

        secaoSelecionada.classList.add("active");
    }

    document.addEventListener("click", function (event) {

        const botao = event.target.closest(".config-nav-item");

        if (!botao) return;

        event.preventDefault();

        abrirCategoria(botao.dataset.section);

    });

    const parametros = new URLSearchParams(window.location.search);
    const categoriaInicial = parametros.get("aba");

    const categoriaValida = Array.from(navItems).some(item =>
        item.dataset.section === categoriaInicial &&
        document.getElementById(`section-${categoriaInicial}`)
    );

    abrirCategoria(categoriaValida ? categoriaInicial : "geral");


    // =====================================================
    // VERIFICAR FORMULÁRIO
    // =====================================================

    if (!form) {
        console.error("Formulário #formConfiguracoes não encontrado.");
        return;
    }

    // =====================================================
    // GERENCIAMENTO DE TEMA
    // =====================================================

    const campoTema = form.querySelector('[name="tema"]');

    const temaOriginal = document.documentElement.dataset.theme || "escuro";

    function aplicarTema(tema) {

        const temasValidos = ["escuro", "claro", "automatico"];

        if (!temasValidos.includes(tema)) {
            tema = "escuro";
        }

        document.documentElement.dataset.theme = tema;
    }

    // Pré-visualização ao alterar o campo
    if (campoTema) {

        campoTema.addEventListener("change", function () {
            aplicarTema(this.value);
        });

        // Garante que o tema selecionado no formulário
        // seja aplicado mesmo quando houver erro de validação.
        aplicarTema(campoTema.value);
    }


    // =====================================================
    // OCULTAR INDICADORES
    // =====================================================

    function ocultarIndicadores() {

        if (statusSalvamento) {
            statusSalvamento.style.display = "none";
        }

    }


    // =====================================================
    // ATUALIZAR STATUS DAS ALTERAÇÕES
    // =====================================================

    function atualizarStatus(pendente) {

        alteracoesPendentes = pendente;

        if (!statusSalvamento) return;

        if (pendente) {

            statusSalvamento.style.display = "";

            statusSalvamento.classList.add("pendente");
            statusSalvamento.classList.remove("erro");

            statusSalvamento.innerHTML = `
                <i class="fa-solid fa-circle-exclamation"></i>
                Alterações não salvas
            `;

        } else {

            statusSalvamento.classList.remove("pendente", "erro");

            ocultarIndicadores();

        }

    }


    // =====================================================
    // DETECTAR ALTERAÇÕES
    // =====================================================

    form.addEventListener("input", function (event) {

        if (event.target.matches("input, select, textarea")) {
            atualizarStatus(true);
        }

    });

    form.addEventListener("change", function (event) {

        if (event.target.matches("input, select, textarea")) {
            atualizarStatus(true);
        }

    });


    // =====================================================
    // BOTÃO SALVAR
    // =====================================================

    if (btnSalvar) {

        btnSalvar.addEventListener("click", function () {
            form.requestSubmit();
        });

    }


    // =====================================================
    // DESCARTAR ALTERAÇÕES
    // =====================================================

    if (btnDescartar) {

        btnDescartar.addEventListener("click", function () {

            if (!alteracoesPendentes) return;

            const confirmar = window.confirm(
                "Deseja descartar todas as alterações realizadas?"
            );

            if (!confirmar) return;

            form.reset();

            // Restaura o tema que estava salvo no banco
            if (campoTema) {
                aplicarTema(temaOriginal);
            }

            atualizarStatus(false);

        });

    }


    // =====================================================
    // ENVIO DO FORMULÁRIO
    // =====================================================

    form.addEventListener("submit", function () {

        // Informa que a navegação é consequência do salvamento
        formularioSendoEnviado = true;
        alteracoesPendentes = false;

        if (statusSalvamento) {

            statusSalvamento.style.display = "";
            statusSalvamento.classList.remove("pendente");

            statusSalvamento.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Salvando...
            `;

        }

        if (btnSalvar) {

            btnSalvar.disabled = true;

            btnSalvar.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Salvando...
            `;

        }

    });


    // =====================================================
    // MENSAGENS DE FEEDBACK
    // =====================================================

    function configurarMensagens() {

        const mensagens = document.querySelectorAll(".config-mensagem.success");

        mensagens.forEach(mensagem => {

            if (mensagem.dataset.tempoConfigurado === "true") return;

            mensagem.dataset.tempoConfigurado = "true";

            setTimeout(() => {

                mensagem.style.transition =
                    "opacity 0.4s ease, transform 0.4s ease";

                mensagem.style.opacity = "0";
                mensagem.style.transform = "translateY(-8px)";
                mensagem.style.pointerEvents = "none";

                setTimeout(() => {
                    mensagem.remove();
                }, 400);

            }, 4000);

        });

    }

    configurarMensagens();

    // =====================================================
    // AVISO AO SAIR COM ALTERAÇÕES PENDENTES
    // =====================================================
    window.addEventListener("beforeunload", function (event) {

        // Não exibe aviso quando o formulário está sendo salvo
        if (formularioSendoEnviado) return;

        if (alteracoesPendentes) {

            event.preventDefault();
            event.returnValue = "";

        }

    });


    // =====================================================
    // INICIALIZAÇÃO
    // =====================================================

    atualizarStatus(false);

});

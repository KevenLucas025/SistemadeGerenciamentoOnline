
document.addEventListener("DOMContentLoaded", () => {

    // Identifica todos os selects personalizados da página
    const wrappers = document.querySelectorAll(".select-custom-wrapper");

    wrappers.forEach(wrapper => {

        const select = wrapper.querySelector("select");
        const trigger = wrapper.querySelector(".select-custom-trigger");
        const triggerText = trigger?.querySelector("span");
        const optionsContainer = wrapper.querySelector(".select-custom-options");

        if (!select || !trigger || !triggerText || !optionsContainer) return;

        // Evita inicializar o mesmo select duas vezes
        if (wrapper.dataset.inicializado === "true") return;
        wrapper.dataset.inicializado = "true";

        function atualizarOpcaoAtiva(valor) {
            const opcoes = optionsContainer.querySelectorAll(".select-custom-option");

            opcoes.forEach(item => {
                item.classList.toggle("ativo", item.dataset.value === valor);
            });
        }

        function sincronizarSelect() {
            const opcaoSelecionada = select.options[select.selectedIndex];

            if (opcaoSelecionada) {
                triggerText.textContent = opcaoSelecionada.textContent.trim();
                atualizarOpcaoAtiva(select.value);
            }
        }

        function abrirSelect() {
            wrapper.classList.add("aberto");
            trigger.setAttribute("aria-expanded", "true");

            atualizarOpcaoAtiva(select.value);
        }

        function fecharSelect() {
            wrapper.classList.remove("aberto");
            trigger.setAttribute("aria-expanded", "false");
        }

        // Cria as opções personalizadas
        Array.from(select.options).forEach(option => {
            const item = document.createElement("div");

            item.className = "select-custom-option";
            item.textContent = option.textContent.trim();
            item.dataset.value = option.value;

            item.addEventListener("mouseenter", () => {
                atualizarOpcaoAtiva(option.value);
            });

            item.addEventListener("click", () => {
                select.value = option.value;

                sincronizarSelect();
                fecharSelect();

                select.dispatchEvent(
                    new Event("change", { bubbles: true })
                );
            });

            optionsContainer.appendChild(item);
        });

        // Abre e fecha o menu
        trigger.addEventListener("click", () => {
            if (wrapper.classList.contains("aberto")) {
                fecharSelect();
            } else {
                abrirSelect();
            }
        });

        // Fecha ao clicar fora
        document.addEventListener("click", event => {
            if (!wrapper.contains(event.target)) {
                fecharSelect();
            }
        });

        // Sincroniza alterações feitas por outros scripts
        select.addEventListener("change", sincronizarSelect);

        // Estado inicial
        sincronizarSelect();

    });

});

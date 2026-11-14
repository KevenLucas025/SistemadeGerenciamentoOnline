
function abrirMenuUsuario() {
    const menu = document.getElementById("menuUsuarioDropdown");

    if (menu) {
        menu.classList.toggle("ativo");
    }
}


// =========================
// FECHAR MENU AO CLICAR FORA
// =========================

document.addEventListener("click", function(event) {
    const usuario = document.querySelector(".sidebar-user");
    const menu = document.getElementById("menuUsuarioDropdown");

    if (
        usuario &&
        menu &&
        !usuario.contains(event.target) &&
        !menu.contains(event.target)
    ) {
        menu.classList.remove("ativo");
    }
});


// =========================
// CAPTURAR CSRF TOKEN
// =========================

function getCSRFToken() {
    const cookies = document.cookie.split(";");

    for (const cookie of cookies) {
        const [nome, ...valores] = cookie.trim().split("=");

        if (nome === "csrftoken") {
            return decodeURIComponent(valores.join("="));
        }
    }

    return "";
}


// =========================
// CONTROLE DE STATUS DO USUÁRIO
// =========================

document.addEventListener("DOMContentLoaded", () => {

    const containerStatus = document.getElementById("containerStatusUsuario");
    const indicador = document.getElementById("statusUsuario");
    const avatarTopbar = document.getElementById("topbarUserAvatar");
    const avatarHeader = document.getElementById("dropdownHeaderAvatar");
    const indicadorHeader = document.getElementById("statusIndicadorHeader");
    const textoHeader = document.getElementById("statusTextoHeader");

    const textosStatus = {
        online: "Online",
        ausente: "Ausente",
        transferencias: "Apenas transferências",
        offline: "Offline"
    };

    const coresBorda = {
        online: "#22c55e",
        ausente: "#f59e0b",
        transferencias: "#38bdf8",
        offline: "#6b7280"
    };

    // URL para salvar o status
    const URL_STATUS = "/atualizar-status/";

    // Status atualmente confirmado pelo banco
    let statusSalvo = containerStatus?.dataset.statusInicial || "online";

    // Evita múltiplas gravações simultâneas
    let salvandoStatus = false;


    // =========================
    // APLICAR STATUS VISUALMENTE
    // =========================

    function aplicarStatus(status) {

        const cor = coresBorda[status] || "#22c55e";

        // Topbar
        if (avatarTopbar) {
            avatarTopbar.className = `sidebar-user-avatar ${status}`;
            avatarTopbar.style.borderColor = cor;
        }

        if (indicador) {
            indicador.className = `status-indicador ${status}`;
            indicador.style.backgroundColor = cor;
        }

        // Dropdown
        if (avatarHeader) {
            avatarHeader.className = `dropdown-user-avatar ${status}`;
            avatarHeader.style.borderColor = cor;
        }

        if (indicadorHeader) {
            indicadorHeader.className = `status-indicador-header ${status}`;
            indicadorHeader.style.backgroundColor = cor;
        }

        // Texto
        if (textoHeader) {
            textoHeader.textContent = textosStatus[status] || "Online";
        }

        // Opção selecionada
        document.querySelectorAll(".status-opcao").forEach(item => {

            if (item.dataset.status === status) {
                item.classList.add("ativo");
            } else {
                item.classList.remove("ativo");
            }

        });

        // Atualiza o atributo local
        if (containerStatus) {
            containerStatus.dataset.statusInicial = status;
        }
    }


    // =========================
    // INICIALIZAÇÃO
    // =========================

    aplicarStatus(statusSalvo);


    // =========================
    // SALVAR STATUS NO BANCO
    // =========================

    async function salvarStatus(status) {

        if (salvandoStatus) {
            return;
        }

        const statusAnterior = statusSalvo;

        // Não envia se já estiver selecionado
        if (status === statusSalvo) {
            return;
        }

        salvandoStatus = true;

        const formData = new FormData();
        formData.append("status", status);

        try {

            const resposta = await fetch(URL_STATUS, {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCSRFToken()
                },
                body: formData
            });

            const data = await resposta.json();

            if (!resposta.ok || !data.sucesso) {
                throw new Error(
                    data.mensagem || "Não foi possível atualizar o status."
                );
            }

            // Atualiza somente após confirmação do backend
            statusSalvo = data.status;

            aplicarStatus(statusSalvo);

            console.log("Status salvo no banco:", statusSalvo);

        } catch (erro) {

            console.error("Erro ao salvar status:", erro);

            // Recupera o status anterior
            statusSalvo = statusAnterior;
            aplicarStatus(statusAnterior);

            if (typeof mostrarAlerta === "function") {
                mostrarAlerta(
                    "Não foi possível salvar seu status. Tente novamente.",
                    "erro"
                );
            }

        } finally {

            salvandoStatus = false;

        }
    }


    // =========================
    // EVENTOS DAS OPÇÕES DE STATUS
    // =========================

    document.querySelectorAll(".status-opcao").forEach(opcao => {

        opcao.addEventListener("click", function() {

            const status = this.dataset.status;

            if (!status || salvandoStatus) {
                return;
            }

            salvarStatus(status);

        });

    });

});

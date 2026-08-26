function abrirMenuUsuario() {
    const menu = document.getElementById("menuUsuarioDropdown");
    if (menu) {
        menu.classList.toggle("ativo");
    }
}

// Fecha o menu ao clicar fora
document.addEventListener("click", function(event) {
    const usuario = document.querySelector(".sidebar-user");
    const menu = document.getElementById("menuUsuarioDropdown");

    if (usuario && menu && !usuario.contains(event.target) && !menu.contains(event.target)) {
        menu.classList.remove("ativo");
    }
});

// Helper para capturar o CSRF Token
function getCSRFToken() {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const [nome, valor] = cookie.trim().split("=");
        if (nome === "csrftoken") return decodeURIComponent(valor);
    }
    return "";
}

// Controle de Troca de Status com Persistência
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

    function aplicarStatus(status) {
        const cor = coresBorda[status] || "#22c55e";

        // 1. Atualiza elementos da Topbar
        if (avatarTopbar) {
            avatarTopbar.className = `sidebar-user-avatar ${status}`;
            avatarTopbar.style.borderColor = cor;
        }
        if (indicador) {
            indicador.className = `status-indicador ${status}`;
            indicador.style.backgroundColor = cor;
        }

        // 2. Atualiza cabeçalho do Dropdown
        if (avatarHeader) {
            avatarHeader.className = `dropdown-user-avatar ${status}`;
            avatarHeader.style.borderColor = cor;
        }
        if (indicadorHeader) {
            indicadorHeader.className = `status-indicador-header ${status}`;
            indicadorHeader.style.backgroundColor = cor;
        }

        // 3. Atualiza o texto descritivo
        if (textoHeader) {
            textoHeader.textContent = textosStatus[status] || "Online";
        }

        // 4. Marca o item ativo
        document.querySelectorAll(".status-opcao").forEach(item => {
            if (item.dataset.status === status) {
                item.classList.add("ativo");
            } else {
                item.classList.remove("ativo");
            }
        });
    }

    // Inicializa com o status que está salvo no banco
    const statusSalvo = containerStatus ? containerStatus.dataset.statusInicial : "online";
    aplicarStatus(statusSalvo || "online");

    // Salva a alteração no banco via AJAX ao clicar
    document.querySelectorAll(".status-opcao").forEach(opcao => {
        opcao.addEventListener("click", function() {
            const status = this.dataset.status;
            
            // Aplica visualmente na hora
            aplicarStatus(status);

            // Envia para o banco de dados
            const formData = new FormData();
            formData.append("status", status);

            fetch("/atualizar-status/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCSRFToken()
                },
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (!data.sucesso) {
                    console.error("Erro ao salvar status:", data.mensagem);
                }
            })
            .catch(err => console.error("Erro na requisição:", err));
        });
    });
});
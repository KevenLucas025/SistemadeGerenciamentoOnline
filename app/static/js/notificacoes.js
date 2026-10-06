document.addEventListener("DOMContentLoaded", () => {
    // =====================================================
    // WEBSOCKET (CONEXÃO EM TEMPO REAL)
    // =====================================================
    const protocolo = window.location.protocol === "https:" ? "wss:" : "ws:";
    let socket = null;

    try {
        socket = new WebSocket(`${protocolo}//${window.location.host}/ws/notificacoes/`);
    } catch (e) {
        console.warn("WebSocket não pôde ser iniciado:", e);
    }

    // =====================================================
    // ELEMENTOS DO DOM (TOPBAR E PAINEL)
    // =====================================================
    const botao = document.getElementById("botaoNotificacoes");
    const contador = document.getElementById("contadorNotificacoes");
    const painel = document.getElementById("painelNotificacoes");
    const lista = document.getElementById("listaNotificacoes");
    const btnMarcarTodasLidas = document.getElementById("btnMarcarTodasLidas");

    // =====================================================
    // ELEMENTOS DO MODAL DE HISTÓRICO COMPLETO
    // =====================================================
    const linkVerTodas = document.querySelector(".notificacoes-ver-todas");
    const modalHistoricoEl = document.getElementById("modalHistoricoNotificacoes");
    const listaHistorico = document.getElementById("listaHistoricoNotificacoes");
    const btnMarcarTodasHistorico = document.getElementById("btnMarcarTodasLidasHistorico");

    const modalHistorico = modalHistoricoEl
        ? bootstrap.Modal.getOrCreateInstance(modalHistoricoEl)
        : null;

    let quantidadeNotificacoes = 0;

    // =====================================================
    // 1. ATUALIZAR CONTADOR DE NÃO LIDAS (BADGE)
    // =====================================================
    function atualizarContador() {
        if (!contador) return;

        if (quantidadeNotificacoes <= 0) {
            contador.textContent = "";
            contador.style.display = "none";
        } else {
            contador.textContent = quantidadeNotificacoes > 99 ? "99+" : quantidadeNotificacoes;
            contador.style.display = "flex";
        }
    }

    // =====================================================
    // 2. CARREGAR NOTIFICAÇÕES RECENTES DO BANCO
    // =====================================================
    function carregarNotificacoes() {
        fetch("/notificacoes/")
            .then(response => response.json())
            .then(data => {
                if (!data.sucesso) return;

                quantidadeNotificacoes = data.quantidade_nao_lidas || 0;
                atualizarContador();

                if (!lista) return;
                lista.innerHTML = "";

                if (!data.notificacoes || data.notificacoes.length === 0) {
                    lista.innerHTML = `
                        <div class="sem-notificacoes">
                            <div class="sem-notificacoes-icone">
                                <i class="fa-regular fa-bell-slash"></i>
                            </div>
                            <p>Nenhuma notificação por aqui.</p>
                            <span>Você está em dia com todas as suas tarefas!</span>
                        </div>
                    `;
                    return;
                }

                data.notificacoes.forEach(notificacao => {
                    adicionarNotificacao(notificacao, false);
                });
            })
            .catch(error => {
                console.error("Erro ao carregar notificações:", error);
            });
    }

    // =====================================================
    // 3. RENDERIZAR ITEM DE NOTIFICAÇÃO NA LISTA
    // =====================================================
    function adicionarNotificacao(notificacao, nova = true) {
        if (!lista) return;

        const semNotificacoes = lista.querySelector(".sem-notificacoes");
        if (semNotificacoes) {
            semNotificacoes.remove();
        }

        const elemento = document.createElement("div");
        elemento.className = `item-notificacao ${!notificacao.lida ? "nao-lida" : ""}`;
        elemento.dataset.id = notificacao.id;

        // Ícone contextual por tipo
        let iconeClasse = "fa-solid fa-bell";
        let iconeTipo = "";

        if (notificacao.tipo === "sucesso") {
            iconeClasse = "fa-solid fa-circle-check";
            iconeTipo = "sucesso";
        } else if (notificacao.tipo === "alerta") {
            iconeClasse = "fa-solid fa-triangle-exclamation";
            iconeTipo = "alerta";
        } else if (notificacao.tipo === "erro") {
            iconeClasse = "fa-solid fa-circle-xmark";
            iconeTipo = "erro";
        }

        elemento.innerHTML = `
            <div class="item-notificacao-icone ${iconeTipo}">
                <i class="${iconeClasse}"></i>
            </div>
            <div class="item-notificacao-conteudo">
                <span class="item-notificacao-mensagem">${notificacao.mensagem}</span>
                <span class="item-notificacao-data">
                    <i class="fa-regular fa-clock"></i> ${notificacao.criado_em || "-"}
                </span>
            </div>
        `;

        elemento.addEventListener("click", () => {
            marcarComoLida(elemento, notificacao.id);
        });

        if (nova) {
            lista.prepend(elemento);
        } else {
            lista.appendChild(elemento);
        }
    }

    // =====================================================
    // 4. MARCAR NOTIFICAÇÃO INDIVIDUAL COMO LIDA
    // =====================================================
    function marcarComoLida(elemento, notificacaoId) {
        if (!elemento.classList.contains("nao-lida")) return;

        fetch(`/notificacoes/${notificacaoId}/ler/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            if (!data.sucesso) return;

            // Remove o visual de não lida
            elemento.classList.remove("nao-lida");

            // Atualiza outros elementos com o mesmo ID (ex: no histórico e na topbar ao mesmo tempo)
            document.querySelectorAll(`.item-notificacao[data-id="${notificacaoId}"]`).forEach(el => {
                el.classList.remove("nao-lida");
            });

            quantidadeNotificacoes = Math.max(0, quantidadeNotificacoes - 1);
            atualizarContador();
        })
        .catch(error => {
            console.error("Erro ao marcar notificação como lida:", error);
        });
    }

    // =====================================================
    // 5. MARCAR TODAS AS NOTIFICAÇÕES COMO LIDAS
    // =====================================================
    function marcarTodasComoLidasServidor() {
        fetch("/notificacoes/ler-todas/", {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken()
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.sucesso) {
                // Remove destaque de não lida de todos os itens abertos
                document.querySelectorAll(".item-notificacao.nao-lida").forEach(item => {
                    item.classList.remove("nao-lida");
                });

                quantidadeNotificacoes = 0;
                atualizarContador();

                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Todas as notificações foram marcadas como lidas!", "sucesso");
                }
            }
        })
        .catch(err => {
            console.error("Erro ao marcar todas como lidas:", err);
        });
    }

    // Evento no botão da topbar
    if (btnMarcarTodasLidas) {
        btnMarcarTodasLidas.addEventListener("click", (e) => {
            e.stopPropagation();
            marcarTodasComoLidasServidor();
        });
    }

    // Evento no botão dentro do modal de histórico
    if (btnMarcarTodasHistorico) {
        btnMarcarTodasHistorico.addEventListener("click", (e) => {
            e.stopPropagation();
            marcarTodasComoLidasServidor();
        });
    }

    // =====================================================
    // 6. CARREGAR E EXIBIR HISTÓRICO COMPLETO (MODAL)
    // =====================================================
    function abrirHistoricoCompleto() {
        if (!listaHistorico) return;

        listaHistorico.innerHTML = `
            <div class="text-center py-5 text-secondary">
                <i class="fa-solid fa-spinner fa-spin fa-2x mb-2"></i>
                <p>Carregando histórico...</p>
            </div>
        `;

        if (painel) painel.classList.remove("aberto");
        if (modalHistorico) modalHistorico.show();

        fetch("/notificacoes/historico/")
            .then(res => res.json())
            .then(data => {
                if (!data.sucesso || !data.notificacoes || data.notificacoes.length === 0) {
                    listaHistorico.innerHTML = `
                        <div class="sem-notificacoes py-5">
                            <div class="sem-notificacoes-icone">
                                <i class="fa-regular fa-bell-slash"></i>
                            </div>
                            <p>Nenhuma notificação encontrada no histórico.</p>
                        </div>
                    `;
                    return;
                }

                listaHistorico.innerHTML = "";
                data.notificacoes.forEach(n => {
                    const item = document.createElement("div");
                    item.className = `item-notificacao ${!n.lida ? "nao-lida" : ""}`;
                    item.dataset.id = n.id;

                    let iconeClasse = "fa-solid fa-bell";
                    let iconeTipo = "";
                    if (n.tipo === "sucesso") { iconeClasse = "fa-solid fa-circle-check"; iconeTipo = "sucesso"; }
                    else if (n.tipo === "alerta") { iconeClasse = "fa-solid fa-triangle-exclamation"; iconeTipo = "alerta"; }
                    else if (n.tipo === "erro") { iconeClasse = "fa-solid fa-circle-xmark"; iconeTipo = "erro"; }

                    item.innerHTML = `
                        <div class="item-notificacao-icone ${iconeTipo}">
                            <i class="${iconeClasse}"></i>
                        </div>
                        <div class="item-notificacao-conteudo">
                            <span class="item-notificacao-mensagem">${n.mensagem}</span>
                            <span class="item-notificacao-data">
                                <i class="fa-regular fa-clock"></i> ${n.criado_em}
                            </span>
                        </div>
                    `;

                    item.addEventListener("click", () => {
                        marcarComoLida(item, n.id);
                    });

                    listaHistorico.appendChild(item);
                });
            })
            .catch(err => {
                console.error("Erro ao carregar histórico:", err);
                listaHistorico.innerHTML = `<p class="text-danger text-center py-4">Erro ao carregar notificações.</p>`;
            });
    }

    if (linkVerTodas) {
        linkVerTodas.addEventListener("click", (e) => {
            e.preventDefault();
            abrirHistoricoCompleto();
        });
    }

    // =====================================================
    // 7. BOTÃO DO SINO (ABRIR / FECHAR DROPDOWN)
    // =====================================================
    if (botao && painel) {
        botao.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            painel.classList.toggle("aberto");
        });
    }

    // =====================================================
    // 8. CLICAR FORA (FECHAR DROPDOWN)
    // =====================================================
    document.addEventListener("click", (event) => {
        if (!painel || !botao) return;

        if (!painel.contains(event.target) && !botao.contains(event.target)) {
            painel.classList.remove("aberto");
        }
    });

    // =====================================================
    // 9. EVENTOS DO WEBSOCKET
    // =====================================================
    if (socket) {
        socket.onopen = () => {
            console.log("WebSocket de notificações conectado.");
        };

        socket.onmessage = (evento) => {
            try {
                const dados = JSON.parse(evento.data);
                console.log("Nova notificação recebida via WebSocket:", dados);
                carregarNotificacoes();
            } catch (err) {
                console.error("Erro ao processar mensagem do WebSocket:", err);
            }
        };

        socket.onclose = () => {
            console.log("WebSocket de notificações desconectado.");
        };

        socket.onerror = (erro) => {
            console.error("Erro no WebSocket:", erro);
        };
    }

    // =====================================================
    // 10. CSRF TOKEN HELPER
    // =====================================================
    function getCSRFToken() {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
            const [nome, valor] = cookie.trim().split("=");
            if (nome === "csrftoken") {
                return decodeURIComponent(valor);
            }
        }
        return "";
    }

    // =====================================================
    // INICIALIZAÇÃO AUTOMÁTICA
    // =====================================================
    carregarNotificacoes();
});
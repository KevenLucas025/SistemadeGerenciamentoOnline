document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       1. ELEMENTOS PRINCIPAIS DO DOM
    ========================================= */
    const btnGerarSaida = document.getElementById("btnGerarSaida");
    const modalSaidaEl = document.getElementById("modalConfirmarSaida");
    const modalSaida = modalSaidaEl ? bootstrap.Modal.getOrCreateInstance(modalSaidaEl) : null;
    const nomeUsuarioSaidaModal = document.getElementById("nomeUsuarioSaidaModal");
    const btnConfirmarSaidaDefinitiva = document.getElementById("btnConfirmarSaidaDefinitiva");

    const btnAtualizarAtivos = document.getElementById("btnAtualizarAtivos");
    const btnAtualizarInativos = document.getElementById("btnAtualizarInativos");
    const tbodyAtivos = document.getElementById("tbodyUsuariosAtivos");
    const tbodyInativos = document.getElementById("tbodyUsuariosInativos");

    // Modal de Histórico e Ferramentas
    const btnAbrirHistorico = document.getElementById("btnAbrirHistorico");
    const btnAtualizarHistorico = document.getElementById("btnAtualizarHistorico");
    const modalHistoricoEl = document.getElementById("modalHistoricoUsuarios");
    const modalHistorico = modalHistoricoEl ? bootstrap.Modal.getOrCreateInstance(modalHistoricoEl) : null;

    const checkAllHistorico = document.getElementById("checkAllHistorico");
    const tbodyHistorico = document.getElementById("tbodyHistoricoUsuarios");
    const contadorSelecionados = document.getElementById("contadorSelecionadosHistorico");

    let linhaAtivaSelecionada = null;

    /* =========================================
       2. FUNÇÕES DE FORMATAÇÃO E MÁSCARAS
    ========================================= */
    function somenteNumeros(valor) {
        return (valor || "").replace(/\D/g, "");
    }

    function formatarCPF(valor) {
        valor = somenteNumeros(valor);
        if (valor.length === 11) {
            return valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
        }
        return valor;
    }

    function formatarCNPJ(valor) {
        valor = somenteNumeros(valor);
        if (valor.length === 14) {
            return valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
        }
        return valor;
    }

    function formatarRG(valor) {
        valor = somenteNumeros(valor);
        if (valor.length === 9) {
            return valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{1})$/, "$1.$2.$3-$4");
        }
        return valor;
    }

    function formatarCEP(valor) {
        valor = somenteNumeros(valor);
        if (valor.length === 8) {
            return valor.replace(/^(\d{5})(\d{3})$/, "$1-$2");
        }
        return valor;
    }

    function formatarTelefone(valor) {
        valor = somenteNumeros(valor);
        if (valor.length === 11) {
            return valor.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
        }
        if (valor.length === 10) {
            return valor.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
        }
        return valor;
    }

    function aplicarFormatacoesTabela() {
        document.querySelectorAll(".tabela-cpf").forEach(el => el.textContent = formatarCPF(el.textContent));
        document.querySelectorAll(".tabela-cnpj").forEach(el => el.textContent = formatarCNPJ(el.textContent));
        document.querySelectorAll(".tabela-rg").forEach(el => el.textContent = formatarRG(el.textContent));
        document.querySelectorAll(".tabela-cep").forEach(el => el.textContent = formatarCEP(el.textContent));
        document.querySelectorAll(".tabela-telefone").forEach(el => el.textContent = formatarTelefone(el.textContent));
    }

    aplicarFormatacoesTabela();

    /* =========================================
       3. TOKEN CSRF (DJANGO)
    ========================================= */
    function getCSRFToken() {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
            const [nome, valor] = cookie.trim().split("=");
            if (nome === "csrftoken") {
                return decodeURIComponent(valor);
            }
        }
        return document.querySelector("[name=csrfmiddlewaretoken]")?.value || "";
    }

    /* =========================================
       4. ATUALIZAÇÃO ASSÍNCRONA DAS TABELAS (AJAX)
    ========================================= */
    async function atualizarTabela(tipo, botao, tbody, silencioso = false) {
        if (!tbody) return;

        const icone = botao ? botao.querySelector("i") : null;

        try {
            if (botao) botao.disabled = true;
            if (icone) icone.classList.add("fa-spin");

            const resposta = await fetch(`/usuarios/atualizar-status/?tipo=${tipo}`);

            if (!resposta.ok) {
                throw new Error(`Erro HTTP: ${resposta.status}`);
            }

            const dados = await resposta.json();

            if (dados.sucesso) {
                tbody.innerHTML = dados.html;

                const linhasVazias = tbody.querySelectorAll(".linha-vazia");
                if (linhasVazias.length > 0) {
                    desmarcarLinhaAtiva();
                }

                aplicarFormatacoesTabela();

                if (!silencioso && typeof mostrarAlerta === "function") {
                    const nomeTabela = tipo === "ativos" ? "ativos" : "inativos";
                    mostrarAlerta(`Tabela de usuários ${nomeTabela} atualizada com sucesso!`, "sucesso");
                }
            } else {
                throw new Error(dados.mensagem || "Erro ao processar dados da tabela.");
            }

        } catch (erro) {
            console.error(`Erro ao atualizar tabela de ${tipo}:`, erro);
            if (!silencioso && typeof mostrarAlerta === "function") {
                mostrarAlerta(`Não foi possível atualizar a tabela de usuários ${tipo}.`, "erro");
            }
        } finally {
            if (botao) botao.disabled = false;
            if (icone) icone.classList.remove("fa-spin");
        }
    }

    if (btnAtualizarAtivos) {
        btnAtualizarAtivos.addEventListener("click", () => atualizarTabela("ativos", btnAtualizarAtivos, tbodyAtivos, false));
    }

    if (btnAtualizarInativos) {
        btnAtualizarInativos.addEventListener("click", () => atualizarTabela("inativos", btnAtualizarInativos, tbodyInativos, false));
    }

    /* =========================================
       5. SELEÇÃO DE LINHAS (TABELA ATIVOS)
    ========================================= */
    function desmarcarLinhaAtiva() {
        if (tbodyAtivos) {
            tbodyAtivos.querySelectorAll("tr").forEach(tr => tr.classList.remove("linha-selecionada"));
        }
        linhaAtivaSelecionada = null;
    }

    if (tbodyAtivos) {
        tbodyAtivos.addEventListener("click", function (e) {
            if (e.target.closest(".linha-vazia")) {
                return;
            }

            const linha = e.target.closest("tr.linha-usuario-ativo");
            if (!linha) return;

            // Toggle de seleção
            if (linha.classList.contains("linha-selecionada")) {
                desmarcarLinhaAtiva();
                return;
            }

            tbodyAtivos.querySelectorAll("tr").forEach(tr => tr.classList.remove("linha-selecionada"));
            linha.classList.add("linha-selecionada");
            linhaAtivaSelecionada = linha;
        });
    }

    /* =========================================
       6. FLUXO: GERAR SAÍDA DE USUÁRIO
    ========================================= */
    if (btnGerarSaida) {
        btnGerarSaida.addEventListener("click", function () {
            const temLinhaVazia = tbodyAtivos?.querySelectorAll(".linha-vazia").length > 0;
            if (temLinhaVazia || !linhaAtivaSelecionada) {
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Selecione um usuário para gerar a saída", "erro");
                } else {
                    alert("Selecione um usuário ativo na tabela para gerar a saída.");
                }
                return;
            }

            const nomeUsuario = linhaAtivaSelecionada.querySelector("td:nth-child(2)")?.textContent.trim() 
                || linhaAtivaSelecionada.querySelector("td:first-child")?.textContent.trim();

            if (nomeUsuarioSaidaModal) {
                nomeUsuarioSaidaModal.textContent = nomeUsuario;
            }

            if (modalSaida) {
                modalSaida.show();
            }
        });
    }

    if (btnConfirmarSaidaDefinitiva) {
        btnConfirmarSaidaDefinitiva.addEventListener("click", async function () {
            if (!linhaAtivaSelecionada) return;

            const usuarioId = linhaAtivaSelecionada.getAttribute("data-usuario-id");
            if (!usuarioId) return;

            const csrfToken = getCSRFToken();

            try {
                btnConfirmarSaidaDefinitiva.disabled = true;

                const resposta = await fetch(`/usuarios/gerar-saida/${usuarioId}/`, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken,
                        "Content-Type": "application/json"
                    }
                });

                const textoResposta = await resposta.text();
                let dados;
                try {
                    dados = JSON.parse(textoResposta);
                } catch (e) {
                    console.error("Servidor não respondeu com JSON:", textoResposta);
                    if (typeof mostrarAlerta === "function") {
                        mostrarAlerta("Erro interno no servidor ao processar saída.", "erro");
                    }
                    return;
                }

                if (!resposta.ok || !dados.sucesso) {
                    if (typeof mostrarAlerta === "function") {
                        mostrarAlerta(dados.mensagem || "Erro ao gerar saída do usuário.", "erro");
                    } else {
                        alert(dados.mensagem || "Erro ao gerar saída do usuário.");
                    }
                    return;
                }

                if (modalSaida) modalSaida.hide();

                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(dados.mensagem, "sucesso");
                }

                desmarcarLinhaAtiva();

                // Recarrega silenciosamente ambas as tabelas
                await atualizarTabela("ativos", btnAtualizarAtivos, tbodyAtivos, true);
                await atualizarTabela("inativos", btnAtualizarInativos, tbodyInativos, true);

            } catch (erro) {
                console.error("Erro na requisição de saída:", erro);
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Erro de comunicação ao processar saída.", "erro");
                }
            } finally {
                btnConfirmarSaidaDefinitiva.disabled = false;
            }
        });
    }

    /* =========================================
       7. CARREGAMENTO E MANIPULAÇÃO DO HISTÓRICO
    ========================================= */
    async function carregarHistoricoUsuarios() {
        if (!tbodyHistorico) return;

        const iconeAtualizar = btnAtualizarHistorico?.querySelector("i");
        if (iconeAtualizar) iconeAtualizar.classList.add("fa-spin");

        try {
            const resposta = await fetch("/usuarios/historico/listar/");
            
            if (!resposta.ok) {
                throw new Error(`Erro HTTP: ${resposta.status}`);
            }

            const dados = await resposta.json();

            if (!dados.sucesso || !dados.historico || dados.historico.length === 0) {
                tbodyHistorico.innerHTML = `
                    <tr class="linha-vazia-historico">
                        <td colspan="5">
                            <div class="sem-registros-content-historico">
                                <i class="fa-solid fa-clock-rotate-left"></i>
                                <p>Nenhum registro de histórico encontrado.</p>
                            </div>
                        </td>
                    </tr>
                `;
                if (checkAllHistorico) {
                    checkAllHistorico.checked = false;
                    checkAllHistorico.indeterminate = false;
                }
                atualizarContadorHistorico();
                return;
            }

            tbodyHistorico.innerHTML = "";

            dados.historico.forEach(item => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td class="col-checkbox">
                        <input type="checkbox" class="checkbox-custom-historico check-item-historico" value="${item.id}">
                    </td>
                    <td>${item.data_hora}</td>
                    <td><strong>${item.usuario_logado}</strong></td>
                    <td><span class="badge bg-danger">${item.acao}</span></td>
                    <td>${item.descricao}</td>
                `;
                tbodyHistorico.appendChild(tr);
            });

            if (checkAllHistorico) {
                checkAllHistorico.checked = false;
                checkAllHistorico.indeterminate = false;
            }
            atualizarContadorHistorico();

        } catch (erro) {
            console.error("Erro ao carregar histórico:", erro);
            if (typeof mostrarAlerta === "function") {
                mostrarAlerta("Não foi possível carregar o histórico de atividades.", "erro");
            }
        } finally {
            if (iconeAtualizar) iconeAtualizar.classList.remove("fa-spin");
        }
    }

    // Abertura do Modal de Histórico e Atualização Manual
    if (btnAbrirHistorico && modalHistorico) {
        btnAbrirHistorico.addEventListener("click", function () {
            modalHistorico.show();
            carregarHistoricoUsuarios();
        });
    }

    if (btnAtualizarHistorico) {
        btnAtualizarHistorico.addEventListener("click", function () {
            carregarHistoricoUsuarios();
        });
    }

    /* =========================================
       8. CHECKBOXES DO HISTÓRICO
    ========================================= */
    function atualizarContadorHistorico() {
        if (!tbodyHistorico || !contadorSelecionados) return;
        const totalChecados = tbodyHistorico.querySelectorAll(".check-item-historico:checked").length;
        contadorSelecionados.textContent = `${totalChecados} item${totalChecados === 1 ? "" : "s"} selecionado${totalChecados === 1 ? "" : "s"}`;
    }

    // Selecionar / Desmarcar Todos
    if (checkAllHistorico && tbodyHistorico) {
        checkAllHistorico.addEventListener("change", function () {
            const checkboxes = tbodyHistorico.querySelectorAll(".check-item-historico");
            checkboxes.forEach(cb => cb.checked = checkAllHistorico.checked);
            atualizarContadorHistorico();
        });
    }

    // Gerenciamento de seleção individual
    if (tbodyHistorico) {
        tbodyHistorico.addEventListener("change", function (e) {
            if (e.target.classList.contains("check-item-historico")) {
                const total = tbodyHistorico.querySelectorAll(".check-item-historico").length;
                const marcados = tbodyHistorico.querySelectorAll(".check-item-historico:checked").length;

                if (checkAllHistorico) {
                    checkAllHistorico.checked = total > 0 && total === marcados;
                    checkAllHistorico.indeterminate = marcados > 0 && marcados < total;
                }
                atualizarContadorHistorico();
            }
        });
    }

    /* =========================================
       9. CLIQUE FORA PARA DESELECIONAR LINHA ATIVA
    ========================================= */
    document.addEventListener("click", function (e) {
        const clicouNaTabela = e.target.closest("#tbodyUsuariosAtivos");
        const clicouNoBotaoSaida = e.target.closest("#btnGerarSaida");
        const clicouNoModal = e.target.closest("#modalConfirmarSaida");
        const clicouNoModalHistorico = e.target.closest("#modalHistoricoUsuarios");

        if (!clicouNaTabela && !clicouNoBotaoSaida && !clicouNoModal && !clicouNoModalHistorico) {
            desmarcarLinhaAtiva();
        }
    });

});
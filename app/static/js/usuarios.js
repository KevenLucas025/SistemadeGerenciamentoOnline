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
    const btnLimparTabelas = document.getElementById("btnLimparTabelas");

    // Modal de Histórico e Ferramentas da Toolbar
    const btnAbrirHistorico = document.getElementById("btnAbrirHistorico");
    const btnAtualizarHistorico = document.getElementById("btnAtualizarHistorico");
    const btnApagarHistorico = document.getElementById("btnApagarHistorico");
    const modalHistoricoEl = document.getElementById("modalHistoricoUsuarios");
    const modalHistorico = modalHistoricoEl ? bootstrap.Modal.getOrCreateInstance(modalHistoricoEl) : null;

    // Modal de Confirmação de Exclusão do Histórico
    const modalApagarHistEl = document.getElementById("modalConfirmarApagarHistorico");
    const modalApagarHist = modalApagarHistEl ? bootstrap.Modal.getOrCreateInstance(modalApagarHistEl) : null;
    const btnConfirmarApagarHistoricoDefinitivo = document.getElementById("btnConfirmarApagarHistoricoDefinitivo");
    const qtdHistoricoApagarModal = document.getElementById("qtdHistoricoApagarModal");

    const checkAllHistorico = document.getElementById("checkAllHistorico");
    const tbodyHistorico = document.getElementById("tbodyHistoricoUsuarios");
    const contadorSelecionados = document.getElementById("contadorSelecionadosHistorico");

    /* =========================================
       EXPORTAÇÃO DE HISTÓRICO (CSV, EXCEL, PDF)
    ========================================= */
    const btnExportarCsvHistorico = document.getElementById("btnExportarCsvHistorico");
    const btnExportarExcelHistorico = document.getElementById("btnExportarExcelHistorico");
    const btnExportarPdfHistorico = document.getElementById("btnExportarPdfHistorico");

    /* =========================================
       PAUSAR E ATIVAR GRAVAÇÃO DO HISTÓRICO
    ========================================= */
    const btnAbrirModalPausa = document.getElementById("btnPausarHistorico");
    const modalPausaEl = document.getElementById("modalStatusPausaHistorico");
    const modalPausa = modalPausaEl ? bootstrap.Modal.getOrCreateInstance(modalPausaEl) : null;
    const btnSimAtivarHistorico = document.getElementById("btnSimAtivarHistorico");
    const btnNaoPausarHistorico = document.getElementById("btnNaoPausarHistorico");
    const badgeStatusPausaAtual = document.getElementById("badgeStatusPausaAtual");

    /* =========================================
       ORDENAÇÃO DO HISTÓRICO
    ========================================= */
    const btnAbrirModalOrdenar = document.getElementById("btnOrdenarHistorico");
    const modalOrdenarEl = document.getElementById("modalOrdenarHistoricoUsuarios");
    const modalOrdenar = modalOrdenarEl ? bootstrap.Modal.getOrCreateInstance(modalOrdenarEl) : null;
    const btnExecutarOrdenacaoHistorico = document.getElementById("btnExecutarOrdenacaoHistorico");
    const tipoOrdenacaoHistorico = document.getElementById("tipoOrdenacaoHistorico");

    /* =========================================
       FILTRAGEM DO HISTÓRICO (DATA E HORA)
    ========================================= */
    const btnAbrirModalFiltro = document.getElementById("btnFiltrarHistorico");
    const modalFiltroEl = document.getElementById("modalFiltrarHistoricoUsuarios");
    const modalFiltro = modalFiltroEl ? bootstrap.Modal.getOrCreateInstance(modalFiltroEl) : null;
    const inputFiltroData = document.getElementById("filtroDataHistorico");
    const btnAplicarFiltro = document.getElementById("btnAplicarFiltroHistorico");

    // Elementos de Pesquisa - Ativos
    const inputPesquisaAtivos = document.getElementById("inputPesquisaAtivos");
    const btnPesquisarAtivos = document.getElementById("btnPesquisarAtivos");

    // Elementos de Pesquisa - Inativos
    const inputPesquisaInativos = document.getElementById("inputPesquisaInativos");
    const btnPesquisarInativos = document.getElementById("btnPesquisarInativos");

    /* =========================================
       EXPORTAÇÃO DE USUÁRIOS (EXCEL - MODAL)
    ========================================= */
    const btnAbrirModalExportarExcel = document.getElementById("btnAbrirModalExportarExcel");
    const modalEscolhaExportarExcelEl = document.getElementById("modalEscolhaExportarExcel");
    const modalEscolhaExportarExcel = modalEscolhaExportarExcelEl ? bootstrap.Modal.getOrCreateInstance(modalEscolhaExportarExcelEl) : null;
    const btnConfirmarExportarExcelUsuarios = document.getElementById("btnConfirmarExportarExcelUsuarios");
    const tipoExportacaoExcel = document.getElementById("tipoExportacaoExcel");

    /* =========================================
       EXPORTAÇÃO DE USUÁRIOS (PDF - MODAL)
    ========================================= */
    const btnAbrirModalExportarPdf = document.getElementById("btnAbrirModalExportarPdf");
    const modalEscolhaExportarPdfEl = document.getElementById("modalEscolhaExportarPdf");
    const modalEscolhaExportarPdf = modalEscolhaExportarPdfEl ? bootstrap.Modal.getOrCreateInstance(modalEscolhaExportarPdfEl) : null;
    const btnConfirmarExportarPdfUsuarios = document.getElementById("btnConfirmarExportarPdfUsuarios");
    const tipoExportacaoPdf = document.getElementById("tipoExportacaoPdf");

    // Variáveis de Controle de Estado
    let linhaAtivaSelecionada = null;
    let ordemHistoricoAtual = "desc";
    let filtroDataAtual = "";

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

    // Máscara automática DD/MM/AAAA para o campo de data do modal de filtro
    if (inputFiltroData) {
        inputFiltroData.addEventListener("input", function (e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 8) v = v.substring(0, 8);
            if (v.length > 4) {
                v = v.replace(/^(\d{2})(\d{2})(\d{0,4})/, "$1/$2/$3");
            } else if (v.length > 2) {
                v = v.replace(/^(\d{2})(\d{0,2})/, "$1/$2");
            }
            e.target.value = v;
        });
    }

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
            if (e.target.closest(".linha-vazia")) return;

            const linha = e.target.closest("tr.linha-usuario-ativo");
            if (!linha) return;

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
       7. CARREGAMENTO E ATUALIZAÇÃO DO HISTÓRICO
    ========================================= */
    async function carregarHistoricoUsuarios(silencioso = false, ordem = ordemHistoricoAtual, data = filtroDataAtual) {
        if (!tbodyHistorico) return;

        ordemHistoricoAtual = ordem;
        filtroDataAtual = data;

        const iconeAtualizar = btnAtualizarHistorico?.querySelector("i");

        try {
            if (btnAtualizarHistorico) btnAtualizarHistorico.disabled = true;
            if (iconeAtualizar) iconeAtualizar.classList.add("fa-spin");

            let url = `/usuarios/historico/listar/?ordem=${ordemHistoricoAtual}`;
            if (filtroDataAtual) {
                url += `&data=${encodeURIComponent(filtroDataAtual)}`;
            }

            const resposta = await fetch(url);

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

                if (!silencioso && typeof mostrarAlerta === "function") {
                    mostrarAlerta("Histórico atualizado!", "sucesso");
                }
                return;
            }

            tbodyHistorico.innerHTML = "";

            dados.historico.forEach(item => {
                const tr = document.createElement("tr");
                tr.classList.add("linha-item-historico");
                tr.setAttribute("data-historico-id", item.id);

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

            if (!silencioso && typeof mostrarAlerta === "function") {
                mostrarAlerta("Histórico de atividades atualizado com sucesso!", "sucesso");
            }

        } catch (erro) {
            console.error("Erro ao carregar histórico:", erro);
            if (typeof mostrarAlerta === "function") {
                mostrarAlerta("Não foi possível atualizar o histórico de atividades.", "erro");
            }
        } finally {
            if (btnAtualizarHistorico) btnAtualizarHistorico.disabled = false;
            if (iconeAtualizar) iconeAtualizar.classList.remove("fa-spin");
        }
    }

    if (btnAbrirHistorico && modalHistorico) {
        btnAbrirHistorico.addEventListener("click", function () {
            modalHistorico.show();
            carregarHistoricoUsuarios(true);
        });
    }

    if (btnAtualizarHistorico) {
        btnAtualizarHistorico.addEventListener("click", function () {
            carregarHistoricoUsuarios(false);
        });
    }

    /* =========================================
       8. SELEÇÃO DE ITENS (LINHA E CHECKBOX)
    ========================================= */
    function atualizarContadorHistorico() {
        if (!tbodyHistorico || !contadorSelecionados) return;
        const totalChecados = tbodyHistorico.querySelectorAll(".check-item-historico:checked").length;
        contadorSelecionados.textContent = `${totalChecados} item${totalChecados === 1 ? "" : "s"} selecionado${totalChecados === 1 ? "" : "s"}`;
    }

    function sincronizarCheckMaster() {
        if (!tbodyHistorico || !checkAllHistorico) return;
        const total = tbodyHistorico.querySelectorAll(".check-item-historico").length;
        const marcados = tbodyHistorico.querySelectorAll(".check-item-historico:checked").length;

        checkAllHistorico.checked = total > 0 && total === marcados;
        checkAllHistorico.indeterminate = marcados > 0 && marcados < total;
    }

    function desmarcarTodasLinhasHistorico() {
        if (!tbodyHistorico) return;
        tbodyHistorico.querySelectorAll("tr.linha-item-historico").forEach(tr => {
            tr.classList.remove("linha-selecionada");
            const checkbox = tr.querySelector(".check-item-historico");
            if (checkbox) checkbox.checked = false;
        });
        if (checkAllHistorico) {
            checkAllHistorico.checked = false;
            checkAllHistorico.indeterminate = false;
        }
        atualizarContadorHistorico();
    }

    // Selecionar / Desmarcar Todos via Checkbox Master
    if (checkAllHistorico && tbodyHistorico) {
        checkAllHistorico.addEventListener("change", function () {
            const linhas = tbodyHistorico.querySelectorAll("tr.linha-item-historico");
            linhas.forEach(tr => {
                const cb = tr.querySelector(".check-item-historico");
                if (cb) cb.checked = checkAllHistorico.checked;
                if (checkAllHistorico.checked) {
                    tr.classList.add("linha-selecionada");
                } else {
                    tr.classList.remove("linha-selecionada");
                }
            });
            atualizarContadorHistorico();
        });
    }

    // Clique na Tabela do Histórico
    if (tbodyHistorico) {
        tbodyHistorico.addEventListener("click", function (e) {
            const linha = e.target.closest("tr.linha-item-historico");
            if (!linha) return;

            const checkbox = linha.querySelector(".check-item-historico");
            if (!checkbox) return;

            if (!e.target.classList.contains("check-item-historico")) {
                checkbox.checked = !checkbox.checked;
            }

            if (checkbox.checked) {
                linha.classList.add("linha-selecionada");
            } else {
                linha.classList.remove("linha-selecionada");
            }

            sincronizarCheckMaster();
            atualizarContadorHistorico();
        });
    }

    /* =========================================
       9. APAGAR HISTÓRICO SELECIONADO
    ========================================= */
    if (btnApagarHistorico) {
        btnApagarHistorico.addEventListener("click", function () {
            const selecionados = tbodyHistorico?.querySelectorAll(".check-item-historico:checked");

            if (!selecionados || selecionados.length === 0) {
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Selecione pelo menos um registro para apagar.", "erro");
                } else {
                    alert("Selecione pelo menos um registro para apagar.");
                }
                return;
            }

            if (qtdHistoricoApagarModal) {
                qtdHistoricoApagarModal.textContent = `${selecionados.length} item${selecionados.length === 1 ? "" : "s"}`;
            }

            if (modalApagarHist) {
                modalApagarHist.show();
            }
        });
    }

    if (btnConfirmarApagarHistoricoDefinitivo) {
        btnConfirmarApagarHistoricoDefinitivo.addEventListener("click", async function () {
            const selecionados = tbodyHistorico?.querySelectorAll(".check-item-historico:checked");
            if (!selecionados || selecionados.length === 0) return;

            const ids = Array.from(selecionados).map(cb => parseInt(cb.value));
            const csrfToken = getCSRFToken();

            try {
                btnConfirmarApagarHistoricoDefinitivo.disabled = true;

                const resposta = await fetch("/usuarios/historico/apagar/", {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ ids: ids })
                });

                const dados = await resposta.json();

                if (!resposta.ok || !dados.sucesso) {
                    throw new Error(dados.mensagem || "Erro ao apagar histórico.");
                }

                if (modalApagarHist) modalApagarHist.hide();

                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(dados.mensagem, "sucesso");
                }

                await carregarHistoricoUsuarios(true);

            } catch (erro) {
                console.error("Erro ao apagar histórico:", erro);
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(erro.message || "Erro de comunicação ao apagar registros.", "erro");
                }
            } finally {
                btnConfirmarApagarHistoricoDefinitivo.disabled = false;
            }
        });
    }

    /* =========================================
       10. EXPORTAÇÃO DE DADOS (CSV, EXCEL, PDF)
    ========================================= */
    function obterIdsHistoricoSelecionados() {
        if (!tbodyHistorico) return [];
        const selecionados = tbodyHistorico.querySelectorAll(".check-item-historico:checked");
        return Array.from(selecionados).map(cb => cb.value);
    }

    function executarDownloadHistorico(urlBase) {
        const ids = obterIdsHistoricoSelecionados();
        let urlFinal = urlBase;

        if (ids.length > 0) {
            urlFinal += `?ids=${ids.join(",")}`;
        }

        const link = document.createElement("a");
        link.href = urlFinal;
        link.setAttribute("download", "");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (btnExportarCsvHistorico) {
        btnExportarCsvHistorico.addEventListener("click", function () {
            executarDownloadHistorico("/usuarios/historico/exportar-csv/");
            if (typeof mostrarAlerta === "function") {
                mostrarAlerta("Exportação CSV iniciada!", "sucesso");
            }
        });
    }

    if (btnExportarExcelHistorico) {
        btnExportarExcelHistorico.addEventListener("click", function () {
            executarDownloadHistorico("/usuarios/historico/exportar-excel/");
            if (typeof mostrarAlerta === "function") {
                mostrarAlerta("Exportação Excel iniciada!", "sucesso");
            }
        });
    }

    if (btnExportarPdfHistorico) {
        btnExportarPdfHistorico.addEventListener("click", function () {
            executarDownloadHistorico("/usuarios/historico/exportar-pdf/");
            if (typeof mostrarAlerta === "function") {
                mostrarAlerta("Exportação PDF iniciada!", "sucesso");
            }
        });
    }

    /* =========================================
       11. PAUSAR / ATIVAR GRAVAÇÃO
    ========================================= */
    function renderizarBadgeStatusPausa(estaPausado) {
        if (!badgeStatusPausaAtual) return;
        if (estaPausado) {
            badgeStatusPausaAtual.className = "modal-status-pausa-badge pausado";
            badgeStatusPausaAtual.innerHTML = `<i class="fa-solid fa-circle-pause"></i> Gravação pausada`;
        } else {
            badgeStatusPausaAtual.className = "modal-status-pausa-badge ativo";
            badgeStatusPausaAtual.innerHTML = `<i class="fa-solid fa-circle-check"></i> Gravando normalmente`;
        }
    }

    if (btnAbrirModalPausa && modalPausa) {
        btnAbrirModalPausa.addEventListener("click", async function () {
            try {
                const res = await fetch("/usuarios/historico/status-pausa/");
                if (res.ok) {
                    const dados = await res.json();
                    renderizarBadgeStatusPausa(dados.pausado);
                }
            } catch (err) {
                console.error("Erro ao consultar status da gravação:", err);
            }
            modalPausa.show();
        });
    }

    async function alternarStatusGravacaoHistorico(acao) {
        const csrfToken = getCSRFToken();

        try {
            if (btnSimAtivarHistorico) btnSimAtivarHistorico.disabled = true;
            if (btnNaoPausarHistorico) btnNaoPausarHistorico.disabled = true;

            const res = await fetch("/usuarios/historico/status-pausa/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ acao: acao })
            });

            const dados = await res.json();
            renderizarBadgeStatusPausa(dados.pausado);

            if (dados.ja_estava) {
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(dados.mensagem, "alerta");
                } else {
                    alert(dados.mensagem);
                }
            } else if (dados.sucesso) {
                if (modalPausa) modalPausa.hide();
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(dados.mensagem, "sucesso");
                } else {
                    alert(dados.mensagem);
                }
            } else {
                throw new Error(dados.mensagem || "Erro ao atualizar status.");
            }

        } catch (erro) {
            console.error("Erro ao alterar pausa:", erro);
            if (typeof mostrarAlerta === "function") {
                mostrarAlerta(erro.message || "Erro de comunicação com o servidor.", "erro");
            }
        } finally {
            if (btnSimAtivarHistorico) btnSimAtivarHistorico.disabled = false;
            if (btnNaoPausarHistorico) btnNaoPausarHistorico.disabled = false;
        }
    }

    if (btnSimAtivarHistorico) {
        btnSimAtivarHistorico.addEventListener("click", () => alternarStatusGravacaoHistorico("ativar"));
    }

    if (btnNaoPausarHistorico) {
        btnNaoPausarHistorico.addEventListener("click", () => alternarStatusGravacaoHistorico("pausar"));
    }

    /* =========================================
       12. ORDENAÇÃO DO HISTÓRICO
    ========================================= */
    if (btnAbrirModalOrdenar && modalOrdenar) {
        btnAbrirModalOrdenar.addEventListener("click", function () {
            if (tipoOrdenacaoHistorico) {
                tipoOrdenacaoHistorico.value = ordemHistoricoAtual;
            }
            modalOrdenar.show();
        });
    }

    if (btnExecutarOrdenacaoHistorico) {
        btnExecutarOrdenacaoHistorico.addEventListener("click", async function () {
            const direcao = tipoOrdenacaoHistorico ? tipoOrdenacaoHistorico.value : "desc";

            if (modalOrdenar) modalOrdenar.hide();

            await carregarHistoricoUsuarios(true, direcao, filtroDataAtual);

            if (typeof mostrarAlerta === "function") {
                const textoDirecao = direcao === "asc" ? "crescente (antigos primeiro)" : "decrescente (recentes primeiro)";
                mostrarAlerta(`Histórico ordenado em ordem ${textoDirecao}!`, "sucesso");
            }
        });
    }

    /* =========================================
       13. FILTRAGEM DO HISTÓRICO (DATA E HORA)
    ========================================= */
    if (btnAbrirModalFiltro && modalFiltro) {
        btnAbrirModalFiltro.addEventListener("click", function () {
            if (inputFiltroData) inputFiltroData.value = filtroDataAtual;

            const radio = document.querySelector(`input[name="filtroOrdemHora"][value="${ordemHistoricoAtual}"]`);
            if (radio) radio.checked = true;

            modalFiltro.show();
        });
    }

    if (btnAplicarFiltro) {
        btnAplicarFiltro.addEventListener("click", async function () {
            const dataVal = inputFiltroData ? inputFiltroData.value.trim() : "";
            const radioChecked = document.querySelector('input[name="filtroOrdemHora"]:checked');
            const ordemVal = radioChecked ? radioChecked.value : "desc";

            if (dataVal.length > 0 && dataVal.length < 10) {
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Preencha a data completa (DD/MM/AAAA) ou deixe em branco.", "alerta");
                }
                return;
            }

            if (modalFiltro) modalFiltro.hide();

            await carregarHistoricoUsuarios(true, ordemVal, dataVal);

            if (typeof mostrarAlerta === "function") {
                mostrarAlerta("Filtro aplicado com sucesso!", "sucesso");
            }
        });
    }

    /* =========================================
       14. CLIQUE FORA PARA DESELECIONAR
    ========================================= */
    document.addEventListener("click", function (e) {
        // Tabela de Usuários Ativos
        const clicouNaTabelaAtivos = e.target.closest("#tbodyUsuariosAtivos");
        const clicouNoBotaoSaida = e.target.closest("#btnGerarSaida");
        const clicouNoModalSaida = e.target.closest("#modalConfirmarSaida");

        if (!clicouNaTabelaAtivos && !clicouNoBotaoSaida && !clicouNoModalSaida) {
            desmarcarLinhaAtiva();
        }

        // Tabela de Histórico
        if (modalHistoricoEl?.classList.contains("show")) {
            const clicouNaLinhaHistorico = e.target.closest("#tbodyHistoricoUsuarios tr.linha-item-historico");
            const clicouNoToolbar = e.target.closest(".modal-historico-toolbar");
            const clicouNoModalConfirmacao = e.target.closest("#modalConfirmarApagarHistorico");
            const clicouNoModalPausa = e.target.closest("#modalStatusPausaHistorico");
            const clicouNoModalOrdenar = e.target.closest("#modalOrdenarHistoricoUsuarios");
            const clicouNoModalFiltro = e.target.closest("#modalFiltrarHistoricoUsuarios");

            if (
                !clicouNaLinhaHistorico &&
                !clicouNoToolbar &&
                !clicouNoModalConfirmacao &&
                !clicouNoModalPausa &&
                !clicouNoModalOrdenar &&
                !clicouNoModalFiltro
            ) {
                desmarcarTodasLinhasHistorico();
            }
        }
    });

    function limparVisualizacaoTabelas(){
        desmarcarLinhaAtiva();

        // Template de placeholder para tabela vazia de usuários ativos
        if (tbodyAtivos) {
            tbodyAtivos.innerHTML = `
                <tr class="linha-vazia">
                    <td colspan="21" class="text-center py-4" style="color: #cbd5e1 !important;">
                        <i class="fa-solid fa-user-slash fa-2x mb-2 d-block" style="color: #cbd5e1 !important;"></i>
                        <span style="color: #cbd5e1 !important;">Nenhum usuário ativo exibido no momento.</span>
                    </td>
                </tr>
            `;
        }
        // Template de placeholder para tabela vazia de usuários inativos
        if (tbodyInativos) {
            tbodyInativos.innerHTML = `
                <tr class="linha-vazia">
                    <td colspan="22" class="text-center py-4" style="color: #cbd5e1 !important;">
                        <i class="fa-solid fa-user-slash fa-2x mb-2 d-block" style="color: #cbd5e1 !important;"></i>
                        <span style="color: #cbd5e1 !important;">Nenhum usuário inativo exibido no momento.</span>
                    </td>
                </tr>
            `;
        }

        // Alerta de confirmação da ação na interface
        if (typeof mostrarAlerta === "function") {
            mostrarAlerta("Tabelas limpas com sucesso!", "sucesso");
        }
    }

    if (btnLimparTabelas) {
        btnLimparTabelas.addEventListener("click", limparVisualizacaoTabelas);
    }

    /* =========================================
       PESQUISA DINÂMICA NAS TABELAS
    ========================================= */
    function normalizarTexto(texto) {
        return (texto || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function filtrarTabela(tbody, termoPesquisa, colunasTotal, tipoNome) {
        if (!tbody) return;
        const termo = normalizarTexto(termoPesquisa);
        const linhas = tbody.querySelectorAll("tr:not(.linha-vazia):not(.linha-sem-busca)");
        let encontrados = 0;

        // Se a tabela já estiver no estado de "Limpar Tabelas" ou vazia originalmente
        if (tbody.querySelectorAll(".linha-vazia, .sem-registros-verificar-usuarios").length > 0) {
            return;
        }

        linhas.forEach(linha => {
            const conteudoLinha = normalizarTexto(linha.textContent);
            if (conteudoLinha.includes(termo)) {
                linha.style.display = "";
                encontrados++;
            } else {
                linha.style.display = "none";
                if (linha.classList.contains("linha-selecionada")) {
                    desmarcarLinhaAtiva();
                }
            }
        });

        // Trata feedback de nenhum resultado encontrado na busca
        const linhaExistenteAviso = tbody.querySelector(".linha-sem-busca");
        if (encontrados === 0 && termo !== "") {
            if (!linhaExistenteAviso) {
                const tr = document.createElement("tr");
                tr.className = "linha-sem-busca";
                tr.innerHTML = `
                    <td colspan="${colunasTotal}" class="text-center py-4" style="color: #cbd5e1 !important;">
                        <i class="fa-solid fa-magnifying-glass fa-2x mb-2 d-block" style="color: #cbd5e1 !important;"></i>
                        <span style="color: #cbd5e1 !important;">Nenhum usuário ${tipoNome} corresponde à sua busca "${termoPesquisa}".</span>
                    </td>
                `;
                tbody.appendChild(tr);
            }
        } else if (linhaExistenteAviso) {
            linhaExistenteAviso.remove();
        }
    }

    if (inputPesquisaAtivos) {
        inputPesquisaAtivos.addEventListener("input", () => {
            filtrarTabela(tbodyAtivos, inputPesquisaAtivos.value, 21, "ativo");
        });
    }
    if (btnPesquisarAtivos) {
        btnPesquisarAtivos.addEventListener("click", () => {
            filtrarTabela(tbodyAtivos, inputPesquisaAtivos?.value || "", 21, "ativo");
        });
    }


    if (inputPesquisaInativos) {
        inputPesquisaInativos.addEventListener("input", () => {
            filtrarTabela(tbodyInativos, inputPesquisaInativos.value, 22, "inativo");
        });
    }
    if (btnPesquisarInativos) {
        btnPesquisarInativos.addEventListener("click", () => {
            filtrarTabela(tbodyInativos, inputPesquisaInativos?.value || "", 22, "inativo");
        });
    }

    if (btnAbrirModalExportarExcel && modalEscolhaExportarExcel) {
        btnAbrirModalExportarExcel.addEventListener("click", function () {
            modalEscolhaExportarExcel.show();
        });
    }

    if (btnConfirmarExportarExcelUsuarios) {
        btnConfirmarExportarExcelUsuarios.addEventListener("click", function () {
            const tipo = tipoExportacaoExcel ? tipoExportacaoExcel.value : "todos";

            if (modalEscolhaExportarExcel) {
                modalEscolhaExportarExcel.hide();
            }

            const link = document.createElement("a");
            link.href = `/usuarios/exportar-excel/?tipo=${tipo}`;
            link.setAttribute("download", "");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (typeof mostrarAlerta === "function") {
                mostrarAlerta("Exportação de usuários iniciada com sucesso!", "sucesso");
            }
        });
    }

    if (btnAbrirModalExportarPdf && modalEscolhaExportarPdf) {
        btnAbrirModalExportarPdf.addEventListener("click", function () {
            modalEscolhaExportarPdf.show();
        });
    }

    if (btnConfirmarExportarPdfUsuarios) {
        btnConfirmarExportarPdfUsuarios.addEventListener("click", function () {
            const tipo = tipoExportacaoPdf ? tipoExportacaoPdf.value : "todos";

            if (modalEscolhaExportarPdf) {
                modalEscolhaExportarPdf.hide();
            }

            const link = document.createElement("a");
            link.href = `/usuarios/exportar-pdf/?tipo=${tipo}`;
            link.setAttribute("download", "");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (typeof mostrarAlerta === "function") {
                mostrarAlerta("Exportação de PDF iniciada com sucesso!", "sucesso");
            }
        });
    }
    
});
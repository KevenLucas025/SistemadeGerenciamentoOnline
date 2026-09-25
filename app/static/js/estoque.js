document.addEventListener("DOMContentLoaded", function () {


    const btnLimparTabelasEstoque = document.getElementById("btnLimparTabelasEstoque");
    const btnAtualizarEstoque = document.getElementById("btnAtualizarEstoque");
    const btnAtualizarSaida = document.getElementById("btnAtualizarSaida");
    const tbodyEstoque = document.getElementById("tbodyEstoqueProdutos");
    const tbodySaidas = document.getElementById("tbodyEstoqueSaidas");

    // Modal e Ações: Gerar Saída
    const btnGerarSaidaEstoque = document.getElementById("btnGerarSaidaEstoque");
    const modalSaidaEl = document.getElementById("modalConfirmarSaidaEstoque");
    const modalSaida = modalSaidaEl ? bootstrap.Modal.getOrCreateInstance(modalSaidaEl) : null;
    const nomeProdutoModal = document.getElementById("nomeProdutoSaidaModal");
    const qtdDisponivelSaidaModal = document.getElementById("qtdDisponivelSaidaModal");
    const inputQtdSaida = document.getElementById("inputQtdSaida");
    const erroQtdSaida = document.getElementById("erroQtdSaida");
    const btnConfirmarSaidaDefinitiva = document.getElementById("btnConfirmarSaidaEstoqueDefinitiva");

    // Modal e Ações: Gerar Estorno
    const btnGerarEstorno = document.getElementById("btnGerarEstorno");
    const modalEstornoEl = document.getElementById("modalConfirmarEstornoEstoque");
    const modalEstorno = modalEstornoEl ? bootstrap.Modal.getOrCreateInstance(modalEstornoEl) : null;
    const nomeProdutoEstornoModal = document.getElementById("nomeProdutoEstornoModal");
    const qtdDisponivelEstornoModal = document.getElementById("qtdDisponivelEstornoModal");
    const inputQtdEstorno = document.getElementById("inputQtdEstorno");
    const erroQtdEstorno = document.getElementById("erroQtdEstorno");
    const btnConfirmarEstornoDefinitivo = document.getElementById("btnConfirmarEstornoEstoqueDefinitiva");

    // Modal e Ações: Histórico
    const btnHistoricoEstoque = document.getElementById("btnHistoricoEstoque");
    const modalHistoricoProdutosEl = document.getElementById("modalHistoricoProdutos");
    const modalHistoricoProdutos = modalHistoricoProdutosEl 
        ? bootstrap.Modal.getOrCreateInstance(modalHistoricoProdutosEl) 
        : null;
    const tbodyyHistoricoProdutos = document.getElementById("tbodyHistoricoProdutos");
    const btnAtualizarHistorico = document.getElementById("btnAtualizarHistoricoProdutos");

    /* =====================================================
       HISTÓRICO DE PRODUTOS — SELEÇÃO E EXCLUSÃO
    ===================================================== */
    const checkboxMasterHistorico = document.getElementById("checkboxMasterHistoricoProdutos");
    const btnApagarHistorico = document.querySelector(".btn-historico-produtos-perigo");
    const modalExclusaoHistoricoEl = document.getElementById("modalConfirmarExclusaoHistorico");
    const modalExclusaoHistorico = modalExclusaoHistoricoEl 
        ? bootstrap.Modal.getOrCreateInstance(modalExclusaoHistoricoEl) 
        : null;
    const textoConfirmacaoExclusao = document.getElementById("textoConfirmacaoExclusaoHistorico");
    const btnConfirmarExclusaoHistoricoDefinitiva = document.getElementById("btnConfirmarExclusaoHistoricoDefinitiva");
    const contadorSelecionadosEl = document.querySelector(".contador-selecionados-historico-produtos");

    // Gerar Excel, CSV e PDF
    const btnExportarHistóricoCSVProdutos = document.getElementById("btnExportarCsvHistoricoProdutos");
    const btnExportarHistoricoExcelProdutos = document.getElementById("btnExportarExcelHistoricoProdutos");
    const btnExportarHistoricoPDFProdutos = document.getElementById("btnExportarPdfHistoricoProdutos");

    // Controle de Pausa/Ativação da Gravação do Histórico de Produtos
    const btnPausarHistoricoProdutos = document.getElementById("btnPausarHistoricoProdutos");
    const modalPausaProdutosEl = document.getElementById("modalStatusPausaHistoricoProdutos");
    const modalPausaProdutos = modalPausaProdutosEl ? bootstrap.Modal.getOrCreateInstance(modalPausaProdutosEl) : null;
    const badgeStatusPausaAtualProdutos = document.getElementById("badgeStatusPausaAtualProdutos");
    const btnNaoPausarHistoricoProdutos = document.getElementById("btnNaoPausarHistoricoProdutos");
    const btnSimAtivarHistoricoProdutos = document.getElementById("btnSimAtivarHistoricoProdutos");

    /* =========================================
       FILTRAGEM DO HISTÓRICO (DATA E HORA)
    ========================================= */
    const btnAbrirModalFiltroProdutos = document.getElementById("btnFiltrarHistoricoProdutos");
    const modalFiltroProdutosEl = document.getElementById("modalFiltrarHistoricoProdutos");
    const modalFiltroProdutos = modalFiltroProdutosEl ? bootstrap.Modal.getOrCreateInstance(modalFiltroProdutosEl) : null;
    const inputFiltroDataProdutos = document.getElementById("filtroDataHistoricoProdutos");
    const btnAplicarFiltroprodutos = document.getElementById("btnAplicarFiltroHistoricoProdutos");

    /* =========================================
       ORDENAÇÃO DO HISTÓRICO
    ========================================= */
    const btnAbrirModalOrdenarProdutos = document.getElementById("btnOrdenarHistoricoProdutos");
    const modalOrdenarProdutosEl = document.getElementById("modalOrdenarHistoricoProdutos");
    const modalOrdenarProdutos = modalOrdenarProdutosEl ? bootstrap.Modal.getOrCreateInstance(modalOrdenarProdutosEl) : null;
    const btnExecutarOrdenacaoProdutosHistoricos = document.getElementById("btnExecutarOrdenacaoHistoricoProdutos");
    const tipoOrdenacaoHistoricoProdutos = document.getElementById("tipoOrdenacaoHistoricoProdutos");

    const btnProdutoExportarExcel = document.getElementById('btnExportarProdutosExcel');

    // Variáveis de seleção e controle em memória
    let itemEstoqueSelecionado = null; // { id, nome, codigo, quantidade }
    let itemSaidaSelecionado = null;   // { id, nome, codigo, quantidade }
    let historicoProdutosPausado = false; // Estado inicial
    let filtroDataAtualProdutos = "";
    let ordemHistoricoAtualProdutos = "desc";

    function getCSRFToken() {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
            const [nome, valor] = cookie.trim().split("=");
            if (nome === "csrftoken") return decodeURIComponent(valor);
        }
        return document.querySelector("[name=csrfmiddlewaretoken]")?.value || "";
    }

    function extrairNumero(texto) {
        if (!texto) return 1;
        const apenasNum = texto.replace(/\D/g, "");
        return apenasNum ? parseInt(apenasNum, 10) : 1;
    }

    /* =========================================
       SELEÇÃO DE LINHAS (ESTOQUE E SAÍDA)
    ========================================= */
    function desmarcarEstoque() {
        if (tbodyEstoque) {
            tbodyEstoque.querySelectorAll("tr").forEach(tr => tr.classList.remove("linha-selecionada"));
        }
        itemEstoqueSelecionado = null;
    }

    function desmarcarSaida() {
        if (tbodySaidas) {
            tbodySaidas.querySelectorAll("tr").forEach(tr => tr.classList.remove("linha-selecionada"));
        }
        itemSaidaSelecionado = null;
    }

    // Clique na Tabela de Estoque
    if (tbodyEstoque) {
        tbodyEstoque.addEventListener("click", function (e) {
            const linha = e.target.closest("tr");
            if (!linha || linha.classList.contains("linha-vazia") || linha.querySelector(".sem-registros")) {
                return;
            }

            const id = linha.getAttribute("data-produto-id");

            if (linha.classList.contains("linha-selecionada")) {
                desmarcarEstoque();
                return;
            }

            desmarcarEstoque();
            desmarcarSaida();

            linha.classList.add("linha-selecionada");

            // Coluna 0: ID | Coluna 1: Nome | Coluna 2: Quantidade
            const colunas = linha.querySelectorAll("td");
            const nome = colunas[1]?.textContent.trim() || "Produto";
            const qtd = extrairNumero(colunas[2]?.textContent);

            itemEstoqueSelecionado = {
                id: id,
                nome: nome,
                codigo: linha.getAttribute("data-codigo") || "—",
                quantidade: qtd
            };

            console.log(">>> Produto selecionado para SAÍDA:", itemEstoqueSelecionado);
        });
    }

    // Clique na Tabela de Saída (para Estorno)
    if (tbodySaidas) {
        tbodySaidas.addEventListener("click", function (e) {
            const linha = e.target.closest("tr");
            if (!linha || linha.classList.contains("linha-vazia") || linha.querySelector(".sem-registros")) {
                return;
            }

            const id = linha.getAttribute("data-produto-id") || linha.getAttribute("data-saida-id");

            if (linha.classList.contains("linha-selecionada")) {
                desmarcarSaida();
                return;
            }

            desmarcarSaida();
            desmarcarEstoque();

            linha.classList.add("linha-selecionada");

            const colunas = linha.querySelectorAll("td");
            const nome = colunas[1]?.textContent.trim() || "Produto";
            const qtd = extrairNumero(colunas[2]?.textContent);

            itemSaidaSelecionado = {
                id: id,
                nome: nome,
                codigo: linha.getAttribute("data-codigo") || "—",
                quantidade: qtd
            };

            console.log(">>> Produto selecionado para ESTORNO:", itemSaidaSelecionado);
        });
    }

    /* =========================================
       CLIQUE FORA DAS TABELAS
    ========================================= */
    document.addEventListener("click", function (e) {
        if (e.target.closest("#tbodyEstoqueProdutos") || e.target.closest("#tbodyEstoqueSaidas")) return;
        if (e.target.closest("#btnGerarSaidaEstoque") || e.target.closest("#btnGerarEstorno")) return;
        if (e.target.closest(".btn-side-action")) return;
        if (e.target.closest(".modal") || e.target.closest(".modal-backdrop")) return;

        desmarcarEstoque();
        desmarcarSaida();
    });

    /* =========================================
       FLUXO: GERAR SAÍDA
    ========================================= */
    // 1. Abertura do Modal de Saída
    if (btnGerarSaidaEstoque) {
        btnGerarSaidaEstoque.addEventListener("click", function (e) {
            e.stopPropagation();

            if (!itemEstoqueSelecionado || !itemEstoqueSelecionado.id) {
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Selecione um produto da tabela de estoque clicando na linha dele.", "alerta");
                } else {
                    alert("Selecione um produto da tabela de estoque.");
                }
                return;
            }

            if (nomeProdutoModal) nomeProdutoModal.textContent = itemEstoqueSelecionado.nome;
            if (qtdDisponivelSaidaModal) qtdDisponivelSaidaModal.textContent = itemEstoqueSelecionado.quantidade;

            if (inputQtdSaida) {
                inputQtdSaida.max = itemEstoqueSelecionado.quantidade;
                inputQtdSaida.value = 1;
            }

            if (erroQtdSaida) erroQtdSaida.classList.add("d-none");

            if (modalSaida) modalSaida.show();
        });
    }

    // 2. Confirmação Definitiva da Saída
    if (btnConfirmarSaidaDefinitiva) {
        btnConfirmarSaidaDefinitiva.addEventListener("click", async function () {
            if (!itemEstoqueSelecionado || !itemEstoqueSelecionado.id) {
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Nenhum produto selecionado para saída.", "alerta");
                }
                return;
            }

            const qtd = inputQtdSaida ? parseInt(inputQtdSaida.value, 10) : 1;
            if (!qtd || qtd <= 0 || qtd > itemEstoqueSelecionado.quantidade) {
                if (erroQtdSaida) {
                    erroQtdSaida.textContent = `A quantidade deve ser entre 1 e ${itemEstoqueSelecionado.quantidade}.`;
                    erroQtdSaida.classList.remove("d-none");
                }
                return;
            }

            const csrfToken = getCSRFToken();

            try {
                btnConfirmarSaidaDefinitiva.disabled = true;

                const resposta = await fetch(`/estoque/gerar-saida/${itemEstoqueSelecionado.id}/`, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ quantidade: qtd })
                });

                const texto = await resposta.text();
                let dados;
                try {
                    dados = JSON.parse(texto);
                } catch (e) {
                    console.error("Resposta do servidor não é JSON:", texto);
                    throw new Error("Erro de comunicação ou resposta inesperada do servidor.");
                }

                if (!resposta.ok || !dados.sucesso) {
                    throw new Error(dados.mensagem || "Erro ao processar saída.");
                }

                if (modalSaida) modalSaida.hide();

                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(dados.mensagem, "sucesso");
                }

                desmarcarEstoque();
                await atualizarTabela("estoque", null, tbodyEstoque, true);
                await atualizarTabela("saida", null, tbodySaidas, true);
                carregarHistoricoProdutos(true);

            } catch (erro) {
                console.error("Erro ao gerar saída:", erro);
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(erro.message, "erro");
                } else {
                    alert(erro.message);
                }
            } finally {
                btnConfirmarSaidaDefinitiva.disabled = false;
            }
        });
    }

    /* =========================================
       FLUXO: GERAR ESTORNO
    ========================================= */
    // 1. Abertura do Modal de Estorno
    if (btnGerarEstorno) {
        btnGerarEstorno.addEventListener("click", function (e) {
            e.stopPropagation();

            if (!itemSaidaSelecionado || !itemSaidaSelecionado.id) {
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Selecione um produto da tabela de saída clicando na linha dele.", "alerta");
                } else {
                    alert("Selecione um produto da tabela de saída.");
                }
                return;
            }

            if (nomeProdutoEstornoModal) nomeProdutoEstornoModal.textContent = itemSaidaSelecionado.nome;
            if (qtdDisponivelEstornoModal) qtdDisponivelEstornoModal.textContent = itemSaidaSelecionado.quantidade;

            if (inputQtdEstorno) {
                inputQtdEstorno.max = itemSaidaSelecionado.quantidade;
                inputQtdEstorno.value = 1;
            }

            if (erroQtdEstorno) erroQtdEstorno.classList.add("d-none");

            if (modalEstorno) modalEstorno.show();
        });
    }

    // 2. Confirmação Definitiva do Estorno
    if (btnConfirmarEstornoDefinitivo) {
        btnConfirmarEstornoDefinitivo.addEventListener("click", async function () {
            if (!itemSaidaSelecionado || !itemSaidaSelecionado.id) {
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Nenhum produto selecionado para estorno.", "alerta");
                }
                return;
            }

            const qtd = inputQtdEstorno ? parseInt(inputQtdEstorno.value, 10) : 1;
            if (!qtd || qtd <= 0 || qtd > itemSaidaSelecionado.quantidade) {
                if (erroQtdEstorno) {
                    erroQtdEstorno.textContent = `A quantidade deve ser entre 1 e ${itemSaidaSelecionado.quantidade}.`;
                    erroQtdEstorno.classList.remove("d-none");
                }
                return;
            }

            const csrfToken = getCSRFToken();

            try {
                btnConfirmarEstornoDefinitivo.disabled = true;

                const resposta = await fetch(`/estoque/gerar-estorno/${itemSaidaSelecionado.id}/`, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ quantidade: qtd })
                });

                const texto = await resposta.text();
                let dados;
                try {
                    dados = JSON.parse(texto);
                } catch (e) {
                    console.error("Resposta do servidor não é JSON:", texto);
                    throw new Error("Erro de comunicação ou resposta inesperada do servidor.");
                }

                if (!resposta.ok || !dados.sucesso) {
                    throw new Error(dados.mensagem || "Erro ao processar estorno.");
                }

                if (modalEstorno) modalEstorno.hide();

                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(dados.mensagem, "sucesso");
                }

                desmarcarSaida();
                await atualizarTabela("estoque", null, tbodyEstoque, true);
                await atualizarTabela("saida", null, tbodySaidas, true);
                carregarHistoricoProdutos(true);

            } catch (erro) {
                console.error("Erro no estorno:", erro);
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(erro.message, "erro");
                } else {
                    alert(erro.message);
                }
            } finally {
                btnConfirmarEstornoDefinitivo.disabled = false;
            }
        });
    }

    /* =========================================
       ATUALIZAÇÃO ASSÍNCRONA DAS TABELAS
    ========================================= */
    async function atualizarTabela(tipo, botao, tbody, silencioso = false) {
        if (!tbody) return;
        const icone = botao ? botao.querySelector("i") : null;

        try {
            if (botao) botao.disabled = true;
            if (icone) icone.classList.add("fa-spin");

            const resposta = await fetch(`/estoque/atualizar-status/?tipo=${tipo}`);
            if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);

            const dados = await resposta.json();

            if (dados.sucesso) {
                tbody.innerHTML = dados.html;
                if (tipo === "estoque") desmarcarEstoque();
                if (tipo === "saida") desmarcarSaida();

                if (!silencioso && typeof mostrarAlerta === "function") {
                    const nome = tipo === "estoque" ? "estoque" : "saída";
                    mostrarAlerta(`Tabela de ${nome} atualizada com sucesso!`, "sucesso");
                }
            } else {
                throw new Error(dados.mensagem || "Erro ao atualizar dados.");
            }
        } catch (erro) {
            console.error(`Erro ao atualizar tabela de ${tipo}:`, erro);
            if (!silencioso && typeof mostrarAlerta === "function") {
                mostrarAlerta(`Não foi possível atualizar a tabela de ${tipo}.`, "erro");
            }
        } finally {
            if (botao) botao.disabled = false;
            if (icone) icone.classList.remove("fa-spin");
        }
    }

    if (btnAtualizarEstoque) {
        btnAtualizarEstoque.addEventListener("click", () => atualizarTabela("estoque", btnAtualizarEstoque, tbodyEstoque, false));
    }

    if (btnAtualizarSaida) {
        btnAtualizarSaida.addEventListener("click", () => atualizarTabela("saida", btnAtualizarSaida, tbodySaidas, false));
    }

    /* =========================================
       HISTÓRICO DE PRODUTOS (CARREGAR E ATUALIZAR)
    ========================================= */
    async function carregarHistoricoProdutos(silencioso = true, ordem = null, data = null) {
        if (!tbodyyHistoricoProdutos) return;

        // Atualiza as variáveis de escopo se vierem informadas
        if (ordem !== null) {
            ordemHistoricoAtualProdutos = ordem;
        }
        if (data !== null) {
            filtroDataAtualProdutos = data;
        }

        const icone = btnAtualizarHistorico ? btnAtualizarHistorico.querySelector("i") : null;
        const contadorHistorico = document.getElementById("contadorTotalHistoricoProdutos") || 
                                 document.querySelector(".contador-selecionados-historico-produtos");

        try {
            if (btnAtualizarHistorico) btnAtualizarHistorico.disabled = true;
            if (icone) icone.classList.add("fa-spin");

            let url = `/estoque/historico/listar/?ordem=${ordemHistoricoAtualProdutos || "desc"}`;
            if (filtroDataAtualProdutos) {
                url += `&data=${encodeURIComponent(filtroDataAtualProdutos)}`;
            }

            const resposta = await fetch(url);
            const dados = await resposta.json();

            if (dados.sucesso) {
                tbodyyHistoricoProdutos.innerHTML = dados.html;

                if (contadorHistorico && dados.total !== undefined) {
                    contadorHistorico.textContent = `${dados.total} registro(s) encontrado(s)`;
                }

                if (checkboxMasterHistorico) {
                    checkboxMasterHistorico.checked = false;
                    checkboxMasterHistorico.indeterminate = false;
                }

                if (!silencioso && typeof mostrarAlerta === "function") {
                    mostrarAlerta("Histórico de movimentações atualizado com sucesso!", "sucesso");
                }
            } else {
                throw new Error(dados.mensagem || "Não foi possível carregar os registros do histórico.");
            }
        } catch (erro) {
            console.error("Erro ao carregar histórico:", erro);
            if (!silencioso && typeof mostrarAlerta === "function") {
                mostrarAlerta(erro.message || "Erro ao atualizar histórico.", "erro");
            }
        } finally {
            if (btnAtualizarHistorico) btnAtualizarHistorico.disabled = false;
            if (icone) icone.classList.remove("fa-spin");
        }
    }

    // 1. Abre o modal e carrega os dados
    if (btnHistoricoEstoque && modalHistoricoProdutos) {
        btnHistoricoEstoque.addEventListener("click", function (e) {
            e.stopPropagation();
            modalHistoricoProdutos.show();
            carregarHistoricoProdutos(true);
        });
    }

    // 2. Clique manual no botão de atualizar na toolbar
    if (btnAtualizarHistorico) {
        btnAtualizarHistorico.addEventListener("click", function (e) {
            e.preventDefault();
            carregarHistoricoProdutos(false);
        });
    }

    // Retorna lista com os IDs selecionados
    function getIdsHistoricoSelecionados() {
        if (!tbodyyHistoricoProdutos) return [];
        const checkboxes = tbodyyHistoricoProdutos.querySelectorAll(".checkbox-item-historico-produtos:checked");
        return Array.from(checkboxes).map(cb => cb.value);
    }

    // Atualiza o contador de selecionados no rodapé do modal
    function atualizarContadorHistorico() {
        const totalSelecionados = getIdsHistoricoSelecionados().length;
        if (contadorSelecionadosEl) {
            if (totalSelecionados === 0) {
                const totalLinhas = tbodyyHistoricoProdutos.querySelectorAll("tr.linha-item-historico-produto").length;
                contadorSelecionadosEl.textContent = `${totalLinhas} registro(s) no total`;
            } else if (totalSelecionados === 1) {
                contadorSelecionadosEl.textContent = "1 item selecionado";
            } else {
                contadorSelecionadosEl.textContent = `${totalSelecionados} itens selecionados`;
            }
        }
    }

    // 1. Marcar/Desmarcar Todos ao clicar no Checkbox Master
    if (checkboxMasterHistorico) {
        checkboxMasterHistorico.indeterminate = false;

        checkboxMasterHistorico.addEventListener("click", function () {
            const marcadosAntes = tbodyyHistoricoProdutos.querySelectorAll(".checkbox-item-historico-produtos:checked").length;
            const marcar = (marcadosAntes === 0);

            this.checked = marcar;

            tbodyyHistoricoProdutos.querySelectorAll("tr.linha-item-historico-produto").forEach(tr => {
                const cb = tr.querySelector(".checkbox-item-historico-produtos");
                if (cb) {
                    cb.checked = marcar;
                    if (marcar) {
                        tr.classList.add("linha-selecionada-historico");
                    } else {
                        tr.classList.remove("linha-selecionada-historico");
                    }
                }
            });

            atualizarContadorHistorico();
        });
    }

    // 2. Clique nas Linhas ou Checkboxes Individuais da Tabela de Histórico
    if (tbodyyHistoricoProdutos) {
        tbodyyHistoricoProdutos.addEventListener("click", function (e) {
            const tr = e.target.closest("tr.linha-item-historico-produto");
            if (!tr) return;

            const checkbox = tr.querySelector(".checkbox-item-historico-produtos");
            if (!checkbox) return;

            if (!e.target.classList.contains("checkbox-item-historico-produtos")) {
                checkbox.checked = !checkbox.checked;
            }

            if (checkbox.checked) {
                tr.classList.add("linha-selecionada-historico");
            } else {
                tr.classList.remove("linha-selecionada-historico");
            }

            const marcados = tbodyyHistoricoProdutos.querySelectorAll(".checkbox-item-historico-produtos:checked").length;
            
            if (checkboxMasterHistorico) {
                checkboxMasterHistorico.indeterminate = false;
                checkboxMasterHistorico.checked = (marcados > 0);
            }

            atualizarContadorHistorico();
        });
    }

    // 3. Clique no Botão "Apagar" da Barra de Ferramentas
    if (btnApagarHistorico) {
        btnApagarHistorico.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();

            const selecionados = getIdsHistoricoSelecionados();

            if (selecionados.length === 0) {
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Selecione pelo menos um histórico para apagar.", "alerta");
                } else {
                    alert("Selecione pelo menos um histórico clicando na linha ou marcando a caixa de seleção.");
                }
                return;
            }

            if (selecionados.length === 1) {
                textoConfirmacaoExclusao.innerHTML = "Deseja realmente apagar somente este histórico?";
            } else {
                textoConfirmacaoExclusao.innerHTML = `Deseja realmente apagar os ${selecionados.length} históricos selecionados?`;
            }

            if (modalExclusaoHistorico) {
                modalExclusaoHistorico.show();
            }
        });
    }

    // 4. Confirmação Definitiva da Exclusão
    if (btnConfirmarExclusaoHistoricoDefinitiva) {
        btnConfirmarExclusaoHistoricoDefinitiva.addEventListener("click", async function () {
            const ids = getIdsHistoricoSelecionados();
            if (ids.length === 0) return;

            const csrfToken = getCSRFToken();

            try {
                btnConfirmarExclusaoHistoricoDefinitiva.disabled = true;

                const resposta = await fetch('/estoque/historico/apagar/', {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ ids: ids })
                });

                const texto = await resposta.text();
                let dados;
                try {
                    dados = JSON.parse(texto);
                } catch (err) {
                    console.error("Resposta inválida ao apagar:", texto);
                    throw new Error("Erro no servidor ao processar exclusão.");
                }

                if (!resposta.ok || !dados.sucesso) {
                    throw new Error(dados.mensagem || "Não foi possível apagar os registros.");
                }

                if (modalExclusaoHistorico) {
                    modalExclusaoHistorico.hide();
                }

                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(dados.mensagem, "sucesso");
                }

                if (checkboxMasterHistorico) {
                    checkboxMasterHistorico.checked = false;
                    checkboxMasterHistorico.indeterminate = false;
                }

                await carregarHistoricoProdutos(true);

            } catch (erro) {
                console.error("Erro ao apagar histórico:", erro);
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(erro.message, "erro");
                } else {
                    alert(erro.message);
                }
            } finally {
                btnConfirmarExclusaoHistoricoDefinitiva.disabled = false;
            }
        });
    }

    function obterIdsHistoricoProdutosSelecionados() {
        if (!tbodyyHistoricoProdutos) return [];
        const selecionados = tbodyyHistoricoProdutos.querySelectorAll(".checkbox-item-historico-produtos:checked");
        return Array.from(selecionados).map(cb => cb.value);
    }

    function executarDownloadHistoricoProdutos(urlBase) {
        const ids = obterIdsHistoricoProdutosSelecionados();
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

    if (btnExportarHistóricoCSVProdutos) {
        btnExportarHistóricoCSVProdutos.addEventListener("click", function () {
            executarDownloadHistoricoProdutos("/estoque/historico/exportar-csv-produtos/");
            if (typeof mostrarAlerta === "function") {
                mostrarAlerta("Exportação CSV iniciada!", "sucesso");
            }
        });
    }

    if (btnExportarHistoricoExcelProdutos) {
        btnExportarHistoricoExcelProdutos.addEventListener("click", function () {
            executarDownloadHistoricoProdutos("/estoque/historico/exportar-excel-produtos/");
            if (typeof mostrarAlerta === "function") {
                mostrarAlerta("Exportação Excel iniciada!", "sucesso");
            }
        });
    }

    if (btnExportarHistoricoPDFProdutos) {
        btnExportarHistoricoPDFProdutos.addEventListener("click", function () {
            executarDownloadHistoricoProdutos("/estoque/historico/exportar-pdf-produtos/");
            if (typeof mostrarAlerta === "function") {
                mostrarAlerta("Exportação PDF iniciada!", "sucesso");
            }
        });
    }

    /* =====================================================
       CONTROLE DE PAUSA/ATIVAÇÃO DO HISTÓRICO DE PRODUTOS
    ===================================================== */
    const URL_STATUS_PAUSA_PRODUTOS = "/estoque/historico/status-pausa-produtos/";

    function atualizarBadgeStatusProdutos(pausado) {
        if (!badgeStatusPausaAtualProdutos) return;

        if (pausado) {
            badgeStatusPausaAtualProdutos.className = "modal-status-pausa-produtos-badge pausado";
            badgeStatusPausaAtualProdutos.innerHTML = '<i class="fa-solid fa-circle-pause"></i> Gravação pausada';
        } else {
            badgeStatusPausaAtualProdutos.className = "modal-status-pausa-produtos-badge ativo";
            badgeStatusPausaAtualProdutos.innerHTML = '<i class="fa-solid fa-circle-check"></i> Gravando normalmente';
        }

        const textoStatusBtn = document.getElementById("textoStatusPausaHistoricoProdutos");
        const iconeBtn = btnPausarHistoricoProdutos ? btnPausarHistoricoProdutos.querySelector("i") : null;
        if (textoStatusBtn && iconeBtn) {
            if (pausado) {
                textoStatusBtn.textContent = "Ativar histórico";
                iconeBtn.className = "fa-solid fa-play";
            } else {
                textoStatusBtn.textContent = "Pausar histórico";
                iconeBtn.className = "fa-solid fa-pause";
            }
        }
    }

    async function verificarStatusPausaInicial() {
        try {
            const resposta = await fetch(URL_STATUS_PAUSA_PRODUTOS);
            if (!resposta.ok) return;
            const dados = await resposta.json();
            if (dados.sucesso) {
                historicoProdutosPausado = dados.pausado;
                atualizarBadgeStatusProdutos(historicoProdutosPausado);
            }
        } catch (erro) {
            console.error("Erro ao verificar status do histórico:", erro);
        }
    }

    if (btnPausarHistoricoProdutos && modalPausaProdutos) {
        btnPausarHistoricoProdutos.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            atualizarBadgeStatusProdutos(historicoProdutosPausado);
            modalPausaProdutos.show();
        });
    }

    async function alternarPausaHistoricoProdutos(pausar) {
        const acaoDesejada = pausar ? "pausar" : "ativar";
        const csrfToken = getCSRFToken();

        try {
            const resposta = await fetch(URL_STATUS_PAUSA_PRODUTOS, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken
                },
                body: JSON.stringify({ acao: acaoDesejada })
            });

            const texto = await resposta.text();
            let dados;
            try {
                dados = JSON.parse(texto);
            } catch (e) {
                console.error("Resposta inválida do servidor:", texto);
                throw new Error("Erro de comunicação com o servidor.");
            }

            if (modalPausaProdutos) {
                modalPausaProdutos.hide();
            }

            if (dados.sucesso) {
                historicoProdutosPausado = dados.pausado;
                atualizarBadgeStatusProdutos(historicoProdutosPausado);

                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(dados.mensagem, "sucesso");
                }
            } else if (dados.ja_estava) {
                historicoProdutosPausado = dados.pausado;
                atualizarBadgeStatusProdutos(historicoProdutosPausado);

                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(dados.mensagem, "alerta");
                }
            } else {
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(dados.mensagem || "Não foi possível alterar o status.", "erro");
                } else {
                    alert(dados.mensagem);
                }
            }
        } catch (err) {
            console.error("Erro na requisição:", err);
            if (typeof mostrarAlerta === "function") {
                mostrarAlerta(err.message || "Erro de comunicação.", "erro");
            } else {
                alert("Erro de comunicação com o servidor.");
            }
        }
    }

    if (btnNaoPausarHistoricoProdutos) {
        btnNaoPausarHistoricoProdutos.addEventListener("click", () => alternarPausaHistoricoProdutos(true));
    }

    if (btnSimAtivarHistoricoProdutos) {
        btnSimAtivarHistoricoProdutos.addEventListener("click", () => alternarPausaHistoricoProdutos(false));
    }

    verificarStatusPausaInicial();

    /* =========================================
       MODAL DE FILTRAGEM (DATA E HORA)
    ========================================= */
    if (btnAbrirModalFiltroProdutos && modalFiltroProdutos) {
        btnAbrirModalFiltroProdutos.addEventListener("click", function () {
            if (inputFiltroDataProdutos) inputFiltroDataProdutos.value = filtroDataAtualProdutos;

            const radio = document.querySelector(`input[name="filtroOrdemHoraProdutos"][value="${ordemHistoricoAtualProdutos}"]`);
            if (radio) radio.checked = true;

            modalFiltroProdutos.show();
        });
    }

    if (btnAplicarFiltroprodutos) {
        btnAplicarFiltroprodutos.addEventListener("click", async function () {
            const dataVal = inputFiltroDataProdutos ? inputFiltroDataProdutos.value.trim() : "";
            const radioChecked = document.querySelector('input[name="filtroOrdemHoraProdutos"]:checked');
            const ordemVal = radioChecked ? radioChecked.value : "desc";

            if (dataVal.length > 0 && dataVal.length < 10) {
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Preencha a data completa (DD/MM/AAAA) ou deixe em branco.", "alerta");
                } else {
                    alert("Preencha a data completa (DD/MM/AAAA) ou deixe em branco.");
                }
                return;
            }

            if (modalFiltroProdutos) modalFiltroProdutos.hide();

            await carregarHistoricoProdutos(false, ordemVal, dataVal);
        });
    }

    if (inputFiltroDataProdutos) {
        inputFiltroDataProdutos.addEventListener("input", function (e) {
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
       12. ORDENAÇÃO DO HISTÓRICO
    ========================================= */
    if (btnAbrirModalOrdenarProdutos && modalOrdenarProdutos) {
        btnAbrirModalOrdenarProdutos.addEventListener("click", function () {
            if (tipoOrdenacaoHistoricoProdutos) {
                tipoOrdenacaoHistoricoProdutos.value = ordemHistoricoAtualProdutos;
            }
            modalOrdenarProdutos.show();
        });
    }

    if (btnExecutarOrdenacaoProdutosHistoricos) {
        btnExecutarOrdenacaoProdutosHistoricos.addEventListener("click", async function () {
            const direcao = tipoOrdenacaoHistoricoProdutos ? tipoOrdenacaoHistoricoProdutos.value : "desc";

            if (modalOrdenarProdutos) modalOrdenarProdutos.hide();

            await carregarHistoricoProdutos(true, direcao, filtroDataAtualProdutos);

            if (typeof mostrarAlerta === "function") {
                const textoDirecao = direcao === "asc" ? "crescente (antigos primeiro)" : "decrescente (recentes primeiro)";
                mostrarAlerta(`Histórico ordenado em ordem ${textoDirecao}!`, "sucesso");
            }
        });
    }

    /* =========================================
       LIMPAR VISUALIZAÇÃO DAS TABELAS
    ========================================= */
    function limparVisualizacaoTabelasEstoque() {
        // Desmarca quaisquer seleções ativas na memória e no ecrã
        desmarcarEstoque();
        desmarcarSaida();

        // 1. Limpa Tabela de Produtos em Estoque (12 colunas)
        if (tbodyEstoque) {
            tbodyEstoque.innerHTML = `
                <tr class="linha-vazia">
                    <td colspan="13" class="text-center py-4" style="color: #cbd5e1 !important;">
                        <i class="fa-solid fa-box-open fa-2x mb-2 d-block" style="color: #cbd5e1 !important;"></i>
                        <span style="color: #cbd5e1 !important;">Nenhum produto em estoque exibido no momento.</span>
                    </td>
                </tr>
            `;
        }

        // 2. Limpa Tabela de Saídas (13 colunas)
        if (tbodySaidas) {
            tbodySaidas.innerHTML = `
                <tr class="linha-vazia">
                    <td colspan="14" class="text-center py-4" style="color: #cbd5e1 !important;">
                        <i class="fa-solid fa-arrow-right-from-bracket fa-2x mb-2 d-block" style="color: #cbd5e1 !important;"></i>
                        <span style="color: #cbd5e1 !important;">Nenhum registro de saída exibido no momento.</span>
                    </td>
                </tr>
            `;
        }

        // 3. Emite alerta de confirmação
        if (typeof mostrarAlerta === "function") {
            mostrarAlerta("Tabelas de estoque limpas com sucesso!", "sucesso");
        }
    }

    if (btnLimparTabelasEstoque) {
        btnLimparTabelasEstoque.addEventListener("click", limparVisualizacaoTabelasEstoque);
    }

  
    // Ação disparada ao clicar no botão "Exportar" dentro do modal
    document.getElementById('btnConfirmarExportarExcelProdutos')?.addEventListener('click', function () {
        const selectTipo = document.getElementById('tipoExportacaoExcelProdutos');
        const tipo = selectTipo ? selectTipo.value : 'todos';

        // 1. Dispara o download gerado pela view Django (com openpyxl no backend)
        window.location.href = `/produtos/exportar/excel/?tipo=${tipo}`;

        // 2. Fecha o modal
        const modalEl = document.getElementById('modalExportarExcelProdutos');
        if (modalEl) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
    });

    // 1. Abre o modal ao clicar no botão da barra superior
    document.getElementById('btnExportarProdutosExcel')?.addEventListener('click', function () {
        const modalEl = document.getElementById('modalExportarExcelProdutos');
        if (modalEl) {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
            modalInstance.show();
        }
    });

    // 2. Dispara o download pelo Django ao clicar em "Exportar" dentro do modal
    document.getElementById('btnConfirmarExportarExcelProdutos')?.addEventListener('click', function () {
        const selectTipo = document.getElementById('tipoExportacaoExcelProdutos');
        const tipo = selectTipo ? selectTipo.value : 'todos';

        // Obtém a URL exata configurada no Django através do atributo data-url
        const baseUrl = this.dataset.url || '/exportar/excel/';

        // Redireciona com o parâmetro
        window.location.href = `${baseUrl}?tipo=${tipo}`;

        // Fecha o modal
        const modalEl = document.getElementById('modalExportarExcelProdutos');
        if (modalEl) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
    });

});
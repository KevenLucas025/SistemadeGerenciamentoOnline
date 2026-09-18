document.addEventListener("DOMContentLoaded", function () {
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
    const tbodyHistorico = document.getElementById("tbodyHistoricoProdutos");
    const btnAtualizarHistorico = document.getElementById("btnAtualizarHistoricoProdutos");

    // Variáveis de seleção em memória
    let itemEstoqueSelecionado = null; // { id, nome, codigo, quantidade }
    let itemSaidaSelecionado = null;   // { id, nome, codigo, quantidade }

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
       HISTÓRICO DE PRODUTOS
    ========================================= */
    async function carregarHistoricoProdutos() {
        if (!tbodyHistorico) return;

        try {
            const resposta = await fetch('/estoque/historico/listar/');
            const dados = await resposta.json();

            if (dados.sucesso) {
                tbodyHistorico.innerHTML = dados.html;
            }
        } catch (erro) {
            console.error("Erro ao carregar histórico:", erro);
        }
    }

    if (btnHistoricoEstoque && modalHistoricoProdutos) {
        btnHistoricoEstoque.addEventListener("click", function (e) {
            e.stopPropagation();
            modalHistoricoProdutos.show();
            carregarHistoricoProdutos();
        });
    }

    if (btnAtualizarHistorico) {
        btnAtualizarHistorico.addEventListener("click", function () {
            carregarHistoricoProdutos();
        });
    }
});
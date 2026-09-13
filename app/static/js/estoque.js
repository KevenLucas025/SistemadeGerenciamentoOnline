document.addEventListener("DOMContentLoaded", function () {
    const btnAtualizarEstoque = document.getElementById("btnAtualizarEstoque");
    const btnAtualizarSaida = document.getElementById("btnAtualizarSaida");
    const tbodyEstoque = document.getElementById("tbodyEstoqueProdutos");
    const tbodySaidas = document.getElementById("tbodyEstoqueSaidas");

    // Modal e Ações
    const btnGerarSaidaEstoque = document.getElementById("btnGerarSaidaEstoque");
    const modalSaidaEl = document.getElementById("modalConfirmarSaidaEstoque");
    const modalSaida = modalSaidaEl ? bootstrap.Modal.getOrCreateInstance(modalSaidaEl) : null;
    const nomeProdutoModal = document.getElementById("nomeProdutoSaidaModal");
    const codigoProdutoModal = document.getElementById("codigoProdutoSaidaModal");
    const btnConfirmarSaidaDefinitiva = document.getElementById("btnConfirmarSaidaEstoqueDefinitiva");

    // Variáveis que guardam o produto selecionado em memória
    let produtoIdSelecionado = null;
    let produtoNomeSelecionado = "";
    let produtoCodigoSelecionado = "";

    function getCSRFToken() {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
            const [nome, valor] = cookie.trim().split("=");
            if (nome === "csrftoken") return decodeURIComponent(valor);
        }
        return document.querySelector("[name=csrfmiddlewaretoken]")?.value || "";
    }

    /* =========================================
       SELEÇÃO DE LINHA ROBUSTA
    ========================================= */
    function desmarcarLinhaEstoque() {
        if (tbodyEstoque) {
            tbodyEstoque.querySelectorAll("tr").forEach(tr => tr.classList.remove("linha-selecionada"));
        }
        produtoIdSelecionado = null;
        produtoNomeSelecionado = "";
        produtoCodigoSelecionado = "";
    }

    if (tbodyEstoque) {
        tbodyEstoque.addEventListener("click", function (e) {
            // Acha o tr clicado
            const linha = e.target.closest("tr");
            if (!linha || linha.classList.contains("linha-vazia") || linha.querySelector(".sem-registros")) {
                return;
            }

            // Pega o ID direto do atributo data-produto-id
            const id = linha.getAttribute("data-produto-id");

            // Se clicou na que já estava selecionada, desmarca
            if (linha.classList.contains("linha-selecionada")) {
                desmarcarLinhaEstoque();
                return;
            }

            // Remove a seleção anterior
            tbodyEstoque.querySelectorAll("tr").forEach(tr => tr.classList.remove("linha-selecionada"));

            // Marca a nova linha
            linha.classList.add("linha-selecionada");
            
            // Armazena com segurança
            produtoIdSelecionado = id;
            produtoNomeSelecionado = linha.querySelector("td:first-child")?.textContent.trim() || "Produto";
            produtoCodigoSelecionado = linha.getAttribute("data-codigo") || linha.children[7]?.textContent.trim() || "—";

            console.log(">>> Produto selecionado com sucesso:", {
                id: produtoIdSelecionado,
                nome: produtoNomeSelecionado,
                codigo: produtoCodigoSelecionado
            });
        });
    }

    /* =========================================
       CLIQUE FORA (COM PROTEÇÃO)
    ========================================= */
    document.addEventListener("click", function (e) {
        // NÃO desseleciona se clicou na tabela de estoque
        if (e.target.closest("#tbodyEstoqueProdutos")) return;

        // NÃO desseleciona se clicou no botão "Gerar Saída" ou dentro do Modal
        if (e.target.closest("#btnGerarSaidaEstoque") || e.target.closest("#btnGerarEstorno")) return;
        if (e.target.closest(".modal") || e.target.closest(".modal-backdrop")) return;

        desmarcarLinhaEstoque();
    });

    /* =========================================
       ABRIR MODAL DE CONFIRMAÇÃO
    ========================================= */
    if (btnGerarSaidaEstoque) {
        btnGerarSaidaEstoque.addEventListener("click", function (e) {
            e.stopPropagation(); // Evita que o evento suba e desmarque a linha

            if (!produtoIdSelecionado) {
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Selecione um produto da tabela de estoque clicando na linha dele.", "alerta");
                }
                return;
            }

            if (nomeProdutoModal) nomeProdutoModal.textContent = produtoNomeSelecionado;
            if (codigoProdutoModal) codigoProdutoModal.textContent = produtoCodigoSelecionado;

            if (modalSaida) modalSaida.show();
        });
    }

    /* =========================================
       CONFIRMAR SAÍDA DEFINITIVA
    ========================================= */
    if (btnConfirmarSaidaDefinitiva) {
        btnConfirmarSaidaDefinitiva.addEventListener("click", async function () {
            if (!produtoIdSelecionado) {
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Nenhum produto selecionado.", "erro");
                }
                return;
            }

            const csrfToken = getCSRFToken();

            try {
                btnConfirmarSaidaDefinitiva.disabled = true;

                const resposta = await fetch(`/estoque/gerar-saida/${produtoIdSelecionado}/`, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken,
                        "Content-Type": "application/json"
                    }
                });

                const dados = await resposta.json();

                if (!resposta.ok || !dados.sucesso) {
                    throw new Error(dados.mensagem || "Erro ao processar saída no servidor.");
                }

                if (modalSaida) modalSaida.hide();

                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(dados.mensagem, "sucesso");
                }

                desmarcarLinhaEstoque();

                // Atualiza as tabelas via AJAX
                await atualizarTabela("estoque", null, tbodyEstoque, true);
                await atualizarTabela("saida", null, tbodySaidas, true);

            } catch (erro) {
                console.error("Erro ao gerar saída:", erro);
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(erro.message || "Erro ao comunicar com o servidor.", "erro");
                }
            } finally {
                btnConfirmarSaidaDefinitiva.disabled = false;
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
                if (tipo === "estoque") desmarcarLinhaEstoque();

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
});
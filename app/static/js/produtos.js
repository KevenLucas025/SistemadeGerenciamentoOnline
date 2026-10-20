
document.addEventListener("DOMContentLoaded", function () {

    const btnAdicionar = document.getElementById("btnAdicionarProduto");
    const btnSalvar = document.getElementById("btnSalvarProduto");
    const inputValor = document.getElementById("valor_unitario");
    const inputDesconto = document.getElementById("desconto");
    const btnEditar = document.querySelector(".btn-side-actions.editar");
    const inputImagem = document.getElementById("imagem");
    const imgPreview = document.getElementById("img-preview");
    const previewEmpty = document.querySelector(".preview-empty");
    const btnCarregar = document.getElementById("btnCarregarImagem");
    const btnRemover = document.getElementById("btnRemoverImagem");
    const formulario = document.getElementById("formCadastroProduto");
    const modalSemImagem = document.getElementById("modalSemImagem");

    // =========================================
    // ELEMENTOS DA TABELA E SELEÇÃO
    // Declarar ANTES da primeira chamada às funções
    // =========================================
    const checkboxMasterProdutos = document.getElementById("checkboxMasterProdutos");
    const tbodyProdutos = document.getElementById("tabelaProdutosBody");

    // Navegação rápida
    const btnResumoClientes = document.querySelector(".btn-resumo-ver-clientes");

    if (btnResumoClientes) {
        btnResumoClientes.addEventListener("click", function () {
            if (this.dataset.url) {
                window.location.href = this.dataset.url;
            }
        });
    }

    const btnResumoProdutos = document.querySelector(".btn-resumo-ver-produtos");

    if (btnResumoProdutos) {
        btnResumoProdutos.addEventListener("click", function () {
            if (this.dataset.url) {
                window.location.href = this.dataset.url;
            }
        });
    }

    let produtoEmEdicao = null;
    let dadosOriginais = {};
    let imagemOriginal = "";
    let permitirEnvioSemImagem = false;
    let produtosParaApagar = [];

    let modalInstancia = null;

    if (modalSemImagem) {
        modalInstancia = bootstrap.Modal.getOrCreateInstance(modalSemImagem);
    }

    // =========================================
    // FUNÇÕES DE SELEÇÃO DOS PRODUTOS
    // =========================================
    function getCheckboxesProdutos() {
        return Array.from(
            document.querySelectorAll(
                "#tabelaProdutosBody input.checkbox-produto"
            )
        );
    }

    function getProdutosSelecionados() {
        return getCheckboxesProdutos().filter(
            checkbox => checkbox.checked
        );
    }

    function atualizarCheckboxMasterProdutos() {
        const checkboxes = getCheckboxesProdutos();
        const selecionados = checkboxes.filter(
            checkbox => checkbox.checked
        );

        if (!checkboxMasterProdutos) return;

        checkboxMasterProdutos.checked =
            checkboxes.length > 0 &&
            selecionados.length === checkboxes.length;

        checkboxMasterProdutos.indeterminate =
            selecionados.length > 0 &&
            selecionados.length < checkboxes.length;
    }

    function obterProdutoSelecionadoUnico(acao) {
        const selecionados = getProdutosSelecionados();

        if (selecionados.length === 0) {
            mostrarAlerta(
                "Selecione um produto para " + acao + ".",
                "erro"
            );
            return null;
        }

        if (selecionados.length > 1) {
            mostrarAlerta(
                "Para " + acao + ", selecione apenas um produto.",
                "erro"
            );
            return null;
        }

        return selecionados[0].closest("tr");
    }

    // =========================================
    // INICIALIZAR E ATUALIZAR A TABELA
    // =========================================
    function inicializarEventosTabela() {
        const tbody = document.getElementById("tabelaProdutosBody");

        if (!tbody) return;

        tbody.querySelectorAll("tr").forEach(linha => {
            const checkbox = linha.querySelector(".checkbox-produto");

            if (!checkbox) return;

            linha.classList.toggle(
                "produto-selecionado",
                checkbox.checked
            );
        });

        atualizarCheckboxMasterProdutos();
    }

    // =========================================
    // CHECKBOX MASTER: SELECIONAR TODOS
    // =========================================
    if (checkboxMasterProdutos) {
        checkboxMasterProdutos.addEventListener("change", function () {
            const marcarTodos = this.checked;

            getCheckboxesProdutos().forEach(checkbox => {
                checkbox.checked = marcarTodos;

                const linha = checkbox.closest("tr");

                if (linha) {
                    linha.classList.toggle(
                        "produto-selecionado",
                        marcarTodos
                    );
                }
            });

            atualizarCheckboxMasterProdutos();
        });
    }

    // =========================================
    // SELEÇÃO DIRETA DOS CHECKBOXES
    // E CLIQUE NA LINHA DO PRODUTO
    // =========================================
    if (tbodyProdutos) {

        // Quando o próprio checkbox é alterado
        tbodyProdutos.addEventListener("change", function (e) {
            if (!e.target.matches(".checkbox-produto")) return;

            const linha = e.target.closest("tr");

            if (linha) {
                linha.classList.toggle(
                    "produto-selecionado",
                    e.target.checked
                );
            }

            atualizarCheckboxMasterProdutos();
        });

        // Quando o usuário clica na linha
        tbodyProdutos.addEventListener("click", function (e) {
            const linha = e.target.closest("tr");

            if (!linha) return;

            const checkbox = linha.querySelector(".checkbox-produto");

            if (!checkbox) return;

            // Não alternar a seleção ao clicar em controles
            // ou elementos interativos dentro da linha.
            if (
                e.target.closest(
                    "button, a, input, select, textarea, label"
                )
            ) {
                return;
            }

            checkbox.checked = !checkbox.checked;

            linha.classList.toggle(
                "produto-selecionado",
                checkbox.checked
            );

            atualizarCheckboxMasterProdutos();
        });
    }

    // =========================================
    // FUNÇÃO CENTRALIZADA DE CÁLCULO E RESUMO
    // =========================================
    function calcularResumoProduto() {
        let quantidade = Number(
            document.getElementById("quantidade")?.value || 0
        );

        let valorUnitarioRaw =
            document.getElementById("valor_unitario")?.value || "";

        let descontoRaw =
            document.getElementById("desconto")?.value || "";

        let desconto = Number(
            descontoRaw.replace("%", "").replace(",", ".").trim()
        ) || 0;

        let valorUnitario = Number(
            valorUnitarioRaw
                .replace("R$", "")
                .replace(/\./g, "")
                .replace(",", ".")
                .trim()
        ) || 0;

        let totalSemDesconto = quantidade * valorUnitario;
        let valorDesconto = totalSemDesconto * (desconto / 100);
        let totalComDesconto = totalSemDesconto - valorDesconto;

        const elSem = document.getElementById("resumo-sem-desconto");
        const elDesc = document.getElementById("resumo-desconto");
        const elTotal = document.getElementById("resumo-total");
        const elQtd = document.getElementById("resumo-quantidade");

        if (elSem) {
            elSem.innerText = formatarMoeda(totalSemDesconto);
        }

        if (elDesc) {
            elDesc.innerText = formatarMoeda(valorDesconto);
        }

        if (elTotal) {
            elTotal.innerText = formatarMoeda(totalComDesconto);
        }

        if (elQtd) {
            elQtd.innerText = quantidade;
        }

        // Gera o código automaticamente caso esteja em branco
        let campoCodigo = document.getElementById("codigo");

        if (campoCodigo && !campoCodigo.value && !produtoEmEdicao) {
            campoCodigo.value = gerarCodigoProduto();
        }
    }

    // =========================================
    // FUNÇÃO PARA CADASTRAR VIA AJAX
    // =========================================
    function cadastrarProdutoViaAjax() {
        if (!formulario) return;

        const formData = new FormData(formulario);

        const csrfInput = document.querySelector(
            "[name=csrfmiddlewaretoken]"
        );

        const urlEnvio =
            formulario.getAttribute("action") || "/produtos/";

        fetch(urlEnvio, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfInput ? csrfInput.value : ""
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro HTTP " + response.status);
            }

            return response.json();
        })
        .then(data => {
            if (data.status === "ok") {
                mostrarAlerta(
                    data.mensagem || "Produto cadastrado com sucesso!",
                    "sucesso"
                );

                limparFormularioProduto();
                permitirEnvioSemImagem = false;

                return fetch("/produtos/atualizar-tabela/");
            }

            mostrarAlerta(
                data.mensagem || "Erro ao cadastrar produto.",
                "erro"
            );

            return null;
        })
        .then(response => {
            if (!response) return null;

            if (!response.ok) {
                throw new Error("Erro ao atualizar a tabela.");
            }

            return response.text();
        })
        .then(html => {
            if (html === null) return;

            const tbody = document.getElementById("tabelaProdutosBody");

            if (tbody) {
                tbody.innerHTML = html;
                inicializarEventosTabela();
            }
        })
        .catch(error => {
            console.error("Erro no cadastro:", error);

            mostrarAlerta(
                "Erro ao processar o cadastro do produto.",
                "erro"
            );
        });
    }

    // =========================================
    // BOTÃO ADICIONAR (EXECUTA O CÁLCULO)
    // =========================================
    if (btnAdicionar) {
        btnAdicionar.addEventListener("click", function () {
            let nome = (
                document.getElementById("nome")?.value || ""
            ).trim();

            let quantidade = Number(
                document.getElementById("quantidade")?.value || 0
            );

            let valorUnitarioRaw =
                document.getElementById("valor_unitario")?.value || "";

            if (!nome) {
                mostrarAlerta("Informe o nome do produto.", "erro");
                marcarErro(document.getElementById("nome"));
                return;
            }

            if (!quantidade || quantidade <= 0) {
                mostrarAlerta(
                    "Informe uma quantidade válida.",
                    "erro"
                );

                marcarErro(document.getElementById("quantidade"));
                return;
            }

            let valorUnitario = Number(
                valorUnitarioRaw
                    .replace("R$", "")
                    .replace(/\./g, "")
                    .replace(",", ".")
                    .trim()
            ) || 0;

            if (!valorUnitario || valorUnitario <= 0) {
                mostrarAlerta("Informe o valor unitário.", "erro");
                marcarErro(document.getElementById("valor_unitario"));
                return;
            }

            calcularResumoProduto();

            mostrarAlerta(
                "Cálculo realizado com sucesso!",
                "sucesso"
            );
        });
    }

    // =========================================
    // SUBMIT DO FORMULÁRIO
    // =========================================
    if (formulario) {
        formulario.addEventListener("submit", function (e) {
            e.preventDefault();

            if (produtoEmEdicao) {
                mostrarAlerta(
                    "Você está editando um produto. Utilize o botão 'Atualizar' para salvar as alterações.",
                    "erro"
                );
                return;
            }

            calcularResumoProduto();

            const nome = (
                document.getElementById("nome")?.value || ""
            ).trim();

            const cliente = (
                document.getElementById("cliente")?.value || ""
            ).trim();

            const quantidade = Number(
                document.getElementById("quantidade")?.value || 0
            );

            const valorUnitarioRaw =
                document.getElementById("valor_unitario")?.value || "";

            const dataCadastro =
                document.getElementById("data_cadastro")?.value || "";

            const descricao = (
                document.getElementById("descricao")?.value || ""
            ).trim();

            const valorUnitario = Number(
                valorUnitarioRaw
                    .replace("R$", "")
                    .replace(/\./g, "")
                    .replace(",", ".")
                    .trim()
            ) || 0;

            if (!nome) {
                mostrarAlerta("Informe o nome do produto.", "erro");
                marcarErro(document.getElementById("nome"));
                return;
            }

            if (!cliente) {
                mostrarAlerta(
                    "Selecione um cliente para o produto.",
                    "erro"
                );

                marcarErro(document.getElementById("cliente"));
                return;
            }

            if (!quantidade || quantidade <= 0) {
                mostrarAlerta(
                    "Informe uma quantidade válida.",
                    "erro"
                );

                marcarErro(document.getElementById("quantidade"));
                return;
            }

            if (!valorUnitario || valorUnitario <= 0) {
                mostrarAlerta("Informe o valor unitário.", "erro");
                marcarErro(document.getElementById("valor_unitario"));
                return;
            }

            if (!dataCadastro) {
                mostrarAlerta("Informe a data de cadastro.", "erro");
                marcarErro(document.getElementById("data_cadastro"));
                return;
            }

            if (!descricao) {
                mostrarAlerta("Informe a descrição do produto.", "erro");
                marcarErro(document.getElementById("descricao"));
                return;
            }

            if (
                inputImagem &&
                !inputImagem.files.length &&
                !permitirEnvioSemImagem
            ) {
                if (modalInstancia) {
                    modalInstancia.show();
                }

                return;
            }

            cadastrarProdutoViaAjax();
        });
    }

    // =========================================
    // CONFIRMAR CADASTRO SEM IMAGEM
    // =========================================
    const btnConfirmarSemImagem =
        document.getElementById("btnConfirmarSemImagem");

    if (btnConfirmarSemImagem) {
        btnConfirmarSemImagem.addEventListener("click", function () {
            permitirEnvioSemImagem = true;

            if (modalInstancia) {
                modalInstancia.hide();
            }

            cadastrarProdutoViaAjax();
        });
    }

    // =========================================
    // ABRIR MODAL DA TABELA DE PRODUTOS
    // =========================================
    if (btnEditar) {
        btnEditar.addEventListener("click", function () {
            const modalElemento =
                document.getElementById("modalTabelaProdutos");

            if (modalElemento) {
                bootstrap.Modal
                    .getOrCreateInstance(modalElemento)
                    .show();
            }
        });
    }

    // =========================================
    // MÁSCARAS DE ENTRADA
    // =========================================
    if (inputDesconto) {
        aplicarMascaraPorcentagem(inputDesconto);
    }

    if (inputValor) {
        aplicarMascaraMoeda(inputValor);
    }

    // =========================================
    // UPLOAD E PREVIEW DE IMAGEM
    // =========================================
    if (inputImagem) {
        inputImagem.addEventListener("change", function () {
            const arquivo = this.files[0];

            if (arquivo) {
                const leitor = new FileReader();

                leitor.onload = function (e) {
                    if (imgPreview) {
                        imgPreview.src = e.target.result;
                        imgPreview.style.display = "block";
                    }

                    if (previewEmpty) {
                        previewEmpty.style.display = "none";
                    }
                };

                leitor.readAsDataURL(arquivo);
            }
        });
    }

    if (btnCarregar && inputImagem) {
        btnCarregar.addEventListener("click", function () {
            inputImagem.click();
        });
    }

    if (btnRemover && inputImagem) {
        btnRemover.addEventListener("click", function () {
            inputImagem.value = "";

            if (imgPreview) {
                imgPreview.src = "";
                imgPreview.style.display = "none";
            }

            if (previewEmpty) {
                previewEmpty.style.display = "flex";
            }
        });
    }

    // =========================================
    // INICIALIZAR A TABELA NA ABERTURA
    // =========================================
    inicializarEventosTabela();

    // =========================================
    // APAGAR PRODUTOS SELECIONADOS
    // =========================================
    const btnApagarProduto = document.getElementById("btnApagarProduto");

    if (btnApagarProduto) {
        btnApagarProduto.addEventListener("click", function () {
            const selecionados = getProdutosSelecionados();

            if (selecionados.length === 0) {
                mostrarAlerta(
                    "Selecione pelo menos um produto para apagar.",
                    "erro"
                );
                return;
            }

            produtosParaApagar = selecionados
                .map(checkbox => checkbox.closest("tr"))
                .filter(linha => linha && linha.dataset.id);

            if (produtosParaApagar.length === 0) {
                mostrarAlerta(
                    "Não foi possível identificar os produtos.",
                    "erro"
                );
                return;
            }

            const modalElemento = document.getElementById("modalApagarProduto");

            if (modalElemento) {
                // Evita criar vários backdrops
                if (!document.querySelector(".backdrop-confirmacao")) {
                    const backdrop = document.createElement("div");
                    backdrop.className = "backdrop-confirmacao";
                    document.body.appendChild(backdrop);
                }

                const modalApagar = bootstrap.Modal.getOrCreateInstance(
                    modalElemento,
                    { backdrop: false }
                );

                modalApagar.show();
            }
        });
    }

    // =========================================
    // CONFIRMAR EXCLUSÃO DOS PRODUTOS
    // =========================================
    const btnConfirmarApagarProduto = document.getElementById("btnConfirmarApagarProduto");

    if (btnConfirmarApagarProduto) {
        btnConfirmarApagarProduto.addEventListener(
            "click",
            async function () {
                if (produtosParaApagar.length === 0) return;

                const csrfInput = document.querySelector(
                    "[name=csrfmiddlewaretoken]"
                );

                const linhasApagadas = [];
                const erros = [];

                btnConfirmarApagarProduto.disabled = true;

                try {
                    for (const linha of produtosParaApagar) {
                        const id = linha.dataset.id;

                        try {
                            const response = await fetch(
                                `/produtos/apagar/${id}/`,
                                {
                                    method: "POST",
                                    headers: {
                                        "X-CSRFToken": csrfInput
                                            ? csrfInput.value
                                            : "",
                                        "Content-Type": "application/json"
                                    }
                                }
                            );

                            const data = await response.json();

                            if (!response.ok || data.status !== "ok") {
                                erros.push(id);
                                continue;
                            }

                            linhasApagadas.push(linha);

                        } catch (error) {
                            console.error(
                                `Erro ao apagar produto ${id}:`,
                                error
                            );

                            erros.push(id);
                        }
                    }

                    linhasApagadas.forEach(linha => linha.remove());

                    produtosParaApagar = [];

                    atualizarCheckboxMasterProdutos();

                    const modalElemento =
                        document.getElementById("modalApagarProduto");

                    if (modalElemento) {
                        bootstrap.Modal
                            .getInstance(modalElemento)
                            ?.hide();
                    }

                    document
                        .querySelector(".backdrop-confirmacao")
                        ?.remove();

                    if (erros.length === 0) {
                        mostrarAlerta(
                            linhasApagadas.length === 1
                                ? "Produto apagado com sucesso."
                                : `${linhasApagadas.length} produtos apagados com sucesso.`,
                            "sucesso"
                        );
                    } else {
                        mostrarAlerta(
                            `${linhasApagadas.length} produto(s) apagado(s). ` +
                            `${erros.length} não puderam ser apagados.`,
                            "erro"
                        );
                    }

                } finally {
                    btnConfirmarApagarProduto.disabled = false;
                }
            }
        );
    }

    const modalApagarElemento =
        document.getElementById("modalApagarProduto");

    if (modalApagarElemento) {
        modalApagarElemento.addEventListener(
            "hidden.bs.modal",
            function () {
                document
                    .querySelector(".backdrop-confirmacao")
                    ?.remove();
            }
        );
    }

    // =========================================
    // CARREGAR PRODUTO PARA EDIÇÃO
    // =========================================
    const btnAtualizarProduto =
        document.getElementById("btnAtualizarProduto");

    if (btnAtualizarProduto) {
        btnAtualizarProduto.addEventListener("click", function () {
            const linha = obterProdutoSelecionadoUnico(
                "carregar para edição"
            );

            if (!linha) return;

            produtoEmEdicao = linha.dataset.id;

            const imagem = linha.dataset.imagem || "";
            imagemOriginal = imagem ? imagem.split("/").pop() : "";

            const valorTratado = (linha.dataset.valor || "0")
                .replace("R$", "")
                .replace(/\./g, "")
                .replace(",", ".")
                .trim();

            const descontoTratado = parseFloat(
                (linha.dataset.desconto || "0")
                    .replace("%", "")
                    .replace(",", ".")
            ).toString();

            const clienteId = linha.dataset.clienteId || "";

            dadosOriginais = {
                nome: (linha.dataset.nome || "").trim(),
                cliente: clienteId,
                quantidade: (linha.dataset.quantidade || "").trim(),
                valor: valorTratado,
                desconto: descontoTratado,
                data: (linha.dataset.data || "").trim(),
                descricao: (linha.dataset.descricao || "").trim(),
                imagem: imagemOriginal
            };

            document.getElementById("nome").value =
                linha.dataset.nome || "";

            const selectCliente = document.getElementById("cliente");

            if (selectCliente) {
                selectCliente.value = clienteId;
            }

            document.getElementById("quantidade").value =
                linha.dataset.quantidade || "";

            const valorNum = parseFloat(
                (linha.dataset.valor || "0")
                    .replace("R$", "")
                    .replace(/\./g, "")
                    .replace(",", ".")
            ) || 0;

            document.getElementById("valor_unitario").value =
                formatarMoeda(valorNum);

            const descontoNum = parseFloat(
                (linha.dataset.desconto || "0")
                    .replace("%", "")
                    .replace(",", ".")
            ) || 0;

            document.getElementById("desconto").value =
                (descontoNum % 1 === 0
                    ? parseInt(descontoNum)
                    : descontoNum.toString().replace(".", ",")) + "%";

            document.getElementById("codigo").value =
                linha.dataset.codigo || "";

            document.getElementById("data_cadastro").value =
                linha.dataset.data || "";

            document.getElementById("descricao").value =
                linha.dataset.descricao || "";

            calcularResumoProduto();

            if (imagem && imgPreview) {
                imgPreview.src = imagem;
                imgPreview.style.display = "block";

                if (previewEmpty) {
                    previewEmpty.style.display = "none";
                }
            } else if (imgPreview) {
                imgPreview.src = "";
                imgPreview.style.display = "none";

                if (previewEmpty) {
                    previewEmpty.style.display = "flex";
                }
            }

            const modalTabelaEl =
                document.getElementById("modalTabelaProdutos");

            if (modalTabelaEl) {
                bootstrap.Modal
                    .getInstance(modalTabelaEl)
                    ?.hide();
            }

            mostrarAlerta(
                "Produto carregado para edição.",
                "sucesso"
            );
        });
    }

    // =========================================
    // ATUALIZAR PRODUTO (SALVAR EDIÇÃO)
    // =========================================
    const btnAtualizar = document.querySelector(".btn-side-actions.atualizar");

    if (btnAtualizar) {
        btnAtualizar.addEventListener("click", function () {
            if (!produtoEmEdicao) {
                mostrarAlerta(
                    "Nenhum produto selecionado para atualização. Primeiro selecione um produto através do botão Editar.",
                    "erro"
                );
                return;
            }

            calcularResumoProduto();

            const nome = (
                document.getElementById("nome")?.value || ""
            ).trim();

            const cliente = (
                document.getElementById("cliente")?.value || ""
            ).trim();

            const quantidade = (
                document.getElementById("quantidade")?.value || ""
            ).trim();

            const valorRaw =
                document.getElementById("valor_unitario")?.value || "";

            const valor = valorRaw
                .replace("R$", "")
                .replace(/\./g, "")
                .replace(",", ".")
                .trim();

            const desconto = parseFloat(
                (document.getElementById("desconto")?.value || "0")
                    .replace("%", "")
                    .replace(",", ".")
            ).toString();

            const data =
                document.getElementById("data_cadastro")?.value || "";

            const descricao = (
                document.getElementById("descricao")?.value || ""
            ).trim();

            const inputImg = document.getElementById("imagem");

            const imagemAtual =
                inputImg && inputImg.files && inputImg.files.length > 0
                    ? inputImg.files[0].name
                    : imagemOriginal;

            const houveAlteracao =
                nome !== String(dadosOriginais.nome || "") ||
                cliente !== String(dadosOriginais.cliente || "") ||
                quantidade !== String(dadosOriginais.quantidade || "") ||
                valor !== String(dadosOriginais.valor || "") ||
                desconto !== String(dadosOriginais.desconto || "") ||
                data !== String(dadosOriginais.data || "") ||
                descricao !== String(dadosOriginais.descricao || "") ||
                imagemAtual !== String(dadosOriginais.imagem || "");

            if (!houveAlteracao) {
                mostrarAlerta(
                    "Não foi feita nenhuma alteração no produto para atualizar.",
                    "erro"
                );
                return;
            }

            const formData = new FormData(formulario);

            const arquivoImagem = formData.get("imagem");

            console.log("Produto em edição:", produtoEmEdicao);
            console.log("Imagem original:", imagemOriginal);
            console.log("Arquivo selecionado:", inputImg?.files[0] || null);
            console.log("Arquivo enviado:", arquivoImagem);

            console.log("URL da requisição:", `/produtos/atualizar/${produtoEmEdicao}/`);

            const csrfInput = document.querySelector(
                "[name=csrfmiddlewaretoken]"
            );

            fetch(`/produtos/atualizar/${produtoEmEdicao}/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfInput ? csrfInput.value : ""
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === "ok") {
                    mostrarAlerta(
                        "Produto atualizado com sucesso.",
                        "sucesso"
                    );

                    limparFormularioProduto();

                    return fetch("/produtos/atualizar-tabela/");
                }

                mostrarAlerta(
                    data.mensagem || "Erro ao atualizar produto.",
                    "erro"
                );

                return null;
            })
            .then(response => {
                if (!response) return null;
                return response.text();
            })
            .then(html => {
                if (html === null) return;

                const tbody = document.getElementById("tabelaProdutosBody");

                if (tbody) {
                    tbody.innerHTML = html;
                    inicializarEventosTabela();
                }
            })
            .catch(error => {
                console.error(error);

                mostrarAlerta(
                    "Erro ao processar a atualização do produto.",
                    "erro"
                );
            });
        });
    }

    // =========================================
    // SAIR DO MODO EDIÇÃO
    // =========================================
    const btnSairModoEdicao = document.getElementById("btnSairModoEdicao");

    if (btnSairModoEdicao) {
        btnSairModoEdicao.addEventListener("click", function () {
            if (!produtoEmEdicao) {
                mostrarAlerta(
                    "Você não está no modo edição.",
                    "erro"
                );
                return;
            }

            sairModoEdicaoProduto();
        });
    }

    // =========================================
    // LIMPAR FORMULÁRIO
    // =========================================
    const btnApagarFormulario =
        document.getElementById("btnApagarFormulario");

    if (btnApagarFormulario) {
        btnApagarFormulario.addEventListener("click", function () {
            const possuiDados =
                document.getElementById("nome")?.value ||
                document.getElementById("quantidade")?.value ||
                document.getElementById("valor_unitario")?.value ||
                document.getElementById("descricao")?.value ||
                produtoEmEdicao;

            if (!possuiDados) {
                mostrarAlerta(
                    "O formulário já está vazio.",
                    "erro"
                );
                return;
            }

            limparFormularioProduto();

            mostrarAlerta(
                "Formulário limpo com sucesso.",
                "sucesso"
            );
        });
    }

    // =========================================
    // ATUALIZAR TABELA
    // =========================================
    const btnAtualizarTabela =
        document.getElementById("btnAtualizarTabela");

    if (btnAtualizarTabela) {
        btnAtualizarTabela.addEventListener("click", function () {
            fetch("/produtos/atualizar-tabela/")
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Erro HTTP " + response.status);
                    }

                    return response.text();
                })
                .then(html => {
                    const tbody =
                        document.getElementById("tabelaProdutosBody");

                    if (tbody) {
                        tbody.innerHTML = html;
                        inicializarEventosTabela();
                    }

                    mostrarAlerta(
                        "Tabela atualizada com sucesso.",
                        "sucesso"
                    );
                })
                .catch(error => {
                    console.error(error);

                    mostrarAlerta(
                        "Erro ao atualizar a tabela.",
                        "erro"
                    );
                });
        });
    }

    // =========================================
    // FILTROS E ORDENAÇÃO
    // =========================================
    const btnAbrirFiltro =
        document.getElementById("btnAbrirFiltro");

    if (btnAbrirFiltro) {
        btnAbrirFiltro.addEventListener("click", () => {
            const modalElemento =
                document.getElementById("modalFiltrarProdutos");

            if (modalElemento) {
                bootstrap.Modal
                    .getOrCreateInstance(
                        modalElemento,
                        { backdrop: false }
                    )
                    .show();
            }
        });
    }

    const btnExecutarFiltro =
        document.getElementById("btnExecutarFiltro");

    if (btnExecutarFiltro) {
        btnExecutarFiltro.addEventListener(
            "click",
            filtrarProdutos
        );
    }

    const tipoFiltro = document.getElementById("tipoFiltro");
    const labelValorFiltro = document.getElementById("labelValorFiltro");
    const valorFiltro = document.getElementById("valorFiltro");

    if (tipoFiltro) {
        tipoFiltro.addEventListener("change", () => {
            switch (tipoFiltro.value) {
                case "nome":
                    labelValorFiltro.textContent = "Nome do Produto";
                    valorFiltro.type = "text";
                    valorFiltro.placeholder = "Digite o nome do produto";
                    break;

                case "data_cadastro":
                    labelValorFiltro.textContent = "Data do Cadastro";
                    valorFiltro.type = "date";
                    valorFiltro.placeholder = "";
                    break;

                case "criado_por":
                    labelValorFiltro.textContent = "Usuário";
                    valorFiltro.type = "text";
                    valorFiltro.placeholder = "Digite o nome do usuário";
                    break;

                case "cliente":
                    labelValorFiltro.textContent = "Cliente";
                    valorFiltro.type = "text";
                    valorFiltro.placeholder = "Digite o nome do cliente";
                    break;

                case "codigo":
                    labelValorFiltro.textContent = "Código do Produto";
                    valorFiltro.type = "text";
                    valorFiltro.placeholder = "Digite o código do produto";
                    break;
            }

            valorFiltro.value = "";
        });
    }

    const btnAbrirOrdenacao =
        document.getElementById("btnAbrirOrdenacao");

    if (btnAbrirOrdenacao) {
        btnAbrirOrdenacao.addEventListener("click", () => {
            const modal = document.getElementById("modalOrdenarProdutos");

            if (modal) {
                bootstrap.Modal
                    .getOrCreateInstance(modal)
                    .show();
            }
        });
    }

    const btnExecutarOrdenacao =
        document.getElementById("btnExecutarOrdenacao");

    if (btnExecutarOrdenacao) {
        btnExecutarOrdenacao.addEventListener(
            "click",
            ordenarProdutos
        );
    }

    async function ordenarProdutos() {
        const tipoOrdenacao = document.getElementById("tipoOrdenacao");

        if (!tipoOrdenacao) return;

        const direcao = tipoOrdenacao.value;

        try {
            const resposta = await fetch(
                `/produtos/atualizar-tabela/?ordem=${encodeURIComponent(direcao)}`
            );

            if (!resposta.ok) {
                throw new Error("Erro HTTP " + resposta.status);
            }

            const html = await resposta.text();
            const tbody = document.getElementById("tabelaProdutosBody");

            if (tbody) {
                tbody.innerHTML = html;
                inicializarEventosTabela();
            }

            bootstrap.Modal
                .getInstance(
                    document.getElementById("modalOrdenarProdutos")
                )
                ?.hide();

        } catch (error) {
            console.error(error);
            mostrarAlerta("Erro ao ordenar os produtos.", "erro");
        }
    }

    async function filtrarProdutos() {
        const tipo = document.getElementById("tipoFiltro")?.value || "";
        const valor = document.getElementById("valorFiltro")?.value || "";

        if (valor.trim() === "") {
            mostrarAlerta("Informe um valor para filtrar.", "erro");
            return;
        }

        try {
            const resposta = await fetch(
                `/produtos/atualizar-tabela/?tipo=${encodeURIComponent(tipo)}&valor=${encodeURIComponent(valor)}`
            );

            if (!resposta.ok) {
                throw new Error("Erro HTTP " + resposta.status);
            }

            const html = await resposta.text();
            const tbody = document.getElementById("tabelaProdutosBody");

            if (tbody) {
                tbody.innerHTML = html;
                inicializarEventosTabela();
            }

            bootstrap.Modal
                .getInstance(
                    document.getElementById("modalFiltrarProdutos")
                )
                ?.hide();

        } catch (error) {
            console.error(error);
            mostrarAlerta("Erro ao filtrar os produtos.", "erro");
        }
    }

    // =========================================
    // EXPORTAR EXCEL
    // =========================================
    const btnGerarExcel = document.getElementById("btnGerarExcel");

    if (btnGerarExcel) {
        btnGerarExcel.addEventListener(
            "click",
            exportarTabelaParaExcel
        );
    }

    function exportarTabelaParaExcel() {
        const tabelaBody =
            document.getElementById("tabelaProdutosBody");

        if (!tabelaBody) return;

        const linhas = tabelaBody.querySelectorAll("tr");

        if (
            linhas.length === 0 ||
            tabelaBody.querySelector(".linha-vazia")
        ) {
            mostrarAlerta(
                "Não há produtos na tabela para exportar.",
                "erro"
            );
            return;
        }

        const dadosExcel = [
            [
                "ID",
                "Produto",
                "Quantidade",
                "Valor Unitário",
                "Desconto",
                "Total sem Desconto",
                "Total com Desconto",
                "Cliente",
                "Código",
                "Data Cadastro",
                "Criado Por"
            ]
        ];

        linhas.forEach(linha => {
            const colunas = linha.querySelectorAll("td");

            if (colunas.length > 1) {
                dadosExcel.push([
                    colunas[1]?.innerText.trim() || "",
                    colunas[2]?.innerText.trim() || "",
                    colunas[3]?.innerText.trim() || "",
                    colunas[4]?.innerText.trim() || "",
                    colunas[5]?.innerText.trim() || "",
                    colunas[6]?.innerText.trim() || "",
                    colunas[7]?.innerText.trim() || "",
                    colunas[8]?.innerText.trim() || "",
                    colunas[9]?.innerText.trim() || "",
                    colunas[10]?.innerText.trim() || "",
                    colunas[11]?.innerText.trim() || ""
                ]);
            }
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(dadosExcel);

        ws["!cols"] = [
            { wch: 8 },
            { wch: 25 },
            { wch: 12 },
            { wch: 15 },
            { wch: 10 },
            { wch: 20 },
            { wch: 20 },
            { wch: 20 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Produtos");

        const dataAtual = new Date().toISOString().slice(0, 10);

        XLSX.writeFile(wb, `produtos_${dataAtual}.xlsx`);

        mostrarAlerta(
            "Relatório em Excel gerado com sucesso!",
            "sucesso"
        );
    }

    // =========================================
    // DUPLICAR PRODUTO
    // =========================================
    const duplicarProduto =
        document.getElementById("btnDuplicarProduto");

    if (duplicarProduto) {
        duplicarProduto.addEventListener("click", function () {
            const linha = obterProdutoSelecionadoUnico("duplicar");

            if (!linha) return;

            const id = linha.dataset.id;

            const csrfInput = document.querySelector(
                "[name=csrfmiddlewaretoken]"
            );

            fetch(`/produtos/duplicar/${id}/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfInput ? csrfInput.value : "",
                    "Content-Type": "application/json"
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Erro HTTP " + response.status);
                }

                return response.json();
            })
            .then(data => {
                if (data.status !== "ok") {
                    mostrarAlerta(
                        data.mensagem || "Erro ao duplicar produto.",
                        "erro"
                    );
                    return null;
                }

                mostrarAlerta(
                    data.mensagem || "Produto duplicado com sucesso.",
                    "sucesso"
                );

                return fetch("/produtos/atualizar-tabela/");
            })
            .then(response => {
                if (!response) return null;

                if (!response.ok) {
                    throw new Error("Erro ao atualizar a tabela.");
                }

                return response.text();
            })
            .then(html => {
                if (html === null) return;

                const tbody =
                    document.getElementById("tabelaProdutosBody");

                if (tbody) {
                    tbody.innerHTML = html;
                    inicializarEventosTabela();
                }
            })
            .catch(error => {
                console.error("Erro ao duplicar produto:", error);

                mostrarAlerta(
                    "Erro ao processar a duplicação do produto.",
                    "erro"
                );
            });
        });
    }

    // =========================================
    // LIMPAR FORMULÁRIO
    // =========================================
    function limparFormularioProduto() {
        produtoEmEdicao = null;
        dadosOriginais = {};
        imagemOriginal = "";

        if (formulario) {
            formulario.reset();
        }

        const campoCodigo = document.getElementById("codigo");

        if (campoCodigo) {
            campoCodigo.value = "";
        }

        const selectCliente = document.getElementById("cliente");

        if (selectCliente) {
            selectCliente.value = "";
        }

        const resumoSem = document.getElementById("resumo-sem-desconto");
        const resumoDesc = document.getElementById("resumo-desconto");
        const resumoTotal = document.getElementById("resumo-total");
        const resumoQtd = document.getElementById("resumo-quantidade");

        if (resumoSem) resumoSem.innerText = "R$ 0,00";
        if (resumoDesc) resumoDesc.innerText = "R$ 0,00";
        if (resumoTotal) resumoTotal.innerText = "R$ 0,00";
        if (resumoQtd) resumoQtd.innerText = "0";

        if (imgPreview) {
            imgPreview.src = "";
            imgPreview.style.display = "none";
        }

        if (previewEmpty) {
            previewEmpty.style.display = "flex";
        }

        permitirEnvioSemImagem = false;
    }

    function sairModoEdicaoProduto() {
        limparFormularioProduto();

        mostrarAlerta(
            "Modo edição encerrado. Você pode cadastrar um novo produto.",
            "sucesso"
        );
    }

    // =========================================
    // VISUALIZAR IMAGEM DO PRODUTO
    // =========================================
    const btnVisualizarImagem = document.getElementById("btnVisualizarImagem");

    if (btnVisualizarImagem) {
        btnVisualizarImagem.addEventListener("click", function () {
            const linha = obterProdutoSelecionadoUnico(
                "visualizar a imagem"
            );

            if (!linha) return;

            const imagem = linha.dataset.imagem || "";

            const img = document.getElementById("imagemProdutoModal");
            const msg = document.getElementById("mensagemSemImagemProduto");
            const modalImagem = document.getElementById(
                "modalVisualizarImagemProduto"
            );

            if (imagem) {
                // Exibe a imagem
                if (img) {
                    img.src = imagem;
                    img.style.display = "block";
                }

                // Oculta a mensagem de ausência
                if (msg) {
                    msg.style.display = "none";
                }
            } else {
                // Oculta a imagem
                if (img) {
                    img.src = "";
                    img.style.display = "none";
                }

                // Exibe a mensagem de ausência
                if (msg) {
                    msg.style.display = "block";
                }
            }

            // Abre o modal
            if (modalImagem) {
                bootstrap.Modal
                    .getOrCreateInstance(modalImagem)
                    .show();
            }
        });
    }

});

   
    
// =========================================
// HELPERS UTILITÁRIOS
// =========================================
function formatarMoeda(valor) {
    valor = Number(valor);

    if (isNaN(valor)) {
        valor = 0;
    }

    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function gerarCodigoProduto() {
    const numero = Math.floor(Math.random() * 999999);
    return "PRD-" + numero;
}

function aplicarMascaraMoeda(input) {
    if (!input) return;

    input.addEventListener("input", function () {
        let valor = this.value.replace(/\D/g, "");

        valor = (Number(valor) / 100).toFixed(2) + "";
        valor = valor.replace(".", ",");
        valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        this.value = "R$ " + valor;
    });
}

function aplicarMascaraPorcentagem(input) {
    if (!input) return;

    input.addEventListener("input", function () {
        let valor = this.value.replace(/\D/g, "");

        if (valor === "") {
            this.value = "";
            return;
        }

        valor = Math.min(parseInt(valor), 100);
        this.value = valor + "%";
    });
}

function marcarErro(input) {
    if (!input) return;

    input.classList.add("input-erro");
    input.focus();

    input.addEventListener(
        "pointerdown",
        () => {
            input.classList.remove("input-erro");
        },
        { once: true }
    );
}

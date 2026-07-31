document.addEventListener("DOMContentLoaded", function () {

    const btnAdicionar = document.getElementById("btnAdicionarProduto");
    const btnSalvar = document.getElementById("btnSalvarProduto");
    const inputValor = document.getElementById("valor_unitario");
    const inputDesconto = document.getElementById("desconto");
    const btnEditar = document.querySelector(".btn-cadastrar-produtos.editar");
    const inputImagem = document.getElementById("imagem");
    const imgPreview = document.getElementById("img-preview");
    const previewEmpty = document.querySelector(".preview-empty");
    const btnCarregar = document.getElementById("btnCarregarImagem");
    const btnRemover = document.getElementById("btnRemoverImagem");
    const formulario = document.getElementById("formCadastroProduto");
    const modalSemImagem = document.getElementById("modalSemImagem");

    let produtoEmEdicao = null;
    let dadosOriginais = {};
    let imagemOriginal = "";
    let permitirEnvioSemImagem = false;

    let modalInstancia = null;
    if (modalSemImagem) {
        modalInstancia = bootstrap.Modal.getOrCreateInstance(modalSemImagem);
    }

    // =========================================
    // FUNÇÃO PARA CADASTRAR VIA AJAX
    // =========================================
    function cadastrarProdutoViaAjax() {
        const formData = new FormData(formulario);
        const csrfInput = document.querySelector("[name=csrfmiddlewaretoken]");

        // Pega o action do form (ex: /produtos/) ou usa '/produtos/' diretamente
        const urlEnvio = formulario.getAttribute("action") || "/produtos/";

        fetch(urlEnvio, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfInput ? csrfInput.value : ""
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "ok") {
                mostrarAlerta(data.mensagem || "Produto cadastrado com sucesso!", "sucesso");

                limparFormularioProduto();
                permitirEnvioSemImagem = false;

                return fetch("/produtos/atualizar-tabela/");
            } else {
                mostrarAlerta(data.mensagem || "Erro ao cadastrar produto.", "erro");
            }
        })
        .then(response => response ? response.text() : null)
        .then(html => {
            if (html) {
                document.getElementById("tabelaProdutosBody").innerHTML = html;
                inicializarEventosTabela();
            }
        })
        .catch(error => {
            console.error("Erro no cadastro:", error);
            mostrarAlerta("Erro ao processar o cadastro do produto.", "erro");
        });
    }

    // =========================================
    // EVENTO SUBMIT DO FORMULÁRIO
    // =========================================
    if (formulario) {
        formulario.addEventListener("submit", function (e) {
            e.preventDefault(); // Impede o reload da página!

            if (produtoEmEdicao) {
                mostrarAlerta(
                    "Você está editando um produto. Utilize o botão 'Atualizar' para salvar as alterações.",
                    "erro"
                );
                return;
            }

            // Valida imagem no cadastro
            if (inputImagem && !inputImagem.files.length && !permitirEnvioSemImagem) {
                if (modalInstancia) {
                    modalInstancia.show();
                }
                return;
            }

            // Se passou das validações, envia por AJAX
            cadastrarProdutoViaAjax();
        });
    }

    const btnConfirmarSemImagem = document.getElementById("btnConfirmarSemImagem");
    if (btnConfirmarSemImagem) {
        btnConfirmarSemImagem.addEventListener("click", function () {
            permitirEnvioSemImagem = true;
            if (modalInstancia) {
                modalInstancia.hide();
            }
            cadastrarProdutoViaAjax();
        });
    }

    // Modais e Máscaras
    if (btnEditar) {
        btnEditar.addEventListener("click", function () {
            const modalElemento = document.getElementById("modalTabelaProdutos");
            if (modalElemento) {
                const modal = bootstrap.Modal.getOrCreateInstance(modalElemento);
                modal.show();
            }
        });
    }

    if (inputDesconto) aplicarMascaraPorcentagem(inputDesconto);
    if (inputValor) aplicarMascaraMoeda(inputValor);

    if (btnSalvar) {
        btnSalvar.disabled = true;
    }

    if (btnAdicionar) {
        btnAdicionar.addEventListener("click", function () {

            if (produtoEmEdicao) {
                mostrarAlerta(
                    "Você está editando um produto. Utilize o botão 'Atualizar' para salvar as alterações.",
                    "erro"
                );
                return;
            }

            let nome = (document.getElementById("nome")?.value || "").trim();
            let quantidade = Number(document.getElementById("quantidade")?.value || 0);
            let valorUnitario = document.getElementById("valor_unitario")?.value || "";
            let desconto = document.getElementById("desconto")?.value || "";
            let dataCadastro = document.getElementById("data_cadastro")?.value || "";
            let descricao = (document.getElementById("descricao")?.value || "").trim();

            desconto = Number(desconto.replace("%", "").trim()) || 0;
            valorUnitario = Number(
                valorUnitario
                    .replace("R$", "")
                    .replace(/\./g, "")
                    .replace(",", ".")
                    .trim()
            ) || 0;

            // Validações
            if (!nome) {
                mostrarAlerta("Informe o nome do produto.", "erro");
                marcarErro(document.getElementById("nome"));
                return;
            }

            if (!quantidade || quantidade <= 0) {
                mostrarAlerta("Informe uma quantidade válida.", "erro");
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

            // Cálculos
            let totalSemDesconto = quantidade * valorUnitario;
            let valorDesconto = totalSemDesconto * (desconto / 100);
            let totalComDesconto = totalSemDesconto - valorDesconto;

            // Resumo
            document.getElementById("resumo-sem-desconto").innerText = formatarMoeda(totalSemDesconto);
            document.getElementById("resumo-desconto").innerText = formatarMoeda(valorDesconto);
            document.getElementById("resumo-total").innerText = formatarMoeda(totalComDesconto);
            document.getElementById("resumo-quantidade").innerText = quantidade;

            // Gerar Código
            let campoCodigo = document.getElementById("codigo");
            if (campoCodigo && !campoCodigo.value) {
                campoCodigo.value = gerarCodigoProduto();
            }

            if (btnSalvar) {
                btnSalvar.disabled = false;
            }
        });
    }

    // Upload de Imagem
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

    // Eventos da Tabela
    inicializarEventosTabela();

    document.addEventListener("click", function (e) {
        const modal = document.getElementById("modalTabelaProdutos");
        if (!modal) return;

        const modalAberto = modal.classList.contains("show");
        const clicouNaTabela = e.target.closest("#modalTabelaProdutos tbody tr");
        const clicouNosBotoes = e.target.closest(".acoes-tabela-produtos");

        if (modalAberto && !clicouNaTabela && !clicouNosBotoes) {
            document
                .querySelectorAll("#modalTabelaProdutos input[type='radio']")
                .forEach(radio => radio.checked = false);

            document
                .querySelectorAll("#modalTabelaProdutos tbody tr")
                .forEach(tr => tr.classList.remove("produto-selecionado"));
        }
    });

    // Apagar Produto
    const btnApagarProduto = document.getElementById("btnApagarProduto");
    let produtoParaApagar = null;

    if (btnApagarProduto) {
        btnApagarProduto.addEventListener("click", function () {
            const radioSelecionado = document.querySelector(
                "#modalTabelaProdutos input[type='radio']:checked"
            );

            if (!radioSelecionado) {
                mostrarAlerta("Selecione um produto para apagar.", "erro");
                return;
            }

            produtoParaApagar = radioSelecionado.closest("tr");
            const modalElemento = document.getElementById("modalApagarProduto");

            if (modalElemento) {
                const backdrop = document.createElement("div");
                backdrop.className = "backdrop-confirmacao";
                document.body.appendChild(backdrop);

                const modalApagar = bootstrap.Modal.getOrCreateInstance(
                    modalElemento,
                    { backdrop: false }
                );

                modalApagar.show();
            }
        });
    }

    const btnConfirmarApagarProduto = document.getElementById("btnConfirmarApagarProduto");

    if (btnConfirmarApagarProduto) {
        btnConfirmarApagarProduto.addEventListener("click", function () {
            if (!produtoParaApagar) return;

            const id = produtoParaApagar.dataset.id;
            const csrfInput = document.querySelector("[name=csrfmiddlewaretoken]");

            fetch(`/produtos/apagar/${id}/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfInput ? csrfInput.value : "",
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === "ok") {
                    produtoParaApagar.remove();
                    const modalElemento = document.getElementById("modalApagarProduto");
                    if (modalElemento) {
                        const modal = bootstrap.Modal.getInstance(modalElemento);
                        if (modal) modal.hide();
                    }
                    document.querySelector(".backdrop-confirmacao")?.remove();
                    mostrarAlerta("Produto apagado com sucesso.", "sucesso");
                } else {
                    mostrarAlerta(data.mensagem || "Erro ao apagar produto.", "erro");
                }
            })
            .catch(error => {
                console.error(error);
                mostrarAlerta("Erro ao apagar produto.", "erro");
            });
        });
    }

    const modalApagarElemento = document.getElementById("modalApagarProduto");
    if (modalApagarElemento) {
        modalApagarElemento.addEventListener("hidden.bs.modal", function () {
            document.querySelector(".backdrop-confirmacao")?.remove();
        });
    }

    // Carregar para Edição
    const btnAtualizarProduto = document.getElementById("btnAtualizarProduto");
    if (btnAtualizarProduto) {
        btnAtualizarProduto.addEventListener("click", function () {
            const radioSelecionado = document.querySelector(
                "#modalTabelaProdutos input[type='radio']:checked"
            );

            if (!radioSelecionado) {
                mostrarAlerta("Selecione um produto para carregar.", "erro");
                return;
            }

            const linha = radioSelecionado.closest("tr");

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

            dadosOriginais = {
                nome: (linha.dataset.nome || "").trim(),
                quantidade: (linha.dataset.quantidade || "").trim(),
                valor: valorTratado,
                desconto: descontoTratado,
                data: (linha.dataset.data || "").trim(),
                descricao: (linha.dataset.descricao || "").trim(),
                imagem: imagemOriginal
            };

            document.getElementById("nome").value = linha.dataset.nome || "";
            document.getElementById("quantidade").value = linha.dataset.quantidade || "";

            let valorNum = parseFloat(linha.dataset.valor || 0);
            document.getElementById("valor_unitario").value = formatarMoeda(valorNum);

            let descontoNum = parseFloat(linha.dataset.desconto || 0);
            document.getElementById("desconto").value = descontoNum + "%";

            document.getElementById("codigo").value = linha.dataset.codigo || "";
            document.getElementById("data_cadastro").value = linha.dataset.data || "";
            document.getElementById("descricao").value = linha.dataset.descricao || "";

            const quantidadeNum = Number(linha.dataset.quantidade || 0);
            const totalSem = quantidadeNum * valorNum;
            const valorDesconto = totalSem * (descontoNum / 100);
            const totalCom = totalSem - valorDesconto;

            document.getElementById("resumo-sem-desconto").innerText = formatarMoeda(totalSem);
            document.getElementById("resumo-desconto").innerText = formatarMoeda(valorDesconto);
            document.getElementById("resumo-total").innerText = formatarMoeda(totalCom);
            document.getElementById("resumo-quantidade").innerText = quantidadeNum;

            if (imagem && imgPreview) {
                imgPreview.src = imagem;
                imgPreview.style.display = "block";
                if (previewEmpty) previewEmpty.style.display = "none";
            } else if (imgPreview) {
                imgPreview.src = "";
                imgPreview.style.display = "none";
                if (previewEmpty) previewEmpty.style.display = "flex";
            }

            const modalTabelaEl = document.getElementById("modalTabelaProdutos");
            if (modalTabelaEl) {
                const modalTabela = bootstrap.Modal.getInstance(modalTabelaEl);
                if (modalTabela) modalTabela.hide();
            }

            if (btnSalvar) btnSalvar.disabled = false;
        });
    }

    // Sair da Edição e Limpar
    const btnSairModoEdicao = document.getElementById("btnSairModoEdicao");
    if (btnSairModoEdicao) {
        btnSairModoEdicao.addEventListener("click", function () {
            if (!produtoEmEdicao) {
                mostrarAlerta("Você não está no modo edição.", "erro");
                return;
            }
            sairModoEdicaoProduto();
        });
    }

    const btnApagarFormulario = document.getElementById("btnApagarFormulario");
    if (btnApagarFormulario) {
        btnApagarFormulario.addEventListener("click", function () {
            const possuiDados =
                document.getElementById("nome").value ||
                document.getElementById("quantidade").value ||
                document.getElementById("valor_unitario").value ||
                document.getElementById("descricao").value ||
                produtoEmEdicao;

            if (!possuiDados) {
                mostrarAlerta("O formulário já está vazio.", "erro");
                return;
            }

            limparFormularioProduto();
            mostrarAlerta("Formulário limpo com sucesso.", "sucesso");
        });
    }

    const btnAtualizarTabela = document.getElementById("btnAtualizarTabela");
    if (btnAtualizarTabela) {
        btnAtualizarTabela.addEventListener("click", function () {
            fetch("/produtos/atualizar-tabela/")
                .then(response => response.text())
                .then(html => {
                    document.getElementById("tabelaProdutosBody").innerHTML = html;
                    mostrarAlerta("Tabela atualizada com sucesso.", "sucesso");
                    inicializarEventosTabela();
                })
                .catch(error => {
                    console.error(error);
                    mostrarAlerta("Erro ao atualizar a tabela.", "erro");
                });
        });
    }

    const btnVisualizarImagem = document.getElementById("btnVisualizarImagem");
    if (btnVisualizarImagem) {
        btnVisualizarImagem.addEventListener("click", function () {
            const radioSelecionado = document.querySelector(
                "#modalTabelaProdutos input[type='radio']:checked"
            );

            if (!radioSelecionado) {
                mostrarAlerta("Selecione um produto.", "erro");
                return;
            }

            const linha = radioSelecionado.closest("tr");
            const imagem = linha.dataset.imagem;
            const img = document.getElementById("imagemProdutoModal");
            const msg = document.getElementById("mensagemSemImagem");

            if (imagem) {
                img.src = imagem;
                img.style.display = "block";
                msg.style.display = "none";
            } else {
                img.style.display = "none";
                msg.style.display = "block";
            }

            bootstrap.Modal
                .getOrCreateInstance(document.getElementById("modalVisualizarImagem"))
                .show();
        });
    }

    // Botão Atualizar (Edição)
    const btnAtualizar = document.querySelector(".btn-cadastrar-produtos.atualizar");
    if (btnAtualizar) {
        btnAtualizar.addEventListener("click", function () {
            if (!produtoEmEdicao) {
                mostrarAlerta(
                    "Nenhum produto selecionado para atualização. Primeiro selecione um produto através do botão Editar.",
                    "erro"
                );
                return;
            }

            const nome = (document.getElementById("nome")?.value || "").trim();
            const quantidade = (document.getElementById("quantidade")?.value || "").trim();
            const valorRaw = document.getElementById("valor_unitario")?.value || "";
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

            const data = document.getElementById("data_cadastro")?.value || "";
            const descricao = (document.getElementById("descricao")?.value || "").trim();

            const inputImg = document.getElementById("imagem");
            const imagemAtual = (inputImg && inputImg.files && inputImg.files.length > 0)
                ? inputImg.files[0].name
                : (typeof imagemOriginal !== "undefined" ? imagemOriginal : "");

            const houveAlteracao =
                nome !== String(dadosOriginais.nome || "") ||
                quantidade !== String(dadosOriginais.quantidade || "") ||
                valor !== String(dadosOriginais.valor || "") ||
                desconto !== String(dadosOriginais.desconto || "") ||
                data !== String(dadosOriginais.data || "") ||
                descricao !== String(dadosOriginais.descricao || "") ||
                imagemAtual !== String(dadosOriginais.imagem || "");

            if (!houveAlteracao) {
                mostrarAlerta("Não foi feita nenhuma alteração no produto para atualizar.", "erro");
                return;
            }

            const formData = new FormData(formulario);
            const csrfInput = document.querySelector("[name=csrfmiddlewaretoken]");

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
                    mostrarAlerta("Produto atualizado com sucesso.", "sucesso");
                    limparFormularioProduto();
                } else {
                    mostrarAlerta(data.mensagem || "Erro ao atualizar produto.", "erro");
                }
            })
            .catch(error => {
                console.error(error);
                mostrarAlerta("Erro ao atualizar produto.", "erro");
            });
        });
    }

    // Filtros e Ordenação
    const btnAbrirFiltro = document.getElementById("btnAbrirFiltro");
    if (btnAbrirFiltro) {
        btnAbrirFiltro.addEventListener("click", () => {
            const modalElemento = document.getElementById("modalFiltrarProdutos");
            if (modalElemento) {
                bootstrap.Modal.getOrCreateInstance(modalElemento, { backdrop: false }).show();
            }
        });
    }

    const btnExecutarFiltro = document.getElementById("btnExecutarFiltro");
    if (btnExecutarFiltro) btnExecutarFiltro.addEventListener("click", filtrarProdutos);

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

    const btnAbrirOrdenacao = document.getElementById("btnAbrirOrdenacao");
    if (btnAbrirOrdenacao) {
        btnAbrirOrdenacao.addEventListener("click", () => {
            bootstrap.Modal.getOrCreateInstance(document.getElementById("modalOrdenarProdutos")).show();
        });
    }

    const btnExecutarOrdenacao = document.getElementById("btnExecutarOrdenacao");
    if (btnExecutarOrdenacao) {
        btnExecutarOrdenacao.addEventListener("click", ordenarProdutos);
    }

    async function ordenarProdutos() {
        const direcao = document.getElementById("tipoOrdenacao").value;
        const resposta = await fetch(`/produtos/atualizar-tabela/?ordem=${direcao}`);
        const html = await resposta.text();

        document.getElementById("tabelaProdutosBody").innerHTML = html;
        inicializarEventosTabela();
        bootstrap.Modal.getInstance(document.getElementById("modalOrdenarProdutos")).hide();
    }

    async function filtrarProdutos() {
        const tipo = document.getElementById("tipoFiltro").value;
        const valor = document.getElementById("valorFiltro").value;

        if (valor.trim() === "") return;

        const resposta = await fetch(
            `/produtos/atualizar-tabela/?tipo=${encodeURIComponent(tipo)}&valor=${encodeURIComponent(valor)}`
        );
        const html = await resposta.text();

        document.getElementById("tabelaProdutosBody").innerHTML = html;
        inicializarEventosTabela();
        bootstrap.Modal.getInstance(document.getElementById("modalFiltrarProdutos")).hide();
    }

    function inicializarEventosTabela() {
        document.querySelectorAll("#modalTabelaProdutos tbody tr").forEach(linha => {
            linha.addEventListener("click", function () {
                const radio = this.querySelector('input[type="radio"]');
                if (!radio) return;

                document
                    .querySelectorAll("#modalTabelaProdutos tbody tr")
                    .forEach(tr => tr.classList.remove("produto-selecionado"));

                radio.checked = true;
                this.classList.add("produto-selecionado");
                radio.dispatchEvent(new Event("change"));
            });
        });
    }

    function limparFormularioProduto() {
        produtoEmEdicao = null;
        dadosOriginais = {};
        imagemOriginal = "";

        if (formulario) formulario.reset();

        const campoCodigo = document.getElementById("codigo");
        if (campoCodigo) campoCodigo.value = "";

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

        if (btnSalvar) btnSalvar.disabled = true;
    }

    function sairModoEdicaoProduto() {
        produtoEmEdicao = null;
        dadosOriginais = {};
        imagemOriginal = "";

        if (formulario) formulario.reset();

        const codigo = document.getElementById("codigo");
        if (codigo) codigo.value = "";

        if (imgPreview) {
            imgPreview.src = "";
            imgPreview.style.display = "none";
        }

        if (previewEmpty) previewEmpty.style.display = "flex";
        if (inputImagem) inputImagem.value = "";

        document.getElementById("resumo-sem-desconto").innerText = "R$ 0,00";
        document.getElementById("resumo-desconto").innerText = "R$ 0,00";
        document.getElementById("resumo-total").innerText = "R$ 0,00";
        document.getElementById("resumo-quantidade").innerText = "0";

        if (btnSalvar) btnSalvar.disabled = true;

        mostrarAlerta("Modo edição encerrado. Você pode cadastrar um novo produto.", "sucesso");
    }

});

// Helpers Utilitários (fora do DOMContentLoaded)
function formatarMoeda(valor) {
    valor = Number(valor);
    if (isNaN(valor)) valor = 0;
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function gerarCodigoProduto() {
    let numero = Math.floor(Math.random() * 999999);
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
    input.addEventListener("pointerdown", () => {
        input.classList.remove("input-erro");
    }, { once: true });
}
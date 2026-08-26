document.addEventListener("DOMContentLoaded", () => {
    /* =====================================================
       ELEMENTOS GERAIS E ABAS DA TABELA
    ===================================================== */
    const btnJuridico = document.getElementById("btnClientesJuridicos");
    const btnFisico = document.getElementById("btnClientesFisicos");

    /* =====================================================
       ELEMENTOS DO MODAL 1: CADASTRAR
    ===================================================== */
    const btnAbrirCadastro = document.getElementById("btnAbrirCadastroCliente");
    const modalCadastrarElement = document.getElementById("modalCadastrarCliente");
    const tipoCliente = document.getElementById("tipoCliente");
    const tituloModal = document.getElementById("tituloModalCliente");
    const camposJuridicos = document.querySelectorAll("#modalCadastrarCliente .campo-juridico");
    const btnCadastrarCliente = document.getElementById("btnCadastrarCliente");

    const modalCadastro = modalCadastrarElement
        ? bootstrap.Modal.getOrCreateInstance(modalCadastrarElement)
        : null;

    /* =====================================================
       ELEMENTOS DO MODAL DE RELATÓRIO
    ===================================================== */
    const btnAbrirRelatorio = document.querySelector(".btn-cliente.relatorio");
    const modalRelatorioElement = document.getElementById("modalRelatorioCliente");
    const tituloModalRelatorio = document.getElementById("tituloModalRelatorio");
    const checkSelecionarTodos = document.getElementById("checkSelecionarTodosRelatorio");
    const containerCheckboxes = document.getElementById("containerCheckboxesRelatorio");
    const checksColunasJuridicas = document.querySelectorAll(".check-col-juridico");

    const modalRelatorio = modalRelatorioElement
        ? bootstrap.Modal.getOrCreateInstance(modalRelatorioElement)
        : null;

    /* =====================================================
       ELEMENTOS DO MODAL 2: EDITAR
    ===================================================== */
    const btnEditarCliente = document.querySelector(".btn-cliente.editar");
    const modalEditarElement = document.getElementById("modalEditarCadastroCliente");
    const btnAtualizarCliente = document.getElementById("btnAtualizarCliente");
    const camposJuridicosEditar = document.querySelectorAll(".campo-juridico-editar");

    const modalEdicao = modalEditarElement
        ? bootstrap.Modal.getOrCreateInstance(modalEditarElement)
        : null;

    /* =====================================================
       ELEMENTOS DO MODAL DE CONFIRMAÇÃO DE SENHA (SENSÍVEL)
    ===================================================== */
    const modalSenhaSensivelElement = document.getElementById("modalConfirmarSenhaDadosSensiveis");
    const btnConfirmarAlteracaoSensivel = document.getElementById("btnConfirmarAlteracaoSensivel");
    const inputSenhaConfirmacaoSensivel = document.getElementById("senhaConfirmacaoSensivel");

    const modalSenhaSensivel = modalSenhaSensivelElement
        ? bootstrap.Modal.getOrCreateInstance(modalSenhaSensivelElement)
        : null;

    let clienteSelecionadoTr = null;
    let clienteOriginal = {};

    /* =====================================================
       FORMATAÇÃO INICIAL DE TODAS AS LINHAS DA TABELA
    ===================================================== */
    document.querySelectorAll(".linha-cliente").forEach(tr => {
        const celulaValor = tr.querySelector(".col-valor-gasto");
        const valorOriginal = tr.dataset.valorGasto || (celulaValor ? celulaValor.textContent : "0");

        if (celulaValor && typeof formatarMoeda === "function") {
            celulaValor.textContent = formatarMoeda(valorOriginal);
        }
    });

    /* =====================================================
       FUNÇÕES AUXILIARES DE COMPARAÇÃO E NORMALIZAÇÃO
    ===================================================== */
    function normalizarValor(val) {
        if (val === null || val === undefined) return "";
        return String(val)
            .replace(/^R\$\s?/, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function salvarEstadoOriginal() {
        const formulario = document.getElementById("formEditarCliente");
        if (!formulario) return;

        clienteOriginal = {};

        formulario.querySelectorAll("input, select, textarea").forEach(campo => {
            const chave = campo.name || campo.id;
            if (chave) {
                clienteOriginal[chave] = normalizarValor(campo.value);
            }
        });
    }

    function houveAlteracao() {
        const formulario = document.getElementById("formEditarCliente");
        if (!formulario) return false;

        let mudou = false;

        formulario.querySelectorAll("input, select, textarea").forEach(campo => {
            const chave = campo.name || campo.id;
            if (!chave) return;

            const valorAtual = normalizarValor(campo.value);
            const valorOriginal = normalizarValor(clienteOriginal[chave] || "");

            if (valorAtual !== valorOriginal) {
                mudou = true;
            }
        });

        return mudou;
    }

    function alterouDadosSensiveis() {
        const formulario = document.getElementById("formEditarCliente");
        if (!formulario) return false;

        const pegarValor = (idOuNome) => {
            const el = formulario.querySelector(`[name='${idOuNome}'], #${idOuNome}`);
            return normalizarValor(el?.value);
        };

        const modoAtual = pegarValor("modo_valor_gasto") || pegarValor("editarClienteModoValorGasto");
        const valorGastoAtual = pegarValor("valor_gasto") || pegarValor("editarClienteValorGasto");
        const ultimaCompraAtual = pegarValor("ultima_compra") || pegarValor("editarClienteUltimaCompra");
        const ultimaAtualizacaoAtual = pegarValor("ultima_atualizacao") || pegarValor("editarClienteUltimaAtualizacao");

        const modoOriginal = normalizarValor(clienteOriginal["modo_valor_gasto"] || clienteOriginal["editarClienteModoValorGasto"]);
        const valorOriginal = normalizarValor(clienteOriginal["valor_gasto"] || clienteOriginal["editarClienteValorGasto"]);
        const compraOriginal = normalizarValor(clienteOriginal["ultima_compra"] || clienteOriginal["editarClienteUltimaCompra"]);
        const atualizacaoOriginal = normalizarValor(clienteOriginal["ultima_atualizacao"] || clienteOriginal["editarClienteUltimaAtualizacao"]);

        return (
            modoAtual !== modoOriginal ||
            valorGastoAtual !== valorOriginal ||
            ultimaCompraAtual !== compraOriginal ||
            ultimaAtualizacaoAtual !== atualizacaoOriginal
        );
    }

    /* =====================================================
       ABRIR MODAL DE CADASTRO
    ===================================================== */
    if (btnAbrirCadastro) {
        btnAbrirCadastro.addEventListener("click", () => {
            const form = document.getElementById("formCadastrarCliente");
            if (form) form.reset();

            const tipoAtual = tipoCliente ? tipoCliente.value : "juridico";
            if (tipoAtual === "juridico") {
                if (tituloModal) tituloModal.textContent = "Cadastrar Cliente Jurídico";
                camposJuridicos.forEach(campo => {
                    campo.style.display = "";
                });
            } else {
                if (tituloModal) tituloModal.textContent = "Cadastrar Cliente Físico";
                camposJuridicos.forEach(campo => {
                    campo.style.display = "none";
                });
            }

            if (modalCadastro) modalCadastro.show();
        });
    }

    /* =====================================================
       SELECIONAR CLIENTE JURÍDICO (ABAS DA PÁGINA)
    ===================================================== */
    if (btnJuridico) {
        btnJuridico.addEventListener("click", () => {
            if (tipoCliente) tipoCliente.value = "juridico";
            btnJuridico.classList.add("ativo");
            if (btnFisico) btnFisico.classList.remove("ativo");

            const paginaJuridicos = document.getElementById("juridicos");
            const paginaFisicos = document.getElementById("fisicos");
            if (paginaJuridicos) paginaJuridicos.classList.add("ativa");
            if (paginaFisicos) paginaFisicos.classList.remove("ativa");

            camposJuridicos.forEach(campo => {
                campo.style.display = "";
            });
        });
    }

    /* =====================================================
       SELECIONAR CLIENTE FÍSICO (ABAS DA PÁGINA)
    ===================================================== */
    if (btnFisico) {
        btnFisico.addEventListener("click", () => {
            if (tipoCliente) tipoCliente.value = "fisico";
            btnFisico.classList.add("ativo");
            if (btnJuridico) btnJuridico.classList.remove("ativo");

            const paginaJuridicos = document.getElementById("juridicos");
            const paginaFisicos = document.getElementById("fisicos");
            if (paginaFisicos) paginaFisicos.classList.add("ativa");
            if (paginaJuridicos) paginaJuridicos.classList.remove("ativa");

            camposJuridicos.forEach(campo => {
                campo.style.display = "none";
            });
        });
    }

    /* =====================================================
       1. SELEÇÃO DE LINHA NA TABELA
    ===================================================== */
    function inicializarSelecaoTabela() {
        const linhas = document.querySelectorAll(".clientes-table tbody tr.linha-cliente");

        linhas.forEach(linha => {
            linha.addEventListener("click", function (e) {
                e.stopPropagation();

                if (this.classList.contains("linha-selecionada")) {
                    this.classList.remove("linha-selecionada");
                    clienteSelecionadoTr = null;
                    return;
                }

                linhas.forEach(l => l.classList.remove("linha-selecionada"));
                this.classList.add("linha-selecionada");
                clienteSelecionadoTr = this;
            });
        });
    }

    inicializarSelecaoTabela();

    /* =====================================================
       DESSELECIONAR AO CLICAR FORA DAS LINHAS
    ===================================================== */
    document.addEventListener("click", (evento) => {
        if (!clienteSelecionadoTr) return;

        const clicouNaLinha = evento.target.closest(".clientes-table tbody tr.linha-cliente");
        const clicouNasAcoes = evento.target.closest(".clientes-acoes");
        const clicouNoModal = evento.target.closest(".modal");

        if (!clicouNaLinha && !clicouNasAcoes && !clicouNoModal) {
            document
                .querySelectorAll(".clientes-table tbody tr.linha-cliente")
                .forEach(linha => {
                    linha.classList.remove("linha-selecionada");
                });

            clienteSelecionadoTr = null;
        }
    });

    /* =====================================================
       2. ABRIR MODAL DE EDIÇÃO
    ===================================================== */
    if (btnEditarCliente) {
        btnEditarCliente.addEventListener("click", (e) => {
            e.stopPropagation();

            if (!clienteSelecionadoTr) {
                mostrarAlerta("Selecione um cliente na tabela para editar.", "erro");
                return;
            }

            preencherModalParaEdicao(clienteSelecionadoTr);
        });
    }

    function preencherModalParaEdicao(tr) {
        const ds = tr.dataset;

        const inputId = document.getElementById("editarClienteId");
        const tituloEdicao = document.getElementById("tituloModalEditarCliente");
        const inputTipo = document.getElementById("editarTipoCliente");

        if (inputId) inputId.value = ds.id || "";
        if (tituloEdicao) tituloEdicao.textContent = `Editar Cliente: ${ds.nome || ""}`;
        if (inputTipo) inputTipo.value = ds.tipo || "juridico";

        if (document.getElementById("editarClienteNome")) document.getElementById("editarClienteNome").value = ds.nome || "";
        if (document.getElementById("editarClienteRazaoSocial")) document.getElementById("editarClienteRazaoSocial").value = ds.razao || "";
        if (document.getElementById("editarClienteCnpj")) document.getElementById("editarClienteCnpj").value = ds.cnpj || "";
        if (document.getElementById("editarClienteRg")) document.getElementById("editarClienteRg").value = ds.rg || "";
        if (document.getElementById("editarClienteCpf")) document.getElementById("editarClienteCpf").value = ds.cpf || "";
        if (document.getElementById("editarClienteEmail")) document.getElementById("editarClienteEmail").value = ds.email || "";
        if (document.getElementById("editarClienteTelefone")) document.getElementById("editarClienteTelefone").value = ds.telefone || "";

        if (document.getElementById("editarClienteCnh")) document.getElementById("editarClienteCnh").value = ds.cnh || "";
        if (document.getElementById("editarClienteCategoriaCnh")) document.getElementById("editarClienteCategoriaCnh").value = ds.categoriaCnh || "";
        if (document.getElementById("editarClienteEmissaoCnh")) document.getElementById("editarClienteEmissaoCnh").value = ds.emissaoCnh || "";
        if (document.getElementById("editarClienteVencimentoCnh")) document.getElementById("editarClienteVencimentoCnh").value = ds.vencimentoCnh || "";

        if (document.getElementById("editarClienteCep")) document.getElementById("editarClienteCep").value = ds.cep || "";
        if (document.getElementById("editarClienteEstado")) document.getElementById("editarClienteEstado").value = ds.estado || "";
        if (document.getElementById("editarClienteEndereco")) document.getElementById("editarClienteEndereco").value = ds.endereco || "";
        if (document.getElementById("editarClienteNumero")) document.getElementById("editarClienteNumero").value = ds.numero || "";
        if (document.getElementById("editarClienteComplemento")) document.getElementById("editarClienteComplemento").value = ds.complemento || "";
        if (document.getElementById("editarClienteCidade")) document.getElementById("editarClienteCidade").value = ds.cidade || "";
        if (document.getElementById("editarClienteBairro")) document.getElementById("editarClienteBairro").value = ds.bairro || "";

        if (document.getElementById("editarClienteStatus")) document.getElementById("editarClienteStatus").value = ds.status || "ativo";
        if (document.getElementById("editarClienteCategoria")) document.getElementById("editarClienteCategoria").value = ds.categoria || "";

        /* === CAMPOS ADICIONAIS DE EDIÇÃO E HISTÓRICO === */
        if (document.getElementById("editarClienteModoValorGasto")) {
            document.getElementById("editarClienteModoValorGasto").value = ds.modoValorGasto || "Automático (somar produtos)";
        }

        const inputValorGasto = document.getElementById("editarClienteValorGasto");
        if (inputValorGasto) {
            inputValorGasto.value = typeof formatarMoeda === "function" ? formatarMoeda(ds.valorGasto || "0,00") : (ds.valorGasto || "0,00");
        }

        const inputUltimaAtualizacao = document.getElementById("editarClienteUltimaAtualizacao");
        if (inputUltimaAtualizacao) {
            inputUltimaAtualizacao.value = typeof formatarDataHoraBR === "function" ? formatarDataHoraBR(ds.ultimaAtualizacao) : (ds.ultimaAtualizacao || "-");
        }

        const inputUltimaCompra = document.getElementById("editarClienteUltimaCompra");
        if (inputUltimaCompra) {
            inputUltimaCompra.value = typeof formatarDataHoraBR === "function" ? formatarDataHoraBR(ds.ultimaCompra) : (ds.ultimaCompra || "-");
        }

        if (ds.tipo === "juridico") {
            camposJuridicosEditar.forEach(c => c.style.display = "");
        } else {
            camposJuridicosEditar.forEach(c => c.style.display = "none");
        }

        if (typeof aplicarMascarasFormulario === "function") {
            aplicarMascarasFormulario();
        }

        salvarEstadoOriginal();

        if (modalEdicao) modalEdicao.show();
    }

    /* =====================================================
       MARCAR ERRO NO INPUT
    ===================================================== */
    function marcarErroCliente(input) {
        if (!input) return;

        let nomeCampo = "Este campo";
        const containerCampo = input.closest(".campo") || input.parentElement;
        if (containerCampo) {
            const label = containerCampo.querySelector("label");
            if (label) {
                nomeCampo = `O campo ${label.innerText.replace("*", "").trim()}`;
            }
        }

        input.classList.add("input-erro");
        input.focus();

        mostrarAlerta(`${nomeCampo} precisa ser preenchido.`, "erro");

        const removerErro = () => {
            input.classList.remove("input-erro");
        };

        input.addEventListener("input", removerErro, { once: true });
        input.addEventListener("change", removerErro, { once: true });
        input.addEventListener("pointerdown", removerErro, { once: true });
    }

    /* =====================================================
       VALIDAÇÃO DOS CAMPOS OBRIGATÓRIOS
    ===================================================== */
    function validarFormularioCliente(formulario) {
        const inputs = formulario.querySelectorAll("input, select, textarea");

        const camposCnh = Array.from(inputs).filter(i => {
            const nomeOuId = (i.name || i.id || "").toLowerCase();
            return nomeOuId.includes("cnh");
        });

        const cnhFoiPreenchida = camposCnh.some(el => el.value.trim() !== "");

        for (const input of inputs) {
            const nomeOuId = (input.name || input.id || "").toLowerCase();

            if (nomeOuId.includes("complemento")) {
                continue;
            }

            if (camposCnh.includes(input) && !cnhFoiPreenchida) {
                continue;
            }

            if (input.offsetParent === null && input.type !== "hidden") {
                continue;
            }

            if (input.value.trim() === "") {
                marcarErroCliente(input);
                return false;
            }
        }

        return true;
    }

    function inserirClienteNaTabela(c) {
        const tabelaContainer = c.tipo === "juridico"
            ? document.querySelector("#juridicos tbody")
            : document.querySelector("#fisicos tbody");

        if (!tabelaContainer) return;

        const linhaVazia = tabelaContainer.querySelector(".sem-registros-clientes");
        if (linhaVazia) {
            linhaVazia.closest("tr").remove();
        }

        const tr = document.createElement("tr");
        tr.classList.add("linha-cliente");

        const valorFormatado = typeof formatarMoeda === "function" ? formatarMoeda(c.valor_gasto) : `R$ ${c.valor_gasto}`;

        tr.dataset.id = c.id;
        tr.dataset.tipo = c.tipo;
        tr.dataset.nome = c.nome;
        tr.dataset.razao = c.razao === "-" ? "" : c.razao;
        tr.dataset.cnpj = c.cnpj === "-" ? "" : c.cnpj;
        tr.dataset.rg = c.rg === "-" ? "" : c.rg;
        tr.dataset.cpf = c.cpf === "-" ? "" : c.cpf;
        tr.dataset.email = c.email === "-" ? "" : c.email;
        tr.dataset.telefone = c.telefone === "-" ? "" : c.telefone;
        tr.dataset.cnh = c.cnh === "-" ? "" : c.cnh;
        tr.dataset.categoriaCnh = c.categoria_cnh === "-" ? "" : c.categoria_cnh;
        tr.dataset.emissaoCnh = c.emissao_cnh_raw || "";
        tr.dataset.vencimentoCnh = c.vencimento_cnh_raw || "";
        tr.dataset.cep = c.cep === "-" ? "" : c.cep;
        tr.dataset.estado = c.estado === "-" ? "" : c.estado;
        tr.dataset.endereco = c.endereco === "-" ? "" : c.endereco;
        tr.dataset.numero = c.numero === "-" ? "" : c.numero;
        tr.dataset.complemento = c.complemento === "-" ? "" : c.complemento;
        tr.dataset.cidade = c.cidade === "-" ? "" : c.cidade;
        tr.dataset.bairro = c.bairro === "-" ? "" : c.bairro;
        tr.dataset.status = c.status;
        tr.dataset.categoria = c.categoria === "-" ? "" : c.categoria;
        tr.dataset.modoValorGasto = c.modo_valor_gasto === "-" ? "" : c.modo_valor_gasto;
        tr.dataset.valorGasto = c.valor_gasto;
        tr.dataset.ultimaAtualizacao = c.ultima_atualizacao;
        tr.dataset.ultimaCompra = c.ultima_compra;

        if (c.tipo === "juridico") {
            tr.innerHTML = `
                <td>${c.nome}</td>
                <td>${c.razao}</td>
                <td>${c.data_inclusao}</td>
                <td>${c.cnpj}</td>
                <td>${c.rg}</td>
                <td>${c.cpf}</td>
                <td>${c.email}</td>
                <td>${c.cnh}</td>
                <td>${c.categoria_cnh}</td>
                <td>${c.emissao_cnh}</td>
                <td>${c.vencimento_cnh}</td>
                <td>${c.telefone}</td>
                <td>${c.cep}</td>
                <td>${c.endereco}</td>
                <td>${c.numero}</td>
                <td>${c.complemento}</td>
                <td>${c.cidade}</td>
                <td>${c.bairro}</td>
                <td>${c.estado}</td>
                <td>${c.status}</td>
                <td>${c.categoria}</td>
                <td>${c.ultima_atualizacao}</td>
                <td class="col-valor-gasto">${valorFormatado}</td>
                <td>${c.modo_valor_gasto}</td>
                <td>${c.ultima_compra}</td>
            `;
        } else {
            tr.innerHTML = `
                <td>${c.nome}</td>
                <td>${c.rg}</td>
                <td>${c.cpf}</td>
                <td>${c.email}</td>
                <td>${c.cnh}</td>
                <td>${c.categoria_cnh}</td>
                <td>${c.emissao_cnh}</td>
                <td>${c.vencimento_cnh}</td>
                <td>${c.telefone}</td>
                <td>${c.cep}</td>
                <td>${c.endereco}</td>
                <td>${c.numero}</td>
                <td>${c.complemento}</td>
                <td>${c.cidade}</td>
                <td>${c.bairro}</td>
                <td>${c.estado}</td>
                <td>${c.status}</td>
                <td>${c.categoria}</td>
                <td>${c.ultima_atualizacao}</td>
                <td class="col-valor-gasto">${valorFormatado}</td>
                <td>${c.modo_valor_gasto}</td>
                <td>${c.ultima_compra}</td>
            `;
        }

        tr.addEventListener("click", function (e) {
            e.stopPropagation();

            if (this.classList.contains("linha-selecionada")) {
                this.classList.remove("linha-selecionada");
                clienteSelecionadoTr = null;
                return;
            }

            document.querySelectorAll(".clientes-table tbody tr.linha-cliente").forEach(l => {
                l.classList.remove("linha-selecionada");
            });

            this.classList.add("linha-selecionada");
            clienteSelecionadoTr = this;
        });

        tabelaContainer.prepend(tr);
    }

    /* =====================================================
       AÇÃO 1: CADASTRAR CLIENTE (NOVO)
    ===================================================== */
    if (btnCadastrarCliente) {
        btnCadastrarCliente.addEventListener("click", async () => {
            const formulario = document.getElementById("formCadastrarCliente");

            if (!validarFormularioCliente(formulario)) {
                return;
            }

            const dados = new FormData(formulario);

            try {
                const resposta = await fetch("/clientes/cadastrar/", {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": obterCSRFToken()
                    },
                    body: dados
                });

                const resultado = await resposta.json();

                if (resultado.sucesso) {
                    mostrarAlerta(resultado.mensagem || "Cliente cadastrado com sucesso!", "sucesso");

                    if (resultado.cliente) {
                        inserirClienteNaTabela(resultado.cliente);
                    }

                    formulario.reset();
                    if (modalCadastro) modalCadastro.hide();

                } else {
                    mostrarAlerta(
                        resultado.mensagem || "Não foi possível cadastrar o cliente.",
                        "erro"
                    );
                }
            } catch (erro) {
                console.error("Erro ao cadastrar cliente:", erro);
                mostrarAlerta("Ocorreu um erro ao cadastrar o cliente.", "erro");
            }
        });
    }

    /* =====================================================
       REQUISIÇÃO UNIFICADA DE ATUALIZAÇÃO
    ===================================================== */
    async function executarAtualizacaoCliente(senhaSensivel = "") {
        const formulario = document.getElementById("formEditarCliente");
        const clienteIdInput = document.getElementById("editarClienteId");
        const clienteId = clienteIdInput ? clienteIdInput.value : null;

        if (!clienteId) {
            mostrarAlerta("Identificador do cliente não encontrado.", "erro");
            return;
        }

        const dados = new FormData(formulario);
        if (senhaSensivel) {
            dados.append("senha_confirmacao", senhaSensivel);
        }

        try {
            const resposta = await fetch(`/clientes/editar/${clienteId}/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": obterCSRFToken()
                },
                body: dados
            });

            const resultado = await resposta.json();

            if (resultado.sucesso) {
                mostrarAlerta(resultado.mensagem || "Cliente atualizado com sucesso!", "sucesso");

                if (modalSenhaSensivel) modalSenhaSensivel.hide();
                if (modalEdicao) modalEdicao.hide();

                // Atualiza em tempo real a linha da tabela
                if (clienteSelecionadoTr && resultado.cliente) {
                    const c = resultado.cliente;
                    const ds = clienteSelecionadoTr.dataset;
                    const valorFormatado = typeof formatarMoeda === "function" ? formatarMoeda(c.valor_gasto) : `R$ ${c.valor_gasto}`;

                    ds.nome = c.nome;
                    ds.razao = c.razao === "-" ? "" : c.razao;
                    ds.cnpj = c.cnpj === "-" ? "" : c.cnpj;
                    ds.rg = c.rg === "-" ? "" : c.rg;
                    ds.cpf = c.cpf === "-" ? "" : c.cpf;
                    ds.email = c.email === "-" ? "" : c.email;
                    ds.telefone = c.telefone === "-" ? "" : c.telefone;
                    ds.cnh = c.cnh === "-" ? "" : c.cnh;
                    ds.categoriaCnh = c.categoria_cnh === "-" ? "" : c.categoria_cnh;
                    ds.emissaoCnh = c.emissao_cnh_raw || "";
                    ds.vencimentoCnh = c.vencimento_cnh_raw || "";
                    ds.cep = c.cep === "-" ? "" : c.cep;
                    ds.estado = c.estado === "-" ? "" : c.estado;
                    ds.endereco = c.endereco === "-" ? "" : c.endereco;
                    ds.numero = c.numero === "-" ? "" : c.numero;
                    ds.complemento = c.complemento === "-" ? "" : c.complemento;
                    ds.cidade = c.cidade === "-" ? "" : c.cidade;
                    ds.bairro = c.bairro === "-" ? "" : c.bairro;
                    ds.status = c.status;
                    ds.categoria = c.categoria === "-" ? "" : c.categoria;
                    ds.ultimaAtualizacao = c.ultima_atualizacao;
                    ds.modoValorGasto = c.modo_valor_gasto;
                    ds.valorGasto = c.valor_gasto;
                    ds.ultimaCompra = c.ultima_compra;

                    if (c.tipo === "juridico") {
                        clienteSelecionadoTr.innerHTML = `
                            <td>${c.nome}</td>
                            <td>${c.razao}</td>
                            <td>${c.data_inclusao}</td>
                            <td>${c.cnpj}</td>
                            <td>${c.rg}</td>
                            <td>${c.cpf}</td>
                            <td>${c.email}</td>
                            <td>${c.cnh}</td>
                            <td>${c.categoria_cnh}</td>
                            <td>${c.emissao_cnh}</td>
                            <td>${c.vencimento_cnh}</td>
                            <td>${c.telefone}</td>
                            <td>${c.cep}</td>
                            <td>${c.endereco}</td>
                            <td>${c.numero}</td>
                            <td>${c.complemento}</td>
                            <td>${c.cidade}</td>
                            <td>${c.bairro}</td>
                            <td>${c.estado}</td>
                            <td>${c.status}</td>
                            <td>${c.categoria}</td>
                            <td>${c.ultima_atualizacao}</td>
                            <td class="col-valor-gasto">${valorFormatado}</td>
                            <td>${c.modo_valor_gasto}</td>
                            <td>${c.ultima_compra}</td>
                        `;
                    } else {
                        clienteSelecionadoTr.innerHTML = `
                            <td>${c.nome}</td>
                            <td>${c.rg}</td>
                            <td>${c.cpf}</td>
                            <td>${c.email}</td>
                            <td>${c.cnh}</td>
                            <td>${c.categoria_cnh}</td>
                            <td>${c.emissao_cnh}</td>
                            <td>${c.vencimento_cnh}</td>
                            <td>${c.telefone}</td>
                            <td>${c.cep}</td>
                            <td>${c.endereco}</td>
                            <td>${c.numero}</td>
                            <td>${c.complemento}</td>
                            <td>${c.cidade}</td>
                            <td>${c.bairro}</td>
                            <td>${c.estado}</td>
                            <td>${c.status}</td>
                            <td>${c.categoria}</td>
                            <td>${c.ultima_atualizacao}</td>
                            <td class="col-valor-gasto">${valorFormatado}</td>
                            <td>${c.modo_valor_gasto}</td>
                            <td>${c.ultima_compra}</td>
                        `;
                    }
                }
            } else {
                mostrarAlerta(resultado.mensagem || "Não foi possível atualizar o cliente.", "erro");
            }
        } catch (erro) {
            console.error("Erro ao atualizar cliente:", erro);
            mostrarAlerta("Ocorreu um erro ao atualizar o cliente.", "erro");
        }
    }

    /* =====================================================
       AÇÃO 2: ATUALIZAR CLIENTE (CLIQUE DO BOTÃO)
    ===================================================== */
    if (btnAtualizarCliente) {
        btnAtualizarCliente.addEventListener("click", async () => {
            const formulario = document.getElementById("formEditarCliente");
            const clienteIdInput = document.getElementById("editarClienteId");
            const clienteId = clienteIdInput ? clienteIdInput.value : null;

            if (!clienteId) {
                mostrarAlerta("Identificador do cliente não encontrado.", "erro");
                return;
            }

            if (!houveAlteracao()) {
                mostrarAlerta("Nenhuma informação foi alterada para atualizar.", "erro");
                return;
            }

            if (!validarFormularioCliente(formulario)) {
                return;
            }

            // Se alterou dados sensíveis, pede confirmação de senha
            if (alterouDadosSensiveis()) {
                if (inputSenhaConfirmacaoSensivel) inputSenhaConfirmacaoSensivel.value = "";
                if (modalSenhaSensivel) {
                    modalSenhaSensivel.show();
                }
                return;
            }

            // Se não alterou dados sensíveis, atualiza diretamente
            executarAtualizacaoCliente();
        });
    }

    /* =====================================================
       CONFIRMAR SENHA PARA DADOS SENSÍVEIS
    ===================================================== */
    if (btnConfirmarAlteracaoSensivel) {
        btnConfirmarAlteracaoSensivel.addEventListener("click", () => {
            const senha = inputSenhaConfirmacaoSensivel ? inputSenhaConfirmacaoSensivel.value.trim() : "";

            if (!senha) {
                mostrarAlerta("Por favor, informe a senha para continuar.", "erro");
                if (inputSenhaConfirmacaoSensivel) inputSenhaConfirmacaoSensivel.focus();
                return;
            }

            executarAtualizacaoCliente(senha);
        });
    }

    /* =====================================================
       CSRF TOKEN
    ===================================================== */
    function obterCSRFToken() {
        const cookies = document.cookie.split(";");

        for (const cookie of cookies) {
            const [nome, valor] = cookie.trim().split("=");
            if (nome === "csrftoken") {
                return decodeURIComponent(valor);
            }
        }

        return "";
    }

    /* =====================================================
       APLICA MÁSCARAS
    ===================================================== */
    if (typeof aplicarMascarasFormulario === "function") {
        aplicarMascarasFormulario();
    }

    /* =====================================================
       ELEMENTOS DO MODAL: EXCLUIR CLIENTE
    ===================================================== */
    const btnExcluirCliente = document.querySelector(".btn-cliente.excluir");
    const modalExcluirElement = document.getElementById("modalExcluirCliente");
    const nomeClienteParaExcluir = document.getElementById("nomeClienteParaExcluir");
    const btnConfirmarExcluirCliente = document.getElementById("btnConfirmarExcluirCliente");

    const modalExclusao = modalExcluirElement
        ? bootstrap.Modal.getOrCreateInstance(modalExcluirElement)
        : null;

    let clienteParaExcluirId = null;

    /* =====================================================
       ABRIR MODAL DE CONFIRMAÇÃO DE EXCLUSÃO
    ===================================================== */
    if (btnExcluirCliente) {
        btnExcluirCliente.addEventListener("click", (e) => {
            e.stopPropagation();

            if (!clienteSelecionadoTr) {
                mostrarAlerta("Selecione um cliente na tabela para excluir.", "erro");
                return;
            }

            const ds = clienteSelecionadoTr.dataset;
            clienteParaExcluirId = ds.id;

            if (nomeClienteParaExcluir) {
                nomeClienteParaExcluir.textContent = ds.nome || "Cliente selecionado";
            }

            if (modalExclusao) {
                modalExclusao.show();
            }
        });
    }

    /* =====================================================
       CONFIRMAR EXCLUSÃO NO SERVIDOR
    ===================================================== */
    if (btnConfirmarExcluirCliente) {
        btnConfirmarExcluirCliente.addEventListener("click", async () => {
            if (!clienteParaExcluirId) {
                mostrarAlerta("Nenhum cliente selecionado para exclusão.", "erro");
                return;
            }

            try {
                const resposta = await fetch(`/clientes/excluir/${clienteParaExcluirId}/`, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": obterCSRFToken()
                    }
                });

                const resultado = await resposta.json();

                if (resultado.sucesso) {
                    mostrarAlerta(resultado.mensagem || "Cliente excluído com sucesso!", "sucesso");
                    if (modalExclusao) modalExclusao.hide();

                    if (clienteSelecionadoTr) {
                        clienteSelecionadoTr.remove();
                        clienteSelecionadoTr = null;
                    }
                    clienteParaExcluirId = null;

                } else {
                    mostrarAlerta(resultado.mensagem || "Não foi possível excluir o cliente.", "erro");
                }
            } catch (erro) {
                console.error("Erro ao excluir cliente:", erro);
                mostrarAlerta("Ocorreu um erro ao tentar excluir o cliente.", "erro");
            }
        });
    }

    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    popoverTriggerList.forEach(popoverTriggerEl => {
        new bootstrap.Popover(popoverTriggerEl, {
            container: 'body'
        });
    });

    /* =====================================================
       MODAL DE RELATÓRIO
    ===================================================== */
    if (btnAbrirRelatorio) {
        btnAbrirRelatorio.addEventListener("click", () => {
            const ehJuridico = btnJuridico ? btnJuridico.classList.contains("ativo") : true;

            if (tituloModalRelatorio) {
                tituloModalRelatorio.textContent = ehJuridico
                    ? "Relatório de Clientes Jurídicos"
                    : "Relatório de Clientes Físicos";
            }

            checksColunasJuridicas.forEach(col => {
                col.style.display = ehJuridico ? "" : "none";
            });

            if (modalRelatorio) {
                modalRelatorio.show();
            }
        });

        if (checkSelecionarTodos && containerCheckboxes) {
            checkSelecionarTodos.addEventListener("change", function () {
                const checkboxes = containerCheckboxes.querySelectorAll('input[name="colunas"]');
                checkboxes.forEach(cb => {
                    cb.checked = checkSelecionarTodos.checked;
                });
            });

            containerCheckboxes.addEventListener("change", function (e) {
                if (e.target.name === "colunas") {
                    const checkboxes = containerCheckboxes.querySelectorAll('input[name="colunas"]');
                    const todosMarcados = Array.from(checkboxes).every(cb => cb.checked);
                    checkSelecionarTodos.checked = todosMarcados;
                }
            });
        }
    }

    
    

});
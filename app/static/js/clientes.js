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
    const camposJuridicos = document.querySelectorAll(
        "#modalCadastrarCliente .campo-juridico"
    );
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
    const checkSelecionarTodos = document.getElementById(
        "checkSelecionarTodosRelatorio"
    );
    const containerCheckboxes = document.getElementById(
        "containerCheckboxesRelatorio"
    );
    const checksColunasJuridicas = document.querySelectorAll(
        ".check-col-juridico"
    );

    const modalRelatorio = modalRelatorioElement
        ? bootstrap.Modal.getOrCreateInstance(modalRelatorioElement)
        : null;

    /* =====================================================
        ELEMENTOS DO MODAL 2: EDITAR
    ===================================================== */
    const btnEditarCliente = document.querySelector(".btn-cliente.editar");
    const modalEditarElement = document.getElementById(
        "modalEditarCadastroCliente"
    );
    const btnAtualizarCliente = document.getElementById(
        "btnAtualizarCliente"
    );
    const camposJuridicosEditar = document.querySelectorAll(
        ".campo-juridico-editar"
    );

    const modalEdicao = modalEditarElement
        ? bootstrap.Modal.getOrCreateInstance(modalEditarElement)
        : null;

    /* =====================================================
        ELEMENTOS DO MODAL DE CONFIRMAÇÃO DE SENHA
    ===================================================== */
    const modalSenhaSensivelElement = document.getElementById(
        "modalConfirmarSenhaDadosSensiveis"
    );
    const btnConfirmarAlteracaoSensivel = document.getElementById(
        "btnConfirmarAlteracaoSensivel"
    );
    const inputSenhaConfirmacaoSensivel = document.getElementById(
        "senhaConfirmacaoSensivel"
    );

    const modalSenhaSensivel = modalSenhaSensivelElement
        ? bootstrap.Modal.getOrCreateInstance(
            modalSenhaSensivelElement
        )
        : null;

    /* =====================================================
        MARCAR CLIENTES
    ===================================================== */
    const btnMarcarClientes = document.getElementById("btnMarcarClientes");

    /* =====================================================
        HISTÓRICO CLIENTES
    ===================================================== */
    const btnHistoricoClientes = document.getElementById(
        "btnHistoricoClientes"
    );

    const modalHistoricoClientesEl = document.getElementById(
        "modalHistoricoClientes"
    );

    const modalHistoricoClientes = modalHistoricoClientesEl
        ? bootstrap.Modal.getOrCreateInstance(
            modalHistoricoClientesEl
        )
        : null;

    const tbodyHistoricoClientes = document.getElementById(
        "tbodyHistoricoClientes"
    );

    const btnAtualizarHistoricoClientes = document.getElementById(
        "btnAtualizarHistoricoClientes"
    );

    /* =====================================================
        MODAL DE HISTÓRICO
    ===================================================== */
    const modalHistoricoElement = document.getElementById(
        "modalHistoricoClientes"
    );

    const modalHistorico = modalHistoricoElement
        ? bootstrap.Modal.getOrCreateInstance(
            modalHistoricoElement
        )
        : null;

    /* =====================================================
        HISTÓRICO — SELEÇÃO E EXCLUSÃO
    ===================================================== */
    const checkboxMasterHistorico = document.getElementById(
        "checkboxMasterHistoricoClientes"
    );

    const btnApagarHistorico = document.querySelector(
        ".btn-historico-clientes-perigo"
    );

    const modalExclusaoHistoricoEl = document.getElementById(
        "modalConfirmarExclusaoHistoricoClientes"
    );

    const modalExclusaoHistorico = modalExclusaoHistoricoEl
        ? bootstrap.Modal.getOrCreateInstance(
            modalExclusaoHistoricoEl
        )
        : null;

    const textoConfirmacaoExclusao = document.getElementById(
        "textoConfirmacaoExclusaoHistoricoClientes"
    );

    const btnConfirmarExclusaoHistoricoDefinitiva =
        document.getElementById(
            "btnConfirmarExclusaoHistoricoClientesDefinitiva"
        );

    const contadorSelecionadosEl = document.querySelector(
        ".contador-selecionados-historico-clientes"
    );

    /* =====================================================
        ESTADOS GERAIS
    ===================================================== */
    let modoMarcarClientes = false;
    let clienteSelecionadoTr = null;
    let clientesSelecionados = new Set();
    let clienteOriginal = {};

    /* =====================================================
        ESTADO DOS HISTÓRICOS SELECIONADOS
    ===================================================== */
    let historicosSelecionados = new Set();

    /* =====================================================
        FORMATAÇÃO INICIAL DAS LINHAS
    ===================================================== */
    document.querySelectorAll(".linha-cliente").forEach(tr => {
        const celulaValor = tr.querySelector(".col-valor-gasto");

        const valorOriginal =
            tr.dataset.valorGasto ||
            (celulaValor ? celulaValor.textContent : "0");

        if (
            celulaValor &&
            typeof formatarMoeda === "function"
        ) {
            celulaValor.textContent =
                formatarMoeda(valorOriginal);
        }
    });

    /* =====================================================
        FUNÇÕES AUXILIARES
    ===================================================== */

    function normalizarValor(val) {
        if (val === null || val === undefined) {
            return "";
        }

        return String(val)
            .replace(/^R\$\s?/, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function salvarEstadoOriginal() {
        const formulario =
            document.getElementById("formEditarCliente");

        if (!formulario) {
            return;
        }

        clienteOriginal = {};

        formulario
            .querySelectorAll("input, select, textarea")
            .forEach(campo => {
                const chave =
                    campo.name || campo.id;

                if (chave) {
                    clienteOriginal[chave] =
                        normalizarValor(campo.value);
                }
            });
    }

    function houveAlteracao() {
        const formulario =
            document.getElementById("formEditarCliente");

        if (!formulario) {
            return false;
        }

        let mudou = false;

        formulario
            .querySelectorAll("input, select, textarea")
            .forEach(campo => {
                const chave =
                    campo.name || campo.id;

                if (!chave) {
                    return;
                }

                const valorAtual =
                    normalizarValor(campo.value);

                const valorOriginal =
                    normalizarValor(
                        clienteOriginal[chave] || ""
                    );

                if (valorAtual !== valorOriginal) {
                    mudou = true;
                }
            });

        return mudou;
    }

    function alterouDadosSensiveis() {
        const formulario =
            document.getElementById("formEditarCliente");

        if (!formulario) {
            return false;
        }

        const pegarValor = idOuNome => {
            const el =
                formulario.querySelector(
                    `[name='${idOuNome}'], #${idOuNome}`
                );

            return normalizarValor(el?.value);
        };

        const modoAtual =
            pegarValor("modo_valor_gasto") ||
            pegarValor("editarClienteModoValorGasto");

        const valorGastoAtual =
            pegarValor("valor_gasto") ||
            pegarValor("editarClienteValorGasto");

        const ultimaCompraAtual =
            pegarValor("ultima_compra") ||
            pegarValor("editarClienteUltimaCompra");

        const ultimaAtualizacaoAtual =
            pegarValor("ultima_atualizacao") ||
            pegarValor("editarClienteUltimaAtualizacao");

        const modoOriginal =
            normalizarValor(
                clienteOriginal["modo_valor_gasto"] ||
                clienteOriginal["editarClienteModoValorGasto"]
            );

        const valorOriginal =
            normalizarValor(
                clienteOriginal["valor_gasto"] ||
                clienteOriginal["editarClienteValorGasto"]
            );

        const compraOriginal =
            normalizarValor(
                clienteOriginal["ultima_compra"] ||
                clienteOriginal["editarClienteUltimaCompra"]
            );

        const atualizacaoOriginal =
            normalizarValor(
                clienteOriginal["ultima_atualizacao"] ||
                clienteOriginal["editarClienteUltimaAtualizacao"]
            );

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
            const form =
                document.getElementById("formCadastrarCliente");

            if (form) {
                form.reset();
            }

            const tipoAtual =
                tipoCliente
                    ? tipoCliente.value
                    : "juridico";

            if (tipoAtual === "juridico") {
                if (tituloModal) {
                    tituloModal.textContent =
                        "Cadastrar Cliente Jurídico";
                }

                camposJuridicos.forEach(campo => {
                    campo.style.display = "";
                });
            } else {
                if (tituloModal) {
                    tituloModal.textContent =
                        "Cadastrar Cliente Físico";
                }

                camposJuridicos.forEach(campo => {
                    campo.style.display = "none";
                });
            }

            if (modalCadastro) {
                modalCadastro.show();
            }
        });
    }

    /* =====================================================
        SELECIONAR CLIENTE JURÍDICO
    ===================================================== */
    if (btnJuridico) {
        btnJuridico.addEventListener("click", () => {
            if (tipoCliente) {
                tipoCliente.value = "juridico";
            }

            btnJuridico.classList.add("ativo");

            if (btnFisico) {
                btnFisico.classList.remove("ativo");
            }

            const paginaJuridicos =
                document.getElementById("juridicos");

            const paginaFisicos =
                document.getElementById("fisicos");

            if (paginaJuridicos) {
                paginaJuridicos.classList.add("ativa");
            }

            if (paginaFisicos) {
                paginaFisicos.classList.remove("ativa");
            }

            camposJuridicos.forEach(campo => {
                campo.style.display = "";
            });
        });
    }

    /* =====================================================
        SELECIONAR CLIENTE FÍSICO
    ===================================================== */
    if (btnFisico) {
        btnFisico.addEventListener("click", () => {
            if (tipoCliente) {
                tipoCliente.value = "fisico";
            }

            btnFisico.classList.add("ativo");

            if (btnJuridico) {
                btnJuridico.classList.remove("ativo");
            }

            const paginaJuridicos =
                document.getElementById("juridicos");

            const paginaFisicos =
                document.getElementById("fisicos");

            if (paginaFisicos) {
                paginaFisicos.classList.add("ativa");
            }

            if (paginaJuridicos) {
                paginaJuridicos.classList.remove("ativa");
            }

            camposJuridicos.forEach(campo => {
                campo.style.display = "none";
            });
        });
    }

    /* =====================================================
        SELEÇÃO DE LINHAS DA TABELA PRINCIPAL
    ===================================================== */
    function inicializarSelecaoTabela() {
        const linhas =
            document.querySelectorAll(
                ".clientes-table tbody tr.linha-cliente"
            );

        linhas.forEach(linha => {
            linha.addEventListener("click", function (e) {
                e.stopPropagation();

                const checkbox =
                    this.querySelector(
                        ".checkbox-cliente"
                    );

                if (
                    e.target.closest(
                        ".checkbox-cliente"
                    )
                ) {
                    const marcado =
                        e.target.checked;

                    this.classList.toggle(
                        "linha-selecionada",
                        marcado
                    );

                    if (marcado) {
                        clientesSelecionados.add(
                            this.dataset.id
                        );

                        clienteSelecionadoTr =
                            this;
                    } else {
                        clientesSelecionados.delete(
                            this.dataset.id
                        );

                        if (
                            clienteSelecionadoTr ===
                            this
                        ) {
                            clienteSelecionadoTr =
                                null;
                        }
                    }

                    atualizarEstadoCheckboxTodos(
                        this.closest(".clientes-table")
                    );

                    return;
                }

                if (
                    this.classList.contains(
                        "linha-selecionada"
                    )
                ) {
                    this.classList.remove(
                        "linha-selecionada"
                    );

                    if (checkbox) {
                        checkbox.checked = false;
                    }

                    clientesSelecionados.delete(
                        this.dataset.id
                    );

                    if (
                        clienteSelecionadoTr ===
                        this
                    ) {
                        clienteSelecionadoTr =
                            null;
                    }

                    atualizarEstadoCheckboxTodos(
                        this.closest(".clientes-table")
                    );

                    return;
                }

                linhas.forEach(l => {
                    l.classList.remove(
                        "linha-selecionada"
                    );

                    const outroCheckbox =
                        l.querySelector(
                            ".checkbox-cliente"
                        );

                    if (outroCheckbox) {
                        outroCheckbox.checked = false;
                    }

                    clientesSelecionados.delete(
                        l.dataset.id
                    );
                });

                this.classList.add(
                    "linha-selecionada"
                );

                if (checkbox) {
                    checkbox.checked = true;
                }

                clientesSelecionados.add(
                    this.dataset.id
                );

                clienteSelecionadoTr =
                    this;

                atualizarEstadoCheckboxTodos(
                    this.closest(".clientes-table")
                );
            });
        });
    }

    inicializarSelecaoTabela();

    /* =====================================================
        ATUALIZAR CHECKBOX "SELECIONAR TODOS"
    ===================================================== */
    function atualizarEstadoCheckboxTodos(tabela) {
        if (!tabela) {
            return;
        }

        const checkboxTodos =
            tabela.querySelector(
                ".checkbox-selecionar-todos-clientes"
            );

        if (!checkboxTodos) {
            return;
        }

        const checkboxes =
            tabela.querySelectorAll(
                ".checkbox-cliente"
            );

        if (checkboxes.length === 0) {
            checkboxTodos.checked = false;
            checkboxTodos.indeterminate = false;
            return;
        }

        const marcados =
            tabela.querySelectorAll(
                ".checkbox-cliente:checked"
            ).length;

        checkboxTodos.checked =
            marcados === checkboxes.length;

        checkboxTodos.indeterminate =
            marcados > 0 &&
            marcados < checkboxes.length;
    }

    /* =====================================================
        DESSELECIONAR AO CLICAR FORA (TABELA PRINCIPAL)
    ===================================================== */
    document.addEventListener("click", evento => {
        if (
            clientesSelecionados.size === 0 &&
            !clienteSelecionadoTr
        ) {
            return;
        }

        const clicouNaLinha =
            evento.target.closest(
                ".clientes-table tbody tr.linha-cliente"
            );

        const clicouNasAcoes =
            evento.target.closest(".clientes-acoes");

        const clicouNoModal =
            evento.target.closest(".modal");

        if (
            !clicouNaLinha &&
            !clicouNasAcoes &&
            !clicouNoModal
        ) {
            document
                .querySelectorAll(
                    ".clientes-table tbody tr.linha-cliente"
                )
                .forEach(linha => {
                    linha.classList.remove(
                        "linha-selecionada"
                    );

                    const checkbox =
                        linha.querySelector(
                            ".checkbox-cliente"
                        );

                    if (checkbox) {
                        checkbox.checked = false;
                    }
                });

            clientesSelecionados.clear();
            clienteSelecionadoTr = null;

            document
                .querySelectorAll(
                    ".checkbox-selecionar-todos-clientes"
                )
                .forEach(checkbox => {
                    checkbox.checked = false;
                    checkbox.indeterminate = false;
                });
        }
    });

    /* =====================================================
        ABRIR MODAL DE EDIÇÃO
    ===================================================== */
    if (btnEditarCliente) {
        btnEditarCliente.addEventListener("click", e => {
            e.stopPropagation();

            const tabela =
                obterTabelaClientesAtiva();

            if (tabela) {
                const clientesMarcados =
                    tabela.querySelectorAll(
                        ".checkbox-cliente:checked"
                    );

                if (
                    clientesMarcados.length > 1
                ) {
                    mostrarAlerta(
                        "Não é possível editar mais de um cliente por vez. Selecione apenas 1 cliente para editar.",
                        "erro"
                    );

                    return;
                }

                if (
                    clientesMarcados.length === 1
                ) {
                    const linha =
                        clientesMarcados[0].closest(
                            "tr.linha-cliente"
                        );

                    if (linha) {
                        clienteSelecionadoTr =
                            linha;
                    }
                }
            }

            if (!clienteSelecionadoTr) {
                mostrarAlerta(
                    "Selecione um cliente na tabela para editar.",
                    "erro"
                );

                return;
            }

            preencherModalParaEdicao(
                clienteSelecionadoTr
            );
        });
    }

    /* =====================================================
        PREENCHER MODAL DE EDIÇÃO
    ===================================================== */
    function preencherModalParaEdicao(tr) {
        const ds = tr.dataset;

        const inputId =
            document.getElementById(
                "editarClienteId"
            );

        const tituloEdicao =
            document.getElementById(
                "tituloModalEditarCliente"
            );

        const inputTipo =
            document.getElementById(
                "editarTipoCliente"
            );

        if (inputId) {
            inputId.value = ds.id || "";
        }

        if (tituloEdicao) {
            tituloEdicao.textContent =
                `Editar Cliente: ${ds.nome || ""}`;
        }

        if (inputTipo) {
            inputTipo.value =
                ds.tipo || "juridico";
        }

        const campos = {
            editarClienteNome: ds.nome,
            editarClienteRazaoSocial: ds.razao,
            editarClienteCnpj: ds.cnpj,
            editarClienteRg: ds.rg,
            editarClienteCpf: ds.cpf,
            editarClienteEmail: ds.email,
            editarClienteTelefone: ds.telefone,
            editarClienteCnh: ds.cnh,
            editarClienteCategoriaCnh: ds.categoriaCnh,
            editarClienteEmissaoCnh: ds.emissaoCnh,
            editarClienteVencimentoCnh: ds.vencimentoCnh,
            editarClienteCep: ds.cep,
            editarClienteEstado: ds.estado,
            editarClienteEndereco: ds.endereco,
            editarClienteNumero: ds.numero,
            editarClienteComplemento: ds.complemento,
            editarClienteCidade: ds.cidade,
            editarClienteBairro: ds.bairro,
            editarClienteStatus: ds.status || "ativo",
            editarClienteCategoria: ds.categoria
        };

        Object.entries(campos).forEach(
            ([id, valor]) => {
                const elemento =
                    document.getElementById(id);

                if (elemento) {
                    elemento.value =
                        valor || "";
                }
            }
        );

        const modoValorGasto =
            document.getElementById(
                "editarClienteModoValorGasto"
            );

        if (modoValorGasto) {
            modoValorGasto.value =
                ds.modoValorGasto ||
                "Automático (somar produtos)";
        }

        const inputValorGasto =
            document.getElementById(
                "editarClienteValorGasto"
            );

        if (inputValorGasto) {
            inputValorGasto.value =
                typeof formatarMoeda ===
                "function"
                    ? formatarMoeda(
                        ds.valorGasto ||
                        "0,00"
                    )
                    : ds.valorGasto ||
                    "0,00";
        }

        const inputUltimaAtualizacao =
            document.getElementById(
                "editarClienteUltimaAtualizacao"
            );

        if (inputUltimaAtualizacao) {
            inputUltimaAtualizacao.value =
                typeof formatarDataHoraBR ===
                "function"
                    ? formatarDataHoraBR(
                        ds.ultimaAtualizacao
                    )
                    : ds.ultimaAtualizacao ||
                    "-";
        }

        const inputUltimaCompra =
            document.getElementById(
                "editarClienteUltimaCompra"
            );

        if (inputUltimaCompra) {
            inputUltimaCompra.value =
                typeof formatarDataHoraBR ===
                "function"
                    ? formatarDataHoraBR(
                        ds.ultimaCompra
                    )
                    : ds.ultimaCompra ||
                    "-";
        }

        camposJuridicosEditar.forEach(campo => {
            campo.style.display =
                ds.tipo === "juridico"
                    ? ""
                    : "none";
        });

        if (
            typeof aplicarMascarasFormulario ===
            "function"
        ) {
            aplicarMascarasFormulario();
        }

        salvarEstadoOriginal();

        if (modalEdicao) {
            modalEdicao.show();
        }
    }

    /* =====================================================
        MARCAR ERRO NO INPUT
    ===================================================== */
    function marcarErroCliente(input) {
        if (!input) {
            return;
        }

        let nomeCampo = "Este campo";

        const containerCampo =
            input.closest(".campo") ||
            input.parentElement;

        if (containerCampo) {
            const label =
                containerCampo.querySelector(
                    "label"
                );

            if (label) {
                nomeCampo =
                    `O campo ${label.innerText
                        .replace("*", "")
                        .trim()}`;
            }
        }

        input.classList.add("input-erro");
        input.focus();

        mostrarAlerta(
            `${nomeCampo} precisa ser preenchido.`,
            "erro"
        );

        const removerErro = () => {
            input.classList.remove(
                "input-erro"
            );
        };

        input.addEventListener(
            "input",
            removerErro,
            { once: true }
        );

        input.addEventListener(
            "change",
            removerErro,
            { once: true }
        );

        input.addEventListener(
            "pointerdown",
            removerErro,
            { once: true }
        );
    }

    /* =====================================================
        VALIDAÇÃO DOS CAMPOS
    ===================================================== */
    function validarFormularioCliente(formulario) {
        if (!formulario) {
            return false;
        }

        const inputs =
            formulario.querySelectorAll(
                "input, select, textarea"
            );

        const camposCnh =
            Array.from(inputs).filter(i => {
                const nomeOuId =
                    (
                        i.name ||
                        i.id ||
                        ""
                    ).toLowerCase();

                return nomeOuId.includes("cnh");
            });

        const cnhFoiPreenchida =
            camposCnh.some(
                el =>
                    el.value.trim() !== ""
            );

        for (const input of inputs) {
            const nomeOuId =
                (
                    input.name ||
                    input.id ||
                    ""
                ).toLowerCase();

            if (
                nomeOuId.includes(
                    "complemento"
                )
            ) {
                continue;
            }

            if (
                camposCnh.includes(input) &&
                !cnhFoiPreenchida
            ) {
                continue;
            }

            if (
                input.offsetParent === null &&
                input.type !== "hidden"
            ) {
                continue;
            }

            if (
                input.value.trim() === ""
            ) {
                marcarErroCliente(input);
                return false;
            }
        }

        return true;
    }

    /* =====================================================
        INSERIR CLIENTE NA TABELA
    ===================================================== */
    function inserirClienteNaTabela(c) {
        const tabelaContainer =
            c.tipo === "juridico"
                ? document.querySelector(
                    "#juridicos tbody"
                )
                : document.querySelector(
                    "#fisicos tbody"
                );

        if (!tabelaContainer) {
            return;
        }

        const linhaVazia =
            tabelaContainer.querySelector(
                ".sem-registros-clientes"
            );

        if (linhaVazia) {
            linhaVazia
                .closest("tr")
                ?.remove();
        }

        const tr =
            document.createElement("tr");

        tr.classList.add(
            "linha-cliente"
        );

        const valorFormatado =
            typeof formatarMoeda ===
            "function"
                ? formatarMoeda(
                    c.valor_gasto
                )
                : `R$ ${c.valor_gasto}`;

        tr.dataset.id = c.id;
        tr.dataset.tipo = c.tipo;
        tr.dataset.nome = c.nome;
        tr.dataset.razao =
            c.razao === "-"
                ? ""
                : c.razao;
        tr.dataset.cnpj =
            c.cnpj === "-"
                ? ""
                : c.cnpj;
        tr.dataset.rg =
            c.rg === "-"
                ? ""
                : c.rg;
        tr.dataset.cpf =
            c.cpf === "-"
                ? ""
                : c.cpf;
        tr.dataset.email =
            c.email === "-"
                ? ""
                : c.email;
        tr.dataset.telefone =
            c.telefone === "-"
                ? ""
                : c.telefone;
        tr.dataset.cnh =
            c.cnh === "-"
                ? ""
                : c.cnh;
        tr.dataset.categoriaCnh =
            c.categoria_cnh === "-"
                ? ""
                : c.categoria_cnh;
        tr.dataset.emissaoCnh =
            c.emissao_cnh_raw || "";
        tr.dataset.vencimentoCnh =
            c.vencimento_cnh_raw || "";
        tr.dataset.cep =
            c.cep === "-"
                ? ""
                : c.cep;
        tr.dataset.estado =
            c.estado === "-"
                ? ""
                : c.estado;
        tr.dataset.endereco =
            c.endereco === "-"
                ? ""
                : c.endereco;
        tr.dataset.numero =
            c.numero === "-"
                ? ""
                : c.numero;
        tr.dataset.complemento =
            c.complemento === "-"
                ? ""
                : c.complemento;
        tr.dataset.cidade =
            c.cidade === "-"
                ? ""
                : c.cidade;
        tr.dataset.bairro =
            c.bairro === "-"
                ? ""
                : c.bairro;
        tr.dataset.status =
            c.status;
        tr.dataset.categoria =
            c.categoria === "-"
                ? ""
                : c.categoria;
        tr.dataset.modoValorGasto =
            c.modo_valor_gasto === "-"
                ? ""
                : c.modo_valor_gasto;
        tr.dataset.valorGasto =
            c.valor_gasto;
        tr.dataset.ultimaAtualizacao =
            c.ultima_atualizacao;
        tr.dataset.ultimaCompra =
            c.ultima_compra;

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

            const checkbox =
                this.querySelector(
                    ".checkbox-cliente"
                );

            if (
                e.target.closest(
                    ".checkbox-cliente"
                )
            ) {
                const marcado =
                    e.target.checked;

                this.classList.toggle(
                    "linha-selecionada",
                    marcado
                );

                if (marcado) {
                    clientesSelecionados.add(
                        this.dataset.id
                    );

                    clienteSelecionadoTr =
                        this;
                } else {
                    clientesSelecionados.delete(
                        this.dataset.id
                    );

                    if (
                        clienteSelecionadoTr ===
                        this
                    ) {
                        clienteSelecionadoTr =
                            null;
                    }
                }

                atualizarEstadoCheckboxTodos(
                    this.closest(".clientes-table")
                );

                return;
            }

            if (
                this.classList.contains(
                    "linha-selecionada"
                )
            ) {
                this.classList.remove(
                    "linha-selecionada"
                );

                if (checkbox) {
                    checkbox.checked = false;
                }

                clientesSelecionados.delete(
                    this.dataset.id
                );

                if (
                    clienteSelecionadoTr ===
                    this
                ) {
                    clienteSelecionadoTr =
                        null;
                }

                atualizarEstadoCheckboxTodos(
                    this.closest(".clientes-table")
                );

                return;
            }

            const tabela =
                this.closest(
                    ".clientes-table"
                );

            if (tabela) {
                tabela
                    .querySelectorAll(
                        "tbody tr.linha-cliente"
                    )
                    .forEach(linha => {
                        linha.classList.remove(
                            "linha-selecionada"
                        );

                        const outroCheckbox =
                            linha.querySelector(
                                ".checkbox-cliente"
                            );

                        if (outroCheckbox) {
                            outroCheckbox.checked =
                                false;
                        }

                        clientesSelecionados.delete(
                            linha.dataset.id
                        );
                    });
            }

            this.classList.add(
                "linha-selecionada"
            );

            if (checkbox) {
                checkbox.checked = true;
            }

            clientesSelecionados.add(
                this.dataset.id
            );

            clienteSelecionadoTr =
                this;

            atualizarEstadoCheckboxTodos(
                tabela
            );
        });

        if (modoMarcarClientes) {
            const td =
                document.createElement("td");

            td.className =
                "coluna-selecao-cliente";

            td.innerHTML = `
                <input
                    type="checkbox"
                    class="checkbox-cliente"
                    data-id="${c.id}"
                >
            `;

            tr.insertBefore(
                td,
                tr.firstElementChild
            );
        }

        tabelaContainer.prepend(tr);
    }

    /* =====================================================
        CADASTRAR CLIENTE
    ===================================================== */
    if (btnCadastrarCliente) {
        btnCadastrarCliente.addEventListener(
            "click",
            async () => {
                const formulario =
                    document.getElementById(
                        "formCadastrarCliente"
                    );

                if (
                    !validarFormularioCliente(
                        formulario
                    )
                ) {
                    return;
                }

                const dados =
                    new FormData(formulario);

                try {
                    const resposta =
                        await fetch(
                            "/clientes/cadastrar/",
                            {
                                method: "POST",
                                headers: {
                                    "X-CSRFToken":
                                        obterCSRFToken()
                                },
                                body: dados
                            }
                        );

                    const resultado =
                        await resposta.json();

                    if (resultado.sucesso) {
                        mostrarAlerta(
                            resultado.mensagem ||
                            "Cliente cadastrado com sucesso!",
                            "sucesso"
                        );

                        if (resultado.cliente) {
                            inserirClienteNaTabela(
                                resultado.cliente
                            );
                        }

                        formulario.reset();

                        if (modalCadastro) {
                            modalCadastro.hide();
                        }
                    } else {
                        mostrarAlerta(
                            resultado.mensagem ||
                            "Não foi possível cadastrar o cliente.",
                            "erro"
                        );
                    }
                } catch (erro) {
                    console.error(
                        "Erro ao cadastrar cliente:",
                        erro
                    );

                    mostrarAlerta(
                        "Ocorreu um erro ao cadastrar o cliente.",
                        "erro"
                    );
                }
            }
        );
    }

    /* =====================================================
        ATUALIZAÇÃO DE CLIENTE
    ===================================================== */
    async function executarAtualizacaoCliente(
        senhaSensivel = ""
    ) {
        const formulario =
            document.getElementById(
                "formEditarCliente"
            );

        const clienteIdInput =
            document.getElementById(
                "editarClienteId"
            );

        const clienteId =
            clienteIdInput
                ? clienteIdInput.value
                : null;

        if (!clienteId) {
            mostrarAlerta(
                "Identificador do cliente não encontrado.",
                "erro"
            );

            return;
        }

        const dados =
            new FormData(formulario);

        if (senhaSensivel) {
            dados.append(
                "senha_confirmacao",
                senhaSensivel
            );
        }

        try {
            const resposta =
                await fetch(
                    `/clientes/editar/${clienteId}/`,
                    {
                        method: "POST",
                        headers: {
                            "X-CSRFToken":
                                obterCSRFToken()
                        },
                        body: dados
                    }
                );

            const resultado =
                await resposta.json();

            if (resultado.sucesso) {
                mostrarAlerta(
                    resultado.mensagem ||
                    "Cliente atualizado com sucesso!",
                    "sucesso"
                );

                if (modalSenhaSensivel) {
                    modalSenhaSensivel.hide();
                }

                if (modalEdicao) {
                    modalEdicao.hide();
                }

                if (
                    clienteSelecionadoTr &&
                    resultado.cliente
                ) {
                    const c =
                        resultado.cliente;

                    const ds =
                        clienteSelecionadoTr.dataset;

                    const valorFormatado =
                        typeof formatarMoeda ===
                        "function"
                            ? formatarMoeda(
                                c.valor_gasto
                            )
                            : `R$ ${c.valor_gasto}`;

                    ds.nome = c.nome;
                    ds.razao =
                        c.razao === "-"
                            ? ""
                            : c.razao;
                    ds.cnpj =
                        c.cnpj === "-"
                            ? ""
                            : c.cnpj;
                    ds.rg =
                        c.rg === "-"
                            ? ""
                            : c.rg;
                    ds.cpf =
                        c.cpf === "-"
                            ? ""
                            : c.cpf;
                    ds.email =
                        c.email === "-"
                            ? ""
                            : c.email;
                    ds.telefone =
                        c.telefone === "-"
                            ? ""
                            : c.telefone;
                    ds.cnh =
                        c.cnh === "-"
                            ? ""
                            : c.cnh;
                    ds.categoriaCnh =
                        c.categoria_cnh === "-"
                            ? ""
                            : c.categoria_cnh;
                    ds.emissaoCnh =
                        c.emissao_cnh_raw || "";
                    ds.vencimentoCnh =
                        c.vencimento_cnh_raw || "";
                    ds.cep =
                        c.cep === "-"
                            ? ""
                            : c.cep;
                    ds.estado =
                        c.estado === "-"
                            ? ""
                            : c.estado;
                    ds.endereco =
                        c.endereco === "-"
                            ? ""
                            : c.endereco;
                    ds.numero =
                        c.numero === "-"
                            ? ""
                            : c.numero;
                    ds.complemento =
                        c.complemento === "-"
                            ? ""
                            : c.complemento;
                    ds.cidade =
                        c.cidade === "-"
                            ? ""
                            : c.cidade;
                    ds.bairro =
                        c.bairro === "-"
                            ? ""
                            : c.bairro;
                    ds.status =
                        c.status;
                    ds.categoria =
                        c.categoria === "-"
                            ? ""
                            : c.categoria;
                    ds.ultimaAtualizacao =
                        c.ultima_atualizacao;
                    ds.modoValorGasto =
                        c.modo_valor_gasto;
                    ds.valorGasto =
                        c.valor_gasto;
                    ds.ultimaCompra =
                        c.ultima_compra;

                    if (
                        c.tipo ===
                        "juridico"
                    ) {
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
                            <td class="col-valor-gasto">
                                ${valorFormatado}
                            </td>
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
                            <td class="col-valor-gasto">
                                ${valorFormatado}
                            </td>
                            <td>${c.modo_valor_gasto}</td>
                            <td>${c.ultima_compra}</td>
                        `;
                    }

                    if (modoMarcarClientes) {
                        const td =
                            document.createElement(
                                "td"
                            );

                        td.className =
                            "coluna-selecao-cliente";

                        td.innerHTML = `
                            <input
                                type="checkbox"
                                class="checkbox-cliente"
                                data-id="${ds.id}"
                                checked
                            >
                        `;

                        clienteSelecionadoTr.insertBefore(
                            td,
                            clienteSelecionadoTr.firstElementChild
                        );
                    }
                }
            } else {
                mostrarAlerta(
                    resultado.mensagem ||
                    "Não foi possível atualizar o cliente.",
                    "erro"
                );
            }
        } catch (erro) {
            console.error(
                "Erro ao atualizar cliente:",
                erro
            );

            mostrarAlerta(
                "Ocorreu um erro ao atualizar o cliente.",
                "erro"
            );
        }
    }

    /* =====================================================
        BOTÃO ATUALIZAR CLIENTE
    ===================================================== */
    if (btnAtualizarCliente) {
        btnAtualizarCliente.addEventListener(
            "click",
            async () => {
                const formulario =
                    document.getElementById(
                        "formEditarCliente"
                    );

                const clienteIdInput =
                    document.getElementById(
                        "editarClienteId"
                    );

                const clienteId =
                    clienteIdInput
                        ? clienteIdInput.value
                        : null;

                if (!clienteId) {
                    mostrarAlerta(
                        "Identificador do cliente não encontrado.",
                        "erro"
                    );

                    return;
                }

                if (!houveAlteracao()) {
                    mostrarAlerta(
                        "Nenhuma informação foi alterada para atualizar.",
                        "erro"
                    );

                    return;
                }

                if (
                    !validarFormularioCliente(
                        formulario
                    )
                ) {
                    return;
                }

                if (
                    alterouDadosSensiveis()
                ) {
                    if (
                        inputSenhaConfirmacaoSensivel
                    ) {
                        inputSenhaConfirmacaoSensivel.value =
                            "";
                    }

                    if (modalSenhaSensivel) {
                        modalSenhaSensivel.show();
                    }

                    return;
                }

                executarAtualizacaoCliente();
            }
        );
    }

    /* =====================================================
        CONFIRMAR SENHA
    ===================================================== */
    if (
        btnConfirmarAlteracaoSensivel
    ) {
        btnConfirmarAlteracaoSensivel.addEventListener(
            "click",
            () => {
                const senha =
                    inputSenhaConfirmacaoSensivel
                        ? inputSenhaConfirmacaoSensivel.value.trim()
                        : "";

                if (!senha) {
                    mostrarAlerta(
                        "Por favor, informe a senha para continuar.",
                        "erro"
                    );

                    inputSenhaConfirmacaoSensivel?.focus();

                    return;
                }

                executarAtualizacaoCliente(
                    senha
                );
            }
        );
    }

    /* =====================================================
        CSRF TOKEN
    ===================================================== */
    function obterCSRFToken() {
        const cookies =
            document.cookie.split(";");

        for (const cookie of cookies) {
            const [nome, valor] =
                cookie.trim().split("=");

            if (nome === "csrftoken") {
                return decodeURIComponent(
                    valor
                );
            }
        }

        return "";
    }

    /* =====================================================
        APLICA MÁSCARAS
    ===================================================== */
    if (
        typeof aplicarMascarasFormulario ===
        "function"
    ) {
        aplicarMascarasFormulario();
    }

    /* =====================================================
        EXCLUIR CLIENTE
    ===================================================== */
    const btnExcluirCliente =
        document.querySelector(
            ".btn-cliente.excluir"
        );

    const modalExcluirElement =
        document.getElementById(
            "modalExcluirCliente"
        );

    const nomeClienteParaExcluir =
        document.getElementById(
            "nomeClienteParaExcluir"
        );

    const btnConfirmarExcluirCliente =
        document.getElementById(
            "btnConfirmarExcluirCliente"
        );

    const modalExclusao =
        modalExcluirElement
            ? bootstrap.Modal.getOrCreateInstance(
                modalExcluirElement
            )
            : null;

    let clienteParaExcluirId = null;

    /* =====================================================
        ABRIR MODAL DE EXCLUSÃO
    ===================================================== */
    if (btnExcluirCliente) {
        btnExcluirCliente.addEventListener(
            "click",
            e => {
                e.stopPropagation();

                const clientesMarcados =
                    Array.from(
                        clientesSelecionados
                    );

                if (
                    clientesMarcados.length ===
                    0 &&
                    !clienteSelecionadoTr
                ) {
                    mostrarAlerta(
                        "Selecione um cliente na tabela para excluir.",
                        "erro"
                    );

                    return;
                }

                if (
                    clientesMarcados.length >
                    1
                ) {
                    clienteParaExcluirId =
                        null;

                    if (
                        nomeClienteParaExcluir
                    ) {
                        nomeClienteParaExcluir.textContent =
                            `${clientesMarcados.length} clientes selecionados`;
                    }

                    modalExclusao?.show();

                    return;
                }

                const idSelecionado =
                    clientesMarcados.length ===
                    1
                        ? clientesMarcados[0]
                        : clienteSelecionadoTr
                            ?.dataset.id;

                const linhaSelecionada =
                    document.querySelector(
                        `.linha-cliente[data-id="${idSelecionado}"]`
                    );

                if (!linhaSelecionada) {
                    mostrarAlerta(
                        "Cliente selecionado não encontrado.",
                        "erro"
                    );

                    return;
                }

                const ds =
                    linhaSelecionada.dataset;

                clienteSelecionadoTr =
                    linhaSelecionada;

                clienteParaExcluirId =
                    ds.id;

                if (
                    nomeClienteParaExcluir
                ) {
                    nomeClienteParaExcluir.textContent =
                        ds.nome ||
                        "Cliente selecionado";
                }

                modalExclusao?.show();
            }
        );
    }

    /* =====================================================
        CONFIRMAR EXCLUSÃO DO CLIENTE
    ===================================================== */
    if (btnConfirmarExcluirCliente) {
        btnConfirmarExcluirCliente.addEventListener(
            "click",
            async () => {
                let idsParaExcluir =
                    Array.from(
                        clientesSelecionados
                    );

                if (
                    idsParaExcluir.length ===
                    0 &&
                    clienteParaExcluirId
                ) {
                    idsParaExcluir = [
                        clienteParaExcluirId
                    ];
                }

                if (
                    idsParaExcluir.length ===
                    0 &&
                    clienteSelecionadoTr
                ) {
                    idsParaExcluir = [
                        clienteSelecionadoTr.dataset.id
                    ];
                }

                if (
                    idsParaExcluir.length ===
                    0
                ) {
                    mostrarAlerta(
                        "Nenhum cliente selecionado para exclusão.",
                        "erro"
                    );

                    return;
                }

                btnConfirmarExcluirCliente.disabled =
                    true;

                try {
                    let quantidadeExcluida =
                        0;

                    for (
                        const clienteId of idsParaExcluir
                    ) {
                        try {
                            const resposta =
                                await fetch(
                                    `/clientes/excluir/${clienteId}/`,
                                    {
                                        method:
                                            "POST",
                                        headers: {
                                            "X-CSRFToken":
                                                obterCSRFToken()
                                        }
                                    }
                                );

                            const resultado =
                                await resposta.json();

                            if (
                                resultado.sucesso
                            ) {
                                quantidadeExcluida++;

                                const linha =
                                    document.querySelector(
                                        `.linha-cliente[data-id="${clienteId}"]`
                                    );

                                linha?.remove();

                                clientesSelecionados.delete(
                                    clienteId
                                );

                                if (
                                    clienteSelecionadoTr &&
                                    clienteSelecionadoTr.dataset.id ===
                                        clienteId
                                ) {
                                    clienteSelecionadoTr =
                                        null;
                                }
                            }
                        } catch (erro) {
                            console.error(
                                `Erro ao excluir cliente ${clienteId}:`,
                                erro
                            );
                        }
                    }

                    modalExclusao?.hide();

                    if (
                        quantidadeExcluida ===
                        idsParaExcluir.length
                    ) {
                        mostrarAlerta(
                            quantidadeExcluida ===
                                1
                                ? "Cliente excluído com sucesso!"
                                : `${quantidadeExcluida} clientes excluídos com sucesso!`,
                            "sucesso"
                        );
                    } else if (
                        quantidadeExcluida >
                        0
                    ) {
                        mostrarAlerta(
                            `${quantidadeExcluida} de ${idsParaExcluir.length} clientes foram excluídos.`,
                            "sucesso"
                        );
                    } else {
                        mostrarAlerta(
                            "Não foi possível excluir os clientes selecionados.",
                            "erro"
                        );
                    }

                    clienteParaExcluirId =
                        null;

                    clientesSelecionados.clear();
                    clienteSelecionadoTr = null;

                    document
                        .querySelectorAll(
                            ".checkbox-selecionar-todos-clientes"
                        )
                        .forEach(
                            checkbox => {
                                checkbox.checked =
                                    false;

                                checkbox.indeterminate =
                                    false;
                            }
                        );
                } catch (erro) {
                    console.error(
                        "Erro ao excluir cliente:",
                        erro
                    );

                    mostrarAlerta(
                        "Ocorreu um erro ao tentar excluir o cliente.",
                        "erro"
                    );
                } finally {
                    btnConfirmarExcluirCliente.disabled =
                        false;
                }
            }
        );
    }

    /* =====================================================
        POPOVERS
    ===================================================== */
    const popoverTriggerList =
        document.querySelectorAll(
            '[data-bs-toggle="popover"]'
        );

    popoverTriggerList.forEach(
        popoverTriggerEl => {
            new bootstrap.Popover(
                popoverTriggerEl,
                {
                    container: "body"
                }
            );
        }
    );

    /* =====================================================
        MODAL DE RELATÓRIO
    ===================================================== */
    function atualizarEstadoSelecionarTodos() {
        if (
            !checkSelecionarTodos ||
            !containerCheckboxes
        ) {
            return;
        }

        const checkboxes =
            containerCheckboxes.querySelectorAll(
                'input[name="colunas"]'
            );

        if (checkboxes.length === 0) {
            checkSelecionarTodos.checked = false;
            checkSelecionarTodos.indeterminate = false;
            return;
        }

        const checados =
            containerCheckboxes.querySelectorAll(
                'input[name="colunas"]:checked'
            ).length;

        checkSelecionarTodos.checked =
            checados === checkboxes.length;

        checkSelecionarTodos.indeterminate =
            checados > 0 &&
            checados < checkboxes.length;
    }

    function atualizarCheckboxesColunas() {
        if (
            !checkSelecionarTodos ||
            !containerCheckboxes
        ) {
            return;
        }

        const checkboxes =
            containerCheckboxes.querySelectorAll(
                'input[name="colunas"]'
            );

        checkboxes.forEach(
            checkbox => {
                checkbox.checked =
                    checkSelecionarTodos.checked;
            }
        );

        checkSelecionarTodos.indeterminate =
            false;
    }

    if (btnAbrirRelatorio) {
        btnAbrirRelatorio.addEventListener(
            "click",
            () => {
                const ehJuridico =
                    btnJuridico
                        ? btnJuridico.classList.contains(
                            "ativo"
                        )
                        : true;

                if (
                    tituloModalRelatorio
                ) {
                    tituloModalRelatorio.textContent =
                        ehJuridico
                            ? "Exportações Clientes Jurídicos"
                            : "Exportações Clientes Físicos";
                }

                checksColunasJuridicas.forEach(
                    col => {
                        col.style.display =
                            ehJuridico
                                ? ""
                                : "none";
                    }
                );

                atualizarEstadoSelecionarTodos();

                modalRelatorio?.show();
            }
        );
    }

    if (
        checkSelecionarTodos &&
        containerCheckboxes
    ) {
        checkSelecionarTodos.addEventListener(
            "change",
            atualizarCheckboxesColunas
        );

        containerCheckboxes.addEventListener(
            "change",
            e => {
                if (
                    e.target.matches(
                        'input[name="colunas"]'
                    )
                ) {
                    atualizarEstadoSelecionarTodos();
                }
            }
        );
    }

    /* =====================================================
        BOTÃO GERAR EXCEL
    ===================================================== */
    const btnGerarExcel =
        document.getElementById(
            "btnGerarExcelRelatorio"
        );

    if (btnGerarExcel) {
        btnGerarExcel.addEventListener(
            "click",
            gerarExcelRelatorioCliente
        );
    }

    /* =====================================================
        COOKIE CSRF
    ===================================================== */
    function getCookie(name) {
        let cookieValue = null;

        if (
            document.cookie &&
            document.cookie !== ""
        ) {
            const cookies =
                document.cookie.split(";");

            for (
                let i = 0;
                i < cookies.length;
                i++
            ) {
                const cookie =
                    cookies[i].trim();

                if (
                    cookie.substring(
                        0,
                        name.length + 1
                    ) ===
                    name + "="
                ) {
                    cookieValue =
                        decodeURIComponent(
                            cookie.substring(
                                name.length + 1
                            )
                        );

                    break;
                }
            }
        }

        return cookieValue;
    }

    /* =====================================================
        GERAR RELATÓRIO EXCEL
    ===================================================== */
    function gerarExcelRelatorioCliente() {
        const status =
            document.getElementById(
                "relatorioStatus"
            );

        const categoria =
            document.getElementById(
                "relatorioCategoria"
            );

        const dataDe =
            document.getElementById(
                "relatorioDataDe"
            );

        const dataAte =
            document.getElementById(
                "relatorioDataAte"
            );

        if (!status || !categoria || !dataDe || !dataAte) {
            return;
        }

        if (status.value === "") {
            mostrarAlerta(
                'Por favor, selecione o tipo de filtro correspondente ao "Status do Cliente".'
            );

            status.focus();
            return;
        }

        if (categoria.value === "") {
            mostrarAlerta(
                'Por favor, selecione o tipo de filtro correspondente à "Categoria do Cliente".'
            );

            categoria.focus();
            return;
        }

        if (
            dataDe.value &&
            dataAte.value &&
            dataDe.value > dataAte.value
        ) {
            mostrarAlerta(
                'A data inicial ("De") não pode ser maior do que a data final ("Até").'
            );

            dataDe.focus();
            return;
        }

        const colunasSelecionadas =
            document.querySelectorAll(
                '#containerCheckboxesRelatorio input[name="colunas"]:checked'
            );

        if (
            colunasSelecionadas.length ===
            0
        ) {
            mostrarAlerta(
                "Pelo menos 1 informação/coluna é obrigatória estar selecionada para incluir no relatório."
            );

            return;
        }

        const formElement =
            document.getElementById(
                "formRelatorioCliente"
            );

        if (!formElement) {
            return;
        }

        const formData =
            new FormData(formElement);

        const btnJuridicoRelatorio =
            document.getElementById(
                "btnJuridico"
            );

        const ehJuridico =
            btnJuridicoRelatorio
                ? btnJuridicoRelatorio.classList.contains(
                    "ativo"
                )
                : false;

        formData.set(
            "tipo_cliente",
            ehJuridico
                ? "juridico"
                : "fisico"
        );

        const btnGerarExcelAtual =
            document.getElementById(
                "btnGerarExcelRelatorio"
            );

        if (!btnGerarExcelAtual) {
            return;
        }

        const textoOriginal =
            btnGerarExcelAtual.innerHTML;

        btnGerarExcelAtual.disabled = true;

        btnGerarExcelAtual.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Gerando...';

        fetch(
            "/clientes/relatorio/excel/",
            {
                method: "POST",
                headers: {
                    "X-CSRFToken":
                        getCookie("csrftoken")
                },
                body: formData
            }
        )
            .then(response => {
                if (!response.ok) {
                    return response
                        .json()
                        .then(err => {
                            throw new Error(
                                err.erro ||
                                "Erro ao gerar relatório."
                            );
                        });
                }

                return response.blob();
            })
            .then(blob => {
                const url =
                    window.URL.createObjectURL(
                        blob
                    );

                const a =
                    document.createElement(
                        "a"
                    );

                a.href = url;

                a.download =
                    `Relatorio_Clientes_${new Date()
                        .toISOString()
                        .slice(0, 10)}.xlsx`;

                document.body.appendChild(a);

                a.click();

                a.remove();

                window.URL.revokeObjectURL(
                    url
                );

                const modalElement =
                    document.getElementById(
                        "modalRelatorioCliente"
                    );

                const modalInstance =
                    bootstrap.Modal.getInstance(
                        modalElement
                    );

                modalInstance?.hide();
            })
            .catch(error => {
                alert(error.message);
            })
            .finally(() => {
                btnGerarExcelAtual.disabled =
                    false;

                btnGerarExcelAtual.innerHTML =
                    textoOriginal;
            });
    }

    /* =====================================================
        OBTER TABELA ATIVA
    ===================================================== */
    function obterTabelaClientesAtiva() {
        const tabelas =
            document.querySelectorAll(
                ".clientes-table"
            );

        for (const tabela of tabelas) {
            const container =
                tabela.closest(
                    ".tabela-clientes, .clientes-tabela, .clientes-conteudo"
                );

            if (
                container &&
                container.offsetParent !==
                    null
            ) {
                return tabela;
            }

            if (
                tabela.offsetParent !==
                null
            ) {
                return tabela;
            }
        }

        return null;
    }

    /* =====================================================
        CHECKBOXES DOS CLIENTES
    ===================================================== */
    function atualizarCheckboxesClientes() {
        const tabela =
            obterTabelaClientesAtiva();

        if (!tabela) {
            return;
        }

        const cabecalho =
            tabela.querySelector(
                "thead tr"
            );

        const linhas =
            tabela.querySelectorAll(
                "tbody tr.linha-cliente"
            );

        if (!cabecalho) {
            return;
        }

        if (modoMarcarClientes) {
            if (
                !cabecalho.querySelector(
                    ".coluna-selecao-cliente"
                )
            ) {
                const th =
                    document.createElement(
                        "th"
                    );

                th.className =
                    "coluna-selecao-cliente";

                th.innerHTML = `
                    <input
                        type="checkbox"
                        class="checkbox-selecionar-todos-clientes"
                        title="Selecionar todos"
                    >
                `;

                cabecalho.insertBefore(
                    th,
                    cabecalho.firstElementChild
                );

                const checkboxTodos =
                    th.querySelector(
                        ".checkbox-selecionar-todos-clientes"
                    );

                checkboxTodos.addEventListener(
                    "change",
                    () => {
                        const checkboxes =
                            tabela.querySelectorAll(
                                ".checkbox-cliente"
                            );

                        checkboxes.forEach(
                            checkbox => {
                                checkbox.checked =
                                    checkboxTodos.checked;

                                const linha =
                                    checkbox.closest(
                                        "tr.linha-cliente"
                                    );

                                if (!linha) {
                                    return;
                                }

                                linha.classList.toggle(
                                    "linha-selecionada",
                                    checkboxTodos.checked
                                );

                                if (
                                    checkboxTodos.checked
                                ) {
                                    clientesSelecionados.add(
                                        linha.dataset.id
                                    );
                                } else {
                                    clientesSelecionados.delete(
                                        linha.dataset.id
                                    );
                                }
                            }
                        );

                        clienteSelecionadoTr =
                            checkboxTodos.checked &&
                            checkboxes.length > 0
                                ? checkboxes[0].closest(
                                    "tr.linha-cliente"
                                )
                                : null;

                        atualizarEstadoCheckboxTodos(
                            tabela
                        );
                    }
                );
            }

            linhas.forEach(linha => {
                if (
                    linha.querySelector(
                        ".checkbox-cliente"
                    )
                ) {
                    return;
                }

                const td =
                    document.createElement(
                        "td"
                    );

                td.className =
                    "coluna-selecao-cliente";

                td.innerHTML = `
                    <input
                        type="checkbox"
                        class="checkbox-cliente"
                        data-id="${linha.dataset.id}"
                    >
                `;

                linha.insertBefore(
                    td,
                    linha.firstElementChild
                );

                const checkbox =
                    td.querySelector(
                        ".checkbox-cliente"
                    );

                checkbox.addEventListener(
                    "change",
                    () => {
                        const marcado =
                            checkbox.checked;

                        linha.classList.toggle(
                            "linha-selecionada",
                            marcado
                        );

                        if (marcado) {
                            clientesSelecionados.add(
                                linha.dataset.id
                            );

                            clienteSelecionadoTr =
                                linha;
                        } else {
                            clientesSelecionados.delete(
                                linha.dataset.id
                            );

                            if (
                                clienteSelecionadoTr ===
                                linha
                            ) {
                                clienteSelecionadoTr =
                                    null;
                            }
                        }

                        atualizarEstadoCheckboxTodos(
                            tabela
                        );
                    }
                );
            });

            atualizarEstadoCheckboxTodos(
                tabela
            );
        } else {
            linhas.forEach(linha => {
                clientesSelecionados.delete(
                    linha.dataset.id
                );

                linha.classList.remove(
                    "linha-selecionada"
                );

                linha
                    .querySelector(
                        ".coluna-selecao-cliente"
                    )
                    ?.remove();
            });

            cabecalho
                .querySelector(
                    ".coluna-selecao-cliente"
                )
                ?.remove();

            clienteSelecionadoTr = null;
            clientesSelecionados.clear();
        }
    }

    /* =====================================================
        BOTÃO MARCAR CLIENTES
    ===================================================== */
    if (btnMarcarClientes) {
        btnMarcarClientes.addEventListener(
            "click",
            () => {
                modoMarcarClientes =
                    !modoMarcarClientes;

                atualizarCheckboxesClientes();

                btnMarcarClientes.classList.toggle(
                    "ativo",
                    modoMarcarClientes
                );
            }
        );
    }

    /* =====================================================
        OBTER TIPO DE CLIENTE ATIVO
    ===================================================== */
    function obterTipoClienteAtivo() {
        const paginaJuridicos =
            document.getElementById(
                "juridicos"
            );

        const paginaFisicos =
            document.getElementById(
                "fisicos"
            );

        if (
            paginaJuridicos &&
            paginaJuridicos.classList.contains(
                "ativa"
            )
        ) {
            return "juridico";
        }

        if (
            paginaFisicos &&
            paginaFisicos.classList.contains(
                "ativa"
            )
        ) {
            return "fisico";
        }

        return null;
    }

    /* =====================================================
        HISTÓRICO DE CLIENTES
    ===================================================== */

    /* =====================================================
        SINCRONIZAR SELEÇÃO DO HISTÓRICO
    ===================================================== */
    function sincronizarSelecaoHistorico() {
        historicosSelecionados.clear();

        if (!tbodyHistoricoClientes) {
            return;
        }

        tbodyHistoricoClientes
            .querySelectorAll(
                ".checkbox-item-historico-clientes, .checkbox-item-historico-cliente"
            )
            .forEach(checkbox => {
                const id =
                    checkbox.dataset.id;

                if (!id) {
                    return;
                }

                if (checkbox.checked) {
                    historicosSelecionados.add(id);
                }

                const tr =
                    checkbox.closest(
                        "tr.linha-item-historico-cliente, tr"
                    );

                if (tr) {
                    tr.classList.toggle(
                        "linha-selecionada-historico",
                        checkbox.checked
                    );
                }
            });
    }

    /* =====================================================
        ATUALIZAR MASTER DO HISTÓRICO
    ===================================================== */
    function atualizarMasterHistorico() {
        if (
            !checkboxMasterHistorico ||
            !tbodyHistoricoClientes
        ) {
            return;
        }

        const checkboxes =
            tbodyHistoricoClientes.querySelectorAll(
                ".checkbox-item-historico-clientes, .checkbox-item-historico-cliente"
            );

        const total = checkboxes.length;

        const selecionados =
            Array.from(checkboxes)
                .filter(checkbox => checkbox.checked)
                .length;

        if (total === 0) {
            checkboxMasterHistorico.checked = false;
            checkboxMasterHistorico.indeterminate = false;
            return;
        }

        if (selecionados === total) {
            checkboxMasterHistorico.checked = true;
            checkboxMasterHistorico.indeterminate = false;
            return;
        }

        if (selecionados === 0) {
            checkboxMasterHistorico.checked = false;
            checkboxMasterHistorico.indeterminate = false;
            return;
        }

        checkboxMasterHistorico.checked = false;
        checkboxMasterHistorico.indeterminate = true;
    }

    /* =====================================================
        ATUALIZAR CONTADOR DO HISTÓRICO
    ===================================================== */
    function atualizarContadorHistoricoClientes() {
        if (!tbodyHistoricoClientes) {
            return;
        }

        sincronizarSelecaoHistorico();

        const selecionados =
            tbodyHistoricoClientes.querySelectorAll(
                ".checkbox-item-historico-clientes:checked, .checkbox-item-historico-cliente:checked"
            ).length;

        const totalLinhas =
            tbodyHistoricoClientes.querySelectorAll(
                "tr.linha-item-historico-cliente, tbody tr"
            ).length;

        if (contadorSelecionadosEl) {
            if (selecionados === 0) {
                contadorSelecionadosEl.textContent =
                    `${totalLinhas} registro(s) no total`;
            } else if (selecionados === 1) {
                contadorSelecionadosEl.textContent =
                    "1 item selecionado";
            } else {
                contadorSelecionadosEl.textContent =
                    `${selecionados} itens selecionados`;
            }
        }

        atualizarMasterHistorico();
    }

    /* =====================================================
        OBTER IDS SELECIONADOS DO HISTÓRICO
    ===================================================== */
    function getIdsHistoricoClientesSelecionados() {
        sincronizarSelecaoHistorico();

        return Array.from(
            historicosSelecionados
        );
    }

    /* =====================================================
        MARCAR / DESMARCAR TODOS DO HISTÓRICO
    ===================================================== */
    if (checkboxMasterHistorico) {
        checkboxMasterHistorico.checked = false;
        checkboxMasterHistorico.indeterminate = false;

        checkboxMasterHistorico.addEventListener(
            "change",
            function () {
                if (!tbodyHistoricoClientes) {
                    return;
                }

                const marcar = this.checked;

                tbodyHistoricoClientes
                    .querySelectorAll(
                        ".checkbox-item-historico-clientes, .checkbox-item-historico-cliente"
                    )
                    .forEach(checkbox => {
                        checkbox.checked = marcar;

                        const tr =
                            checkbox.closest(
                                "tr.linha-item-historico-cliente, tr"
                            );

                        if (tr) {
                            tr.classList.toggle(
                                "linha-selecionada-historico",
                                marcar
                            );
                        }
                    });

                sincronizarSelecaoHistorico();
                atualizarContadorHistoricoClientes();
            }
        );
    }

    /* =====================================================
        CLIQUE NAS LINHAS DO HISTÓRICO
    ===================================================== */
    if (tbodyHistoricoClientes) {
        tbodyHistoricoClientes.addEventListener(
            "click",
            function (e) {
                const tr =
                    e.target.closest(
                        "tr.linha-item-historico-cliente, tbody tr"
                    );

                if (!tr) {
                    return;
                }

                const checkbox =
                    tr.querySelector(
                        ".checkbox-item-historico-clientes, .checkbox-item-historico-cliente"
                    );

                if (!checkbox) {
                    return;
                }

                if (
                    e.target.closest(
                        ".checkbox-item-historico-clientes, .checkbox-item-historico-cliente"
                    )
                ) {
                    return;
                }

                checkbox.checked = !checkbox.checked;

                tr.classList.toggle(
                    "linha-selecionada-historico",
                    checkbox.checked
                );

                atualizarContadorHistoricoClientes();
            }
        );

        tbodyHistoricoClientes.addEventListener(
            "change",
            function (e) {
                if (
                    !e.target.matches(
                        ".checkbox-item-historico-clientes, .checkbox-item-historico-cliente"
                    )
                ) {
                    return;
                }

                const checkbox = e.target;

                const tr =
                    checkbox.closest(
                        "tr.linha-item-historico-cliente, tr"
                    );

                if (tr) {
                    tr.classList.toggle(
                        "linha-selecionada-historico",
                        checkbox.checked
                    );
                }

                atualizarContadorHistoricoClientes();
            }
        );
    }

    /* =====================================================
        CARREGAR HISTÓRICO
    ===================================================== */
    async function carregarHistoricoClientes(
        abrirModal = true
    ) {
        const tipoCliente =
            obterTipoClienteAtivo();

        if (!tipoCliente) {
            mostrarAlerta(
                "Não foi possível identificar o tipo de cliente.",
                "erro"
            );

            return false;
        }

        try {
            const resposta =
                await fetch(
                    `/clientes/historico/?tipo_cliente=${tipoCliente}`
                );

            const resultado =
                await resposta.json();

            if (
                !resposta.ok ||
                !resultado.sucesso
            ) {
                mostrarAlerta(
                    resultado.mensagem ||
                    resultado.erro ||
                    "Não foi possível carregar o histórico.",
                    "erro"
                );

                return false;
            }

            const tbodyHistorico =
                document.getElementById(
                    "tbodyHistoricoClientes"
                );

            if (!tbodyHistorico) {
                console.error(
                    "Tabela do histórico não encontrada."
                );

                return false;
            }

            historicosSelecionados.clear();

            if (resultado.html) {
                tbodyHistorico.innerHTML =
                    resultado.html;
            }

            if (checkboxMasterHistorico) {
                checkboxMasterHistorico.checked = false;
                checkboxMasterHistorico.indeterminate = false;
            }

            atualizarContadorHistoricoClientes();

            if (abrirModal) {
                const modalElement =
                    document.getElementById(
                        "modalHistoricoClientes"
                    );

                if (modalElement) {
                    const modal =
                        bootstrap.Modal.getOrCreateInstance(
                            modalElement
                        );

                    modal.show();
                }
            }

            return true;

        } catch (erro) {
            console.error(
                "Erro ao carregar histórico:",
                erro
            );

            mostrarAlerta(
                "Ocorreu um erro ao carregar o histórico.",
                "erro"
            );

            return false;
        }
    }

    /* =====================================================
        BOTÃO HISTÓRICO
    ===================================================== */
    if (btnHistoricoClientes) {
        btnHistoricoClientes.addEventListener(
            "click",
            () => {
                carregarHistoricoClientes(true);
            }
        );
    }

    /* =====================================================
        ATUALIZAR HISTÓRICO
    ===================================================== */
    if (btnAtualizarHistoricoClientes) {
        btnAtualizarHistoricoClientes.addEventListener(
            "click",
            async function (e) {
                e.preventDefault();

                const atualizado =
                    await carregarHistoricoClientes(
                        false
                    );

                if (
                    atualizado &&
                    typeof mostrarAlerta ===
                        "function"
                ) {
                    mostrarAlerta(
                        "Tabela de histórico atualizada com sucesso!",
                        "sucesso"
                    );
                }
            }
        );
    }

    /* =====================================================
        ABRIR CONFIRMAÇÃO DE EXCLUSÃO DO HISTÓRICO
    ===================================================== */
    if (btnApagarHistorico) {
        btnApagarHistorico.addEventListener(
            "click",
            function (e) {
                e.preventDefault();
                e.stopPropagation();

                const selecionados =
                    getIdsHistoricoClientesSelecionados();

                if (
                    selecionados.length === 0
                ) {
                    mostrarAlerta(
                        "Selecione pelo menos um histórico para apagar.",
                        "alerta"
                    );

                    return;
                }

                if (
                    selecionados.length === 1
                ) {
                    textoConfirmacaoExclusao.innerHTML =
                        "Deseja realmente apagar somente este histórico?";
                } else {
                    textoConfirmacaoExclusao.innerHTML =
                        `Deseja realmente apagar os ${selecionados.length} históricos selecionados?`;
                }

                modalExclusaoHistorico?.show();
            }
        );
    }

    /* =====================================================
        CONFIRMAR EXCLUSÃO DOS HISTÓRICOS
    ===================================================== */
    if (
        btnConfirmarExclusaoHistoricoDefinitiva
    ) {
        btnConfirmarExclusaoHistoricoDefinitiva.addEventListener(
            "click",
            async function () {
                const ids =
                    getIdsHistoricoClientesSelecionados();

                if (
                    ids.length === 0
                ) {
                    mostrarAlerta(
                        "Nenhum histórico foi selecionado para exclusão.",
                        "erro"
                    );

                    return;
                }

                btnConfirmarExclusaoHistoricoDefinitiva.disabled =
                    true;

                try {
                    const resposta =
                        await fetch(
                            "/clientes/historico/apagar/",
                            {
                                method: "POST",
                                headers: {
                                    "X-CSRFToken":
                                        obterCSRFToken(),
                                    "Content-Type":
                                        "application/json"
                                },
                                body:
                                    JSON.stringify({
                                        ids: ids
                                    })
                            }
                        );

                    const dados =
                        await resposta.json();

                    if (
                        !resposta.ok ||
                        !dados.sucesso
                    ) {
                        throw new Error(
                            dados.mensagem ||
                            "Não foi possível apagar os históricos."
                        );
                    }

                    modalExclusaoHistorico?.hide();

                    historicosSelecionados.clear();

                    if (
                        checkboxMasterHistorico
                    ) {
                        checkboxMasterHistorico.checked =
                            false;

                        checkboxMasterHistorico.indeterminate =
                            false;
                    }

                    mostrarAlerta(
                        dados.mensagem ||
                        "Histórico apagado com sucesso!",
                        "sucesso"
                    );

                    await carregarHistoricoClientes(
                        false
                    );

                } catch (erro) {
                    console.error(
                        "Erro ao apagar histórico de clientes:",
                        erro
                    );

                    mostrarAlerta(
                        erro.message ||
                        "Ocorreu um erro ao apagar o histórico.",
                        "erro"
                    );

                } finally {
                    btnConfirmarExclusaoHistoricoDefinitiva.disabled =
                        false;
                }
            }
        );
    }

    /* =====================================================
        DESMARCAR HISTÓRICO AO CLICAR FORA
    ===================================================== */
    document.addEventListener("click", function (e) {
        if (!tbodyHistoricoClientes) {
            return;
        }

        if (historicosSelecionados.size === 0) {
            return;
        }

        const clicouNaLinhaHistorico =
            e.target.closest(
                "tr.linha-item-historico-cliente, tbody tr"
            );

        const clicouNoMaster =
            e.target.closest(
                "#checkboxMasterHistoricoClientes"
            );

        const clicouNoBotaoApagar =
            e.target.closest(
                ".btn-historico-clientes-perigo"
            );

        const clicouNoModalConfirmacao =
            e.target.closest(
                "#modalConfirmarExclusaoHistoricoClientes"
            );

        if (
            clicouNaLinhaHistorico ||
            clicouNoMaster ||
            clicouNoBotaoApagar ||
            clicouNoModalConfirmacao
        ) {
            return;
        }

        limparSelecaoHistorico();
    });

    /* =====================================================
        LIMPAR SELEÇÃO DO HISTÓRICO
    ===================================================== */
    function limparSelecaoHistorico() {
        if (!tbodyHistoricoClientes) {
            return;
        }

        tbodyHistoricoClientes
            .querySelectorAll(
                ".checkbox-item-historico-clientes, .checkbox-item-historico-cliente"
            )
            .forEach(checkbox => {
                checkbox.checked = false;

                const tr =
                    checkbox.closest(
                        "tr.linha-item-historico-cliente, tr"
                    );

                if (tr) {
                    tr.classList.remove(
                        "linha-selecionada-historico"
                    );
                }
            });

        historicosSelecionados.clear();

        if (checkboxMasterHistorico) {
            checkboxMasterHistorico.checked = false;
            checkboxMasterHistorico.indeterminate = false;
        }

        atualizarContadorHistoricoClientes();
    }

});

document.addEventListener("DOMContentLoaded", function () {

     // PESQUISA E TABELA
    const campoBusca = document.getElementById("buscarUsuario");
    const tabelaContainer = document.getElementById("usuariosTabelaContainer");
    const campoStatus = document.getElementById("statusBusca");

    // MODAL VISUALIZAR
    const modal = document.getElementById("modalVisualizarUsuario");
    const conteudo = document.getElementById("conteudoVisualizarUsuario");
    const fecharModal = document.getElementById("fecharModalVisualizar");
    const btnFechar = document.getElementById("btnFecharModalVisualizar");

    // MODAL EDITAR
    const modalEditar = document.getElementById("modalEditarUsuario");
    const formEditar = document.getElementById("formEditarUsuario");
    const mensagemEditar = document.getElementById("mensagemEditarUsuario");
    const btnSalvarEdicao = document.getElementById("btnSalvarEdicao");
    const fecharModalEditar = document.getElementById("fecharModalEditar");
    const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");


    // =========================================
    // MODAL DE FILTROS AVANÇADOS
    // =========================================

    const modalFiltros = document.getElementById("modalFiltros");
    const abrirFiltros = document.getElementById("abrirFiltros");
    const fecharFiltros = document.getElementById("fecharFiltros");
    const cancelarFiltros = document.getElementById("cancelarFiltros");
    const aplicarFiltros = document.getElementById("aplicarFiltros");
    const limparFiltros = document.getElementById("limparFiltros");

    const filtroPeriodoCadastro = document.getElementById("filtroPeriodoCadastro");
    const filtroUltimoAcesso = document.getElementById("filtroUltimoAcesso");
    const filtroStatusAvancado = document.getElementById("filtroStatusAvancado");

    const datasPersonalizadas = document.getElementById("datasPersonalizadas");
    const dataCadastroInicial = document.getElementById("dataCadastroInicial");
    const dataCadastroFinal = document.getElementById("dataCadastroFinal");





    if (!modal || !conteudo || !tabelaContainer) return;

    let temporizadorBusca;
    let requisicaoAtual = null;

    /* =========================================
       PESQUISA AUTOMÁTICA
    ========================================= */
    async function pesquisarUsuarios() {

        // Recupera os parâmetros atuais da URL
        const parametros = new URLSearchParams(window.location.search);

        // Preserva os filtros avançados
        [
            "periodo_cadastro",
            "ultimo_acesso",
            "data_inicial",
            "data_final"
        ].forEach(nome => {
            const valor = parametros.get(nome);

            if (valor) {
                parametros.set(nome, valor);
            }
        });

        // BUSCA
        if (campoBusca && campoBusca.value.trim()) {
            parametros.set("busca", campoBusca.value.trim());
        } else {
            parametros.delete("busca");
        }

        // STATUS
        if (campoStatus && campoStatus.value) {
            parametros.set("status", campoStatus.value);
        } else {
            parametros.delete("status");
        }

        // PERFIL
        const filtroPerfil = document.getElementById("filtroPerfil");

        if (filtroPerfil && filtroPerfil.value) {
            parametros.set("perfil", filtroPerfil.value);
        } else {
            parametros.delete("perfil");
        }

        // REINICIA A PAGINAÇÃO
        parametros.delete("page");

        const url = `${window.location.pathname}?${parametros.toString()}`;

        // Cancela a pesquisa anterior
        if (requisicaoAtual) {
            requisicaoAtual.abort();
        }

        requisicaoAtual = new AbortController();

        try {

            const resposta = await fetch(url, {
                method: "GET",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                },
                signal: requisicaoAtual.signal
            });

            if (!resposta.ok) {
                throw new Error("Erro ao pesquisar usuários.");
            }

            const html = await resposta.text();

            tabelaContainer.innerHTML = html;

            window.history.replaceState({}, "", url);

        } catch (erro) {

            if (erro.name !== "AbortError") {
                console.error("Erro ao pesquisar usuários:", erro);
            }

        }
    }


    /* =========================================
       EVENTO DE DIGITAÇÃO
    ========================================= */

    if (campoBusca && tabelaContainer) {

        campoBusca.addEventListener("input", function () {

            clearTimeout(temporizadorBusca);

            temporizadorBusca = setTimeout(function () {
                pesquisarUsuarios();
            }, 300);

        });

    }


    /* =========================================
       IMPEDIR ENVIO PELO ENTER
    ========================================= */

    const formulario = document.getElementById("formBuscaUsuarios");

    if (formulario) {
        formulario.addEventListener("submit", function (event) {
            event.preventDefault();
        });
    }


    /* =========================================
       FILTRO DE STATUS
    ========================================= */

    window.aplicarFiltroStatus = function (status) {

        if (campoStatus) {
            campoStatus.value = status || "";
        }

        pesquisarUsuarios();
    };


    /* =========================================
       PAGINAÇÃO AJAX
    ========================================= */

    tabelaContainer?.addEventListener("click", function (event) {

        const link = event.target.closest(".paginacao a");

        if (!link) return;

        event.preventDefault();

        if (requisicaoAtual) {
            requisicaoAtual.abort();
        }

        requisicaoAtual = new AbortController();

        fetch(link.href, {
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            },
            signal: requisicaoAtual.signal
        })
        .then(resposta => {
            if (!resposta.ok) throw new Error("Erro na paginação.");
            return resposta.text();
        })
        .then(html => {
            tabelaContainer.innerHTML = html;
            window.history.replaceState({}, "", link.href);
        })
        .catch(erro => {
            if (erro.name !== "AbortError") console.error(erro);
        });

    });


    /* =========================================
       SELECIONAR TODOS
    ========================================= */
    tabelaContainer?.addEventListener("change", function (event) {

        if (event.target.id === "selecionarTodos") {

            tabelaContainer.querySelectorAll(".checkbox-usuario-tabela-adm")
                .forEach(checkbox => {
                    checkbox.checked = event.target.checked;
                });

        }

    });

    /* =========================================
       ABRIR MODAL
    ========================================= */

    async function visualizarUsuario(url) {

        modal.classList.add("ativo");
        document.body.style.overflow = "hidden";

        conteudo.innerHTML = `
            <div class="modal-usuario-carregando">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Carregando informações...</span>
            </div>
        `;

        try {

            const resposta = await fetch(url, {
                method: "GET",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.sucesso) {
                throw new Error(
                    resultado.mensagem || "Não foi possível carregar o usuário."
                );
            }

            const usuario = resultado.usuario;

            conteudo.innerHTML = "";

            const criarElemento = (tag, classe, texto) => {
                const elemento = document.createElement(tag);
                elemento.className = classe;
                elemento.textContent = texto;
                return elemento;
            };

            // CABEÇALHO DO PERFIL
            const perfil = document.createElement("div");
            perfil.className = "visualizar-perfil";

            const avatar = criarElemento(
                "div",
                "visualizar-avatar",
                usuario.nome.charAt(0).toUpperCase()
            );

            const identificacao = document.createElement("div");
            identificacao.className = "visualizar-identificacao";

            identificacao.appendChild(
                criarElemento("strong", "", usuario.nome)
            );

            identificacao.appendChild(
                criarElemento("span", "", "@" + usuario.usuario)
            );

            perfil.append(avatar, identificacao);

            conteudo.appendChild(perfil);

            // INFORMAÇÕES
            const secao = document.createElement("div");
            secao.className = "visualizar-informacoes";

            const titulo = criarElemento(
                "h4",
                "visualizar-secao-titulo",
                "Informações da conta"
            );

            secao.appendChild(titulo);

            const campos = [
                ["Nome", usuario.primeiro_nome || "Não informado"],
                ["E-mail", usuario.email],
                ["Perfil", usuario.perfil],
                ["Status", usuario.status],
                ["Data de cadastro", usuario.data_cadastro],
                ["Último acesso", usuario.ultimo_acesso]
            ];

            campos.forEach(([rotulo, valor]) => {

                const campo = document.createElement("div");
                campo.className = "visualizar-campo";

                campo.appendChild(
                    criarElemento("span", "visualizar-rotulo", rotulo)
                );

                campo.appendChild(
                    criarElemento("strong", "visualizar-valor", valor)
                );

                secao.appendChild(campo);

            });

            conteudo.appendChild(secao);

        } catch (erro) {

            conteudo.innerHTML = "";

            const mensagem = document.createElement("div");
            mensagem.className = "modal-usuario-erro";
            mensagem.textContent = erro.message;

            conteudo.appendChild(mensagem);

            console.error("Erro ao visualizar usuário:", erro);
        }
    }


    /* =========================================
       IDENTIFICAR BOTÃO VISUALIZAR
    ========================================= */

    tabelaContainer.addEventListener("click", function (event) {

        const botao = event.target.closest(
            '[data-action="visualizar"]'
        );

        if (!botao) return;

        visualizarUsuario(botao.dataset.url);

    });


    /* =========================================
       FECHAR MODAL
    ========================================= */
    function fechar() {
        modal.classList.remove("ativo");
        document.body.style.overflow = "";
    }

    fecharModal?.addEventListener("click", fechar);
    btnFechar?.addEventListener("click", fechar);

    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            fechar();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && modal.classList.contains("ativo")) {
            fechar();
        }
    });

        /* =========================================
       EDITAR USUÁRIO
    ========================================= */

    if (
        modalEditar &&
        formEditar &&
        mensagemEditar &&
        btnSalvarEdicao &&
        fecharModalEditar &&
        btnCancelarEdicao
    ) {

        function obterCSRFToken() {
            return formEditar.querySelector(
                '[name="csrfmiddlewaretoken"]'
            )?.value;
        }

        function fecharEdicao() {
            modalEditar.classList.remove("ativo");
            document.body.style.overflow = "";
            formEditar.reset();

            mensagemEditar.textContent = "";
            mensagemEditar.className = "mensagem-editar-usuario";
        }

        async function lerRespostaJSON(resposta) {
            const texto = await resposta.text();

            try {
                return JSON.parse(texto);
            } catch {
                console.error("Resposta não JSON do servidor:", texto);

                throw new Error(
                    `O servidor retornou um erro (${resposta.status}). Verifique o terminal do Django.`
                );
            }
        }

        let urlEdicaoAtual = "";

        // ABRIR MODAL E CARREGAR DADOS
        async function abrirModalEdicao(url) {

            urlEdicaoAtual = url;

            modalEditar.classList.add("ativo");
            document.body.style.overflow = "hidden";

            mensagemEditar.textContent = "";
            mensagemEditar.className = "mensagem-editar-usuario";

            btnSalvarEdicao.disabled = true;
            btnSalvarEdicao.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Carregando...
            `;

            try {

                const resposta = await fetch(url, {
                    method: "GET",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest"
                    }
                });

                const resultado = await lerRespostaJSON(resposta);

                if (!resposta.ok || !resultado.sucesso) {
                    throw new Error(
                        resultado.mensagem || "Não foi possível carregar os dados."
                    );
                }

                const usuario = resultado.usuario;
                document.getElementById("editarUsuarioId").value = usuario.id;
                document.getElementById("editarUsuario").value = usuario.username;
                document.getElementById("editarNome").value = usuario.nome;
                document.getElementById("editarEmail").value = usuario.email;
                document.getElementById("editarPerfil").value = usuario.perfil;
                document.getElementById("editarStatus").value = usuario.status;

            } catch (erro) {

                mensagemEditar.textContent = erro.message;
                mensagemEditar.classList.add("erro");

                console.error("Erro ao carregar usuário:", erro);

            } finally {

                btnSalvarEdicao.disabled = false;
                btnSalvarEdicao.innerHTML = `
                    <i class="fa-solid fa-floppy-disk"></i>
                    Salvar alterações
                `;

            }
        }

        // IDENTIFICAR BOTÃO EDITAR
        tabelaContainer.addEventListener("click", function (event) {

            const botao = event.target.closest('[data-action="editar"]');

            if (!botao) return;

            abrirModalEdicao(botao.dataset.url);

        });

        // SALVAR ALTERAÇÕES
        formEditar.addEventListener("submit", async function (event) {

            event.preventDefault();

            if (!urlEdicaoAtual) {
                mensagemEditar.textContent = "URL de edição não encontrada.";
                mensagemEditar.classList.add("erro");
                return;
            }

            mensagemEditar.textContent = "";
            mensagemEditar.className = "mensagem-editar-usuario";

            btnSalvarEdicao.disabled = true;
            btnSalvarEdicao.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Salvando...
            `;

            try {

                const resposta = await fetch(urlEdicaoAtual, {
                    method: "POST",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "X-CSRFToken": obterCSRFToken()
                    },
                    body: new FormData(formEditar)
                });

                const resultado = await lerRespostaJSON(resposta);

                if (!resposta.ok || !resultado.sucesso) {
                    throw new Error(
                        resultado.mensagem || "Não foi possível atualizar o usuário."
                    );
                }

                mensagemEditar.textContent = resultado.mensagem;
                mensagemEditar.classList.add("sucesso");

                // ATUALIZAR TABELA
                const parametros = new URLSearchParams(window.location.search);

                const respostaTabela = await fetch(
                    `${window.location.pathname}?${parametros.toString()}`,
                    {
                        headers: {
                            "X-Requested-With": "XMLHttpRequest"
                        }
                    }
                );

                if (!respostaTabela.ok) {
                    throw new Error("Usuário atualizado, mas não foi possível atualizar a tabela.");
                }

                tabelaContainer.innerHTML = await respostaTabela.text();

                setTimeout(fecharEdicao, 700);

            } catch (erro) {

                mensagemEditar.textContent = erro.message;
                mensagemEditar.classList.add("erro");

                console.error("Erro ao editar usuário:", erro);

            } finally {

                btnSalvarEdicao.disabled = false;
                btnSalvarEdicao.innerHTML = `
                    <i class="fa-solid fa-floppy-disk"></i>
                    Salvar alterações
                `;

            }

        });

        // FECHAR MODAL
        fecharModalEditar.addEventListener("click", fecharEdicao);
            btnCancelarEdicao.addEventListener("click", fecharEdicao);

            modalEditar.addEventListener("click", function (event) {

                if (event.target === modalEditar) {
                    fecharEdicao();
                }

            });

        } else {

            console.warn(
                "Modal de edição: um ou mais elementos HTML não foram encontrados."
            );

        }

    // FILTRO DE PERFIL
    const filtroPerfil = document.getElementById("filtroPerfil");

    if (filtroPerfil && tabelaContainer) {

        filtroPerfil.addEventListener("change", async function () {

            const parametros = new URLSearchParams(window.location.search);

            // Atualiza o perfil selecionado
            parametros.set("perfil", this.value);

            // Reinicia a paginação
            parametros.delete("page");

            // Mantém os demais filtros
            const busca = document.getElementById("buscarUsuario");
            const status = document.getElementById("filtroStatus");

            if (busca) {
                parametros.set("busca", busca.value);
            }

            if (status) {
                parametros.set("status", status.value);
            }

            try {
                const resposta = await fetch(
                    `${window.location.pathname}?${parametros.toString()}`,
                    {
                        method: "GET",
                        headers: {
                            "X-Requested-With": "XMLHttpRequest"
                        }
                    }
                );

                if (!resposta.ok) {
                    throw new Error("Erro ao filtrar usuários.");
                }

                const html = await resposta.text();

                tabelaContainer.innerHTML = html;

                // Atualiza a URL sem recarregar a página
                history.replaceState(
                    null,
                    "",
                    `${window.location.pathname}?${parametros.toString()}`
                );

            } catch (erro) {
                console.error("Erro no filtro de perfil:", erro);
            }

        });

    }

    function abrirModalFiltros() {
    if (!modalFiltros) return;

    modalFiltros.classList.add("ativo");
    document.body.style.overflow = "hidden";
}

function fecharModalFiltros() {
    if (!modalFiltros) return;

    modalFiltros.classList.remove("ativo");
    document.body.style.overflow = "";
}

if (abrirFiltros) {
    abrirFiltros.addEventListener("click", abrirModalFiltros);
}

if (fecharFiltros) {
    fecharFiltros.addEventListener("click", fecharModalFiltros);
}

if (cancelarFiltros) {
    cancelarFiltros.addEventListener("click", fecharModalFiltros);
}

if (modalFiltros) {
    modalFiltros.addEventListener("click", function (event) {
        if (event.target === modalFiltros) {
            fecharModalFiltros();
        }
    });
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        fecharModalFiltros();
    }
});

// EXIBIR DATAS PERSONALIZADAS
if (filtroPeriodoCadastro && datasPersonalizadas) {
    filtroPeriodoCadastro.addEventListener("change", function () {
        datasPersonalizadas.hidden = this.value !== "personalizado";
    });
}

// CARREGAR FILTROS DA URL
function carregarFiltrosAvancados() {
    const parametros = new URLSearchParams(window.location.search);

    if (filtroPeriodoCadastro) {
        filtroPeriodoCadastro.value = parametros.get("periodo_cadastro") || "";
    }

    if (filtroUltimoAcesso) {
        filtroUltimoAcesso.value = parametros.get("ultimo_acesso") || "";
    }

    if (filtroStatusAvancado) {
        filtroStatusAvancado.value = parametros.get("status") || "";
    }

    if (dataCadastroInicial) {
        dataCadastroInicial.value = parametros.get("data_inicial") || "";
    }

    if (dataCadastroFinal) {
        dataCadastroFinal.value = parametros.get("data_final") || "";
    }

    if (datasPersonalizadas) {
        datasPersonalizadas.hidden =
            !filtroPeriodoCadastro ||
            filtroPeriodoCadastro.value !== "personalizado";
    }
}

    carregarFiltrosAvancados();

    // LIMPAR FILTROS AVANÇADOS
    if (limparFiltros) {
        limparFiltros.addEventListener("click", function () {
            if (filtroPeriodoCadastro) filtroPeriodoCadastro.value = "";
            if (filtroUltimoAcesso) filtroUltimoAcesso.value = "";
            if (filtroStatusAvancado) filtroStatusAvancado.value = "";
            if (dataCadastroInicial) dataCadastroInicial.value = "";
            if (dataCadastroFinal) dataCadastroFinal.value = "";

            if (datasPersonalizadas) {
                datasPersonalizadas.hidden = true;
            }
        });
    }

    // APLICAR FILTROS
    if (aplicarFiltros) {
        aplicarFiltros.addEventListener("click", async function () {

            const periodo = filtroPeriodoCadastro?.value || "";
            const ultimoAcesso = filtroUltimoAcesso?.value || "";
            const status = filtroStatusAvancado?.value || "";

            const dataInicial = dataCadastroInicial?.value || "";
            const dataFinal = dataCadastroFinal?.value || "";

            if (periodo === "personalizado") {
                if (!dataInicial || !dataFinal) {
                    alert("Informe a data inicial e a data final.");
                    return;
                }

                if (dataInicial > dataFinal) {
                    alert("A data inicial não pode ser maior que a data final.");
                    return;
                }
            }

            const parametros = new URLSearchParams(window.location.search);

            // PRESERVAR BUSCA E PERFIL
            const busca = document.getElementById("buscarUsuario");
            const perfil = document.getElementById("filtroPerfil");

            if (busca?.value.trim()) {
                parametros.set("busca", busca.value.trim());
            } else {
                parametros.delete("busca");
            }

            if (perfil?.value) {
                parametros.set("perfil", perfil.value);
            } else {
                parametros.delete("perfil");
            }

            // PERÍODO DE CADASTRO
            if (periodo) {
                parametros.set("periodo_cadastro", periodo);
            } else {
                parametros.delete("periodo_cadastro");
            }

            // ÚLTIMO ACESSO
            if (ultimoAcesso) {
                parametros.set("ultimo_acesso", ultimoAcesso);
            } else {
                parametros.delete("ultimo_acesso");
            }

            // STATUS
            if (status) {
                parametros.set("status", status);
            } else {
                parametros.delete("status");
            }

            // DATAS PERSONALIZADAS
            if (periodo === "personalizado") {
                parametros.set("data_inicial", dataInicial);
                parametros.set("data_final", dataFinal);
            } else {
                parametros.delete("data_inicial");
                parametros.delete("data_final");
            }

            parametros.delete("page");

            const url = `${window.location.pathname}?${parametros.toString()}`;

            try {
                aplicarFiltros.disabled = true;

                const resposta = await fetch(url, {
                    headers: {
                        "X-Requested-With": "XMLHttpRequest"
                    }
                });

                if (!resposta.ok) {
                    throw new Error("Não foi possível aplicar os filtros.");
                }

                const html = await resposta.text();

                if (tabelaContainer) {
                    tabelaContainer.innerHTML = html;
                }

                history.replaceState({}, "", url);

                // Atualizar select de status da barra principal
                if (campoStatus) {
                    campoStatus.value = status;
                }

                fecharModalFiltros();

            } catch (erro) {
                console.error("Erro ao aplicar filtros:", erro);
                alert("Ocorreu um erro ao aplicar os filtros.");
            } finally {
                aplicarFiltros.disabled = false;
            }
        });
    }

});

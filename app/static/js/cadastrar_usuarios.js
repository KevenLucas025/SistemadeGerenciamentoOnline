document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       ELEMENTOS E INSTÂNCIA DO BOOTSTRAP
    ========================================= */
    const LIMITE_CARACTERES_USERNAME = 11;

    const modalElement = document.getElementById("modalTabelaUsuarios");

    const btnEditar = document.getElementById("btnEditarUsuario");
    const btnFecharModal = document.getElementById("fecharModalUsuarios");
    const btnLimparCampos = document.getElementById("btnApagarUsuario");
    const btnAtualizar = document.getElementById("btnAtualizarUsuario");
    const btnAtualizarUsuarioModal = document.getElementById("btnAtualizarUsuarioModal");
    const tabelaUsuarios = document.getElementById("tabelaModalUsuarios");
    const btnAtualizarTabela = document.getElementById("btnAtualizarTabelaModal");
    const tabela = document.getElementById("tabelaModalUsuarios");
    const btnApagarModal = document.getElementById("btnApagarUsuarioModal");
    const modalApagarElement = document.getElementById("modalApagarUsuario");
    const btnConfirmarApagar = document.getElementById("btnConfirmarApagarUsuario");
    const btnSairEdicao = document.getElementById("btnSairEdicao");

    let usuarioParaApagarId = null;
    let usuarioEmEdicao = null;
    let dadosOriginais = {};
    let imagemOriginal = "";
    let permitirEnvioSemImagem = false;

    // Instância do modal Bootstrap de apagar
    const instanceModalApagar = modalApagarElement
        ? bootstrap.Modal.getOrCreateInstance(modalApagarElement)
        : null;

    const modalUsuarios = modalElement
        ? bootstrap.Modal.getOrCreateInstance(modalElement)
        : null;

    /* =========================================
       CAMPOS DO FORMULÁRIO
    ========================================= */
    const campoNome = document.getElementById("usuarioNome");
    const campoUsername = document.getElementById("usuarioUsername");
    const campoSenha = document.getElementById("usuarioSenha");
    const campoSenhaConfirmacao = document.getElementById("usuarioSenhaConfirmacao");
    const containerCamposSenha = document.getElementById("containerCamposSenha");
    const avisoAlteracaoSenha = document.getElementById("avisoAlteracaoSenhaEdicao");

    const campoCep = document.getElementById("usuarioCep");
    const campoEndereco = document.getElementById("usuarioEndereco");
    const campoNumero = document.getElementById("usuarioNumero");
    const campoBairro = document.getElementById("usuarioBairro");
    const campoCidade = document.getElementById("usuarioCidade");
    const campoEstado = document.getElementById("usuarioEstado");
    const campoComplemento = document.getElementById("usuarioComplemento");
    const campoTelefone = document.getElementById("usuarioTelefone");
    const campoEmail = document.getElementById("usuarioEmail");
    const campoNascimento = document.getElementById("usuarioNascimento");
    const campoRg = document.getElementById("usuarioRg");
    const campoCpf = document.getElementById("usuarioCpf");
    const campoCnpj = document.getElementById("usuarioCnpj");
    const campoPerfil = document.getElementById("usuarioPerfil");

    const btnUploadCarregar = document.getElementById("btnUploadCarregarCadastrarUsuarios");
    const btnUploadRemover = document.getElementById("btnUploadRemoverCadastrarUsuarios");
    const inputImagem = document.getElementById("inputImagemCadastrarUsuarios");
    const uploadBox = document.getElementById("uploadBoxCadastrarUsuarios");
    const imgPreview = document.getElementById("img-preview");
    const previewEmpty = document.querySelector(".preview-empty-cadastrar-usuarios");

    /* =========================================
       FUNÇÃO DE ALTERNÂNCIA DE SENHA
    ========================================= */
    function alternarVisibilidadeSenha(modoEdicao = false) {
        if (modoEdicao) {
            if (containerCamposSenha) containerCamposSenha.style.setProperty("display", "none", "important");
            if (avisoAlteracaoSenha) avisoAlteracaoSenha.style.setProperty("display", "flex", "important");
            if (campoSenha) campoSenha.value = "";
            if (campoSenhaConfirmacao) campoSenhaConfirmacao.value = "";
        } else {
            if (containerCamposSenha) containerCamposSenha.style.removeProperty("display");
            if (avisoAlteracaoSenha) avisoAlteracaoSenha.style.setProperty("display", "none", "important");
        }
    }

    /* =========================================
       LEITURA DE PARÂMETRO ?id= NA URL (AUTO-LOAD)
    ========================================= */
    const urlParams = new URLSearchParams(window.location.search);
    const usuarioIdParaEditar = urlParams.get("id");

    if (usuarioIdParaEditar) {
        carregarDadosUsuarioParaEdicao(usuarioIdParaEditar);
    }

    if (btnLimparCampos) {
        btnLimparCampos.addEventListener("click", function () {
            const campos = [
                campoNome,
                campoUsername,
                campoSenha,
                campoSenhaConfirmacao,
                campoCep,
                campoEndereco,
                campoNumero,
                campoBairro,
                campoCidade,
                campoEstado,
                campoComplemento,
                campoTelefone,
                campoEmail,
                campoNascimento,
                campoRg,
                campoCpf,
                campoCnpj,
                campoPerfil
            ];

            const existeDados = campos.some(function (campo) {
                return campo && campo.value.trim() !== "";
            });

            const existeImagem =
                inputImagem &&
                inputImagem.files &&
                inputImagem.files.length > 0;

            if (!existeDados && !existeImagem) {
                mostrarAlerta("Não há dados para limpar.", "erro");
                return;
            }

            limparCamposUsuario();

            if (inputImagem) {
                inputImagem.value = "";
            }

            if (imgPreview) {
                imgPreview.src = "";
                imgPreview.style.display = "none";
            }

            if (previewEmpty) {
                previewEmpty.style.display = "flex";
            }

            mostrarAlerta(
                "Os dados foram limpos com sucesso.",
                "sucesso"
            );
        });

        document.querySelectorAll(".input-erro").forEach(function (campo) {
            campo.classList.remove("input-erro");
        });
    }

    /* =========================================
       UPLOAD DA FOTO DO USUÁRIO
    ========================================= */
    if (btnUploadCarregar && inputImagem) {
        btnUploadCarregar.addEventListener("click", function () {
            inputImagem.click();
        });
    }

    if (uploadBox && inputImagem) {
        uploadBox.addEventListener("click", function () {
            inputImagem.click();
        });
    }

    if (inputImagem && imgPreview) {
        inputImagem.addEventListener("change", function () {
            const arquivo = this.files[0];

            if (!arquivo) {
                return;
            }

            if (!arquivo.type.startsWith("image/")) {
                mostrarAlerta("Selecione um arquivo de imagem válido.", "erro");
                this.value = "";
                return;
            }

            const leitor = new FileReader();

            leitor.onload = function (evento) {
                imgPreview.src = evento.target.result;
                imgPreview.style.display = "block";

                if (previewEmpty) {
                    previewEmpty.style.display = "none";
                }
            };

            leitor.readAsDataURL(arquivo);
        });
    }

    if (btnUploadRemover) {
        btnUploadRemover.addEventListener("click", function () {
            if (inputImagem) {
                inputImagem.value = "";
            }

            if (imgPreview) {
                imgPreview.src = "";
                imgPreview.style.display = "none";
            }

            if (previewEmpty) {
                previewEmpty.style.display = "flex";
            }
        });
    }

    if (typeof aplicarMascarasFormulario === "function") {
        aplicarMascarasFormulario();
    }

    /* =========================================
       FUNÇÕES DO MODAL
    ========================================= */
    function abrirModalUsuarios() {
        if (!modalElement) {
            return;
        }
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
        modalInstance.show();
    }

    function fecharModalUsuarios() {
        if (modalUsuarios) {
            modalUsuarios.hide();
        }
    }

    if (btnEditar) {
        btnEditar.addEventListener("click", abrirModalUsuarios);
    }

    if (btnFecharModal) {
        btnFecharModal.addEventListener("click", fecharModalUsuarios);
    }

    /* =========================================
       BUSCA NA TABELA
    ========================================= */
    const busca = document.getElementById("buscaModalUsuarios");

    if (busca) {
        busca.addEventListener("input", function () {
            const termo = this.value.toLowerCase().trim();
            const linhas = document.querySelectorAll(
                "#tabelaModalUsuarios tr[data-usuario], #tabelaModalUsuarios tr[data-usuario-id]"
            );

            linhas.forEach(function (linha) {
                const texto = linha.textContent.toLowerCase();
                linha.style.display = texto.includes(termo) ? "" : "none";
            });
        });
    }

    if (btnSairEdicao) {
        btnSairEdicao.addEventListener("click", function () {
            if (!usuarioEmEdicao) {
                mostrarAlerta("Você não está no modo edição.", "erro");
                return;
            }
            sairModoEdicaoUsuario();
        });
    }

    /* =========================================
       SELEÇÃO DAS LINHAS
    ========================================= */
    function obterLinhasUsuarios() {
        return document.querySelectorAll("#tabelaModalUsuarios tr");
    }

    function registrarEventosLinhas() {
        obterLinhasUsuarios().forEach(function (linha) {
            linha.addEventListener("click", function (event) {
                if (event.target.type === "checkbox") {
                    if (event.target.checked) {
                        linha.classList.add("usuario-selecionado");
                    } else {
                        linha.classList.remove("usuario-selecionado");
                    }
                    return;
                }

                const checkbox = linha.querySelector('input[name="usuario_selecionado"]');
                if (!checkbox) {
                    return;
                }

                checkbox.checked = !checkbox.checked;

                if (checkbox.checked) {
                    linha.classList.add("usuario-selecionado");
                } else {
                    linha.classList.remove("usuario-selecionado");
                }
            });
        });
    }

    registrarEventosLinhas();

    /* =======================================================
       1. CARREGAR DADOS DO MODAL PARA O FORMULÁRIO (VIA API)
    ======================================================= */
    if (btnAtualizarUsuarioModal) {
        btnAtualizarUsuarioModal.addEventListener("click", async function () {
            if (!tabelaUsuarios) return;

            const selecionados = tabelaUsuarios.querySelectorAll(
                'input[name="usuario_selecionado"]:checked'
            );

            if (selecionados.length === 0) {
                mostrarAlerta("Selecione um usuário para atualizar.", "erro");
                return;
            }

            if (selecionados.length > 1) {
                mostrarAlerta("Apenas um usuário pode ser atualizado por vez.", "erro");
                return;
            }

            const checkbox = selecionados[0];
            const linha = checkbox.closest("tr");
            if (!linha) return;

            const idUsuario = checkbox.value ||
                linha.getAttribute("data-usuario-id") ||
                linha.getAttribute("data-usuario");

            if (!idUsuario) {
                mostrarAlerta("Identificador do usuário não encontrado.", "erro");
                return;
            }

            await carregarDadosUsuarioParaEdicao(idUsuario);

            checkbox.checked = false;
            linha.classList.remove("usuario-selecionado");
            fecharModalUsuarios();
        });
    }

    /* =========================================
       FUNÇÃO AUXILIAR PARA CHECAR ALTERAÇÕES
    ========================================= */
    function houveAlteracaoUsuario() {
        const nomeAtual = (campoNome?.value || "").trim();
        const usernameAtual = (campoUsername?.value || "").trim();
        const cepAtual = (campoCep?.value || "").trim();
        const enderecoAtual = (campoEndereco?.value || "").trim();
        const numeroAtual = (campoNumero?.value || "").trim();
        const bairroAtual = (campoBairro?.value || "").trim();
        const cidadeAtual = (campoCidade?.value || "").trim();
        const estadoAtual = (campoEstado?.value || "").trim();
        const complementoAtual = (campoComplemento?.value || "").trim();
        const telefoneAtual = (campoTelefone?.value || "").trim();
        const emailAtual = (campoEmail?.value || "").trim();
        const nascimentoAtual = (campoNascimento?.value || "").trim();
        const rgAtual = (campoRg?.value || "").trim();
        const cpfAtual = (campoCpf?.value || "").trim();
        const cnpjAtual = (campoCnpj?.value || "").trim();
        const acessoAtual = (campoPerfil?.value || "").trim();
        const temNovaImagem = inputImagem && inputImagem.files && inputImagem.files.length > 0;

        return (
            nomeAtual !== (dadosOriginais.nome || "") ||
            usernameAtual !== (dadosOriginais.username || "") ||
            cepAtual !== (dadosOriginais.cep || "") ||
            enderecoAtual !== (dadosOriginais.endereco || "") ||
            numeroAtual !== (dadosOriginais.numero || "") ||
            bairroAtual !== (dadosOriginais.bairro || "") ||
            cidadeAtual !== (dadosOriginais.cidade || "") ||
            estadoAtual !== (dadosOriginais.estado || "") ||
            complementoAtual !== (dadosOriginais.complemento || "") ||
            telefoneAtual !== (dadosOriginais.telefone || "") ||
            emailAtual !== (dadosOriginais.email || "") ||
            nascimentoAtual !== (dadosOriginais.data_nascimento || "") ||
            rgAtual !== (dadosOriginais.rg || "") ||
            cpfAtual !== (dadosOriginais.cpf || "") ||
            cnpjAtual !== (dadosOriginais.cnpj || "") ||
            acessoAtual !== (dadosOriginais.acesso || "") ||
            temNovaImagem
        );
    }

    /* =========================================
       2. REQUISIÇÃO DE ATUALIZAÇÃO NO BANCO
    ========================================= */
    if (btnAtualizar) {
        btnAtualizar.addEventListener("click", async function () {
            const usuarioId = usuarioEmEdicao || document.body.dataset.usuarioEditando;

            if (!usuarioId) {
                mostrarAlerta(
                    "Nenhum usuário selecionado para atualização. Primeiro recupere um usuário através do botão Editar.",
                    "erro"
                );
                return;
            }

            if (!houveAlteracaoUsuario()) {
                mostrarAlerta(
                    "Nenhuma alteração foi realizada para atualizar o usuário.",
                    "erro"
                );
                return;
            }

            const dados = new FormData();
            dados.append("nome", campoNome?.value.trim() || "");
            dados.append("username", campoUsername?.value.trim() || "");
            dados.append("cep", campoCep?.value.trim() || "");
            dados.append("endereco", campoEndereco?.value.trim() || "");
            dados.append("numero", campoNumero?.value.trim() || "");
            dados.append("bairro", campoBairro?.value.trim() || "");
            dados.append("cidade", campoCidade?.value.trim() || "");
            dados.append("estado", campoEstado?.value.trim() || "");
            dados.append("complemento", campoComplemento?.value.trim() || "");
            dados.append("telefone", campoTelefone?.value.trim() || "");
            dados.append("email", campoEmail?.value.trim() || "");
            dados.append("data_nascimento", campoNascimento?.value || "");
            dados.append("rg", campoRg?.value.trim() || "");
            dados.append("cpf", campoCpf?.value.trim() || "");
            dados.append("cnpj", campoCnpj?.value.trim() || "");
            dados.append("acesso", campoPerfil?.value.trim() || "");

            if (inputImagem && inputImagem.files && inputImagem.files.length > 0) {
                dados.append("imagem", inputImagem.files[0]);
            }

            const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]")?.value;

            if (!csrfToken) {
                mostrarAlerta("Token de segurança não encontrado.", "erro");
                return;
            }

            try {
                btnAtualizar.disabled = true;

                const resposta = await fetch(`/usuarios/atualizar/${usuarioId}/`, {
                    method: "POST",
                    headers: { "X-CSRFToken": csrfToken },
                    body: dados
                });

                const textoResposta = await resposta.text();
                let resultado;
                try {
                    resultado = JSON.parse(textoResposta);
                } catch (e) {
                    console.error("Resposta do servidor não foi JSON:", textoResposta);
                    mostrarAlerta("Erro interno no servidor ao atualizar o usuário.", "erro");
                    return;
                }

                if (!resposta.ok || !resultado.sucesso) {
                    mostrarAlerta(resultado.mensagem || "Não foi possível atualizar o usuário.", "erro");
                    return;
                }

                mostrarAlerta("Usuário atualizado com sucesso!", "sucesso");

                // LIMPA OS CAMPOS E ENCERRA O MODO DE EDIÇÃO
                sairModoEdicaoUsuario(true);

                // Atualiza o snapshot para não acusar alteração indevida
                dadosOriginais = {
                    nome: (campoNome?.value || "").trim(),
                    username: (campoUsername?.value || "").trim(),
                    cep: (campoCep?.value || "").trim(),
                    endereco: (campoEndereco?.value || "").trim(),
                    numero: (campoNumero?.value || "").trim(),
                    bairro: (campoBairro?.value || "").trim(),
                    cidade: (campoCidade?.value || "").trim(),
                    estado: (campoEstado?.value || "").trim(),
                    complemento: (campoComplemento?.value || "").trim(),
                    telefone: (campoTelefone?.value || "").trim(),
                    email: (campoEmail?.value || "").trim(),
                    data_nascimento: (campoNascimento?.value || "").trim(),
                    rg: (campoRg?.value || "").trim(),
                    cpf: (campoCpf?.value || "").trim(),
                    cnpj: (campoCnpj?.value || "").trim(),
                    acesso: (campoPerfil?.value || "").trim()
                };

            } catch (erro) {
                console.error("Erro ao atualizar usuário:", erro);
                mostrarAlerta("Erro de comunicação com o servidor.", "erro");
            } finally {
                btnAtualizar.disabled = false;
            }
        });
    }

    function limparCamposUsuario() {
        if (campoNome) campoNome.value = "";
        if (campoUsername) campoUsername.value = "";
        if (campoSenha) {
            campoSenha.value = "";
            campoSenha.type = "password";
        }
        if (campoSenhaConfirmacao) {
            campoSenhaConfirmacao.value = "";
            campoSenhaConfirmacao.type = "password";
        }

        if (campoCep) campoCep.value = "";
        if (campoEndereco) campoEndereco.value = "";
        if (campoNumero) campoNumero.value = "";

        if (campoBairro) campoBairro.value = "";
        if (campoCidade) campoCidade.value = "";
        if (campoEstado) campoEstado.value = "";

        if (campoComplemento) campoComplemento.value = "";
        if (campoTelefone) campoTelefone.value = "";
        if (campoEmail) campoEmail.value = "";

        if (campoNascimento) campoNascimento.value = "";

        if (campoRg) campoRg.value = "";
        if (campoCpf) campoCpf.value = "";
        if (campoCnpj) campoCnpj.value = "";

        if (campoPerfil) campoPerfil.value = "";

        if (inputImagem) {
            inputImagem.value = "";
        }

        if (imgPreview) {
            imgPreview.src = "";
            imgPreview.style.display = "none";
        }

        if (previewEmpty) {
            previewEmpty.style.display = "flex";
        }

        if (uploadBox) {
            uploadBox.innerHTML = `
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <span>Arraste uma foto ou clique para selecionar</span>
            `;
        }

        alternarVisibilidadeSenha(false);
    }

    /* =========================================
       CADASTRAR USUÁRIO
    ========================================= */
    const btnSalvarUsuario = document.getElementById("btnSalvarUsuario");

    if (btnSalvarUsuario) {
        btnSalvarUsuario.addEventListener("click", async function () {
            if (usuarioEmEdicao) {
                mostrarAlerta(
                    "Você está editando um usuário. Utilize o botão 'Atualizar' para salvar as alterações.",
                    "erro"
                );
                return;
            }

            const camposObrigatorios = [
                { campo: campoNome, nome: "Nome" },
                { campo: campoUsername, nome: "Usuário" },
                { campo: campoSenha, nome: "Senha" },
                { campo: campoSenhaConfirmacao, nome: "Confirmação de senha" },
                { campo: campoEmail, nome: "E-mail" },
                { campo: campoPerfil, nome: "Perfil de acesso" }
            ];

            camposObrigatorios.forEach(function (item) {
                if (item.campo) {
                    item.campo.classList.remove("input-erro");
                }
            });

            for (const item of camposObrigatorios) {
                const campo = item.campo;
                if (!campo) continue;

                const valor = campo.value.trim();

                if (!valor) {
                    mostrarAlerta(`Preencha o campo ${item.nome}.`, "erro");

                    if (typeof marcarErroUsuario === "function") {
                        marcarErroUsuario(campo);
                    } else {
                        campo.classList.add("input-erro");
                        campo.focus();
                    }
                    return;
                }
            }

            if (
                campoSenha &&
                campoSenhaConfirmacao &&
                campoSenha.value !== campoSenhaConfirmacao.value
            ) {
                mostrarAlerta("As senhas não coincidem.", "erro");

                if (typeof marcarErroUsuario === "function") {
                    marcarErroUsuario(campoSenhaConfirmacao);
                } else {
                    campoSenhaConfirmacao.classList.add("input-erro");
                    campoSenhaConfirmacao.focus();
                }
                return;
            }

            const dados = new FormData();
            dados.append("nome", campoNome?.value.trim() || "");
            dados.append("username", campoUsername?.value.trim() || "");
            dados.append("senha", campoSenha?.value.trim() || "");
            dados.append("email", campoEmail?.value.trim() || "");
            dados.append("cep", campoCep?.value.trim() || "");
            dados.append("endereco", campoEndereco?.value.trim() || "");
            dados.append("numero", campoNumero?.value.trim() || "");
            dados.append("bairro", campoBairro?.value.trim() || "");
            dados.append("cidade", campoCidade?.value.trim() || "");
            dados.append("estado", campoEstado?.value.trim() || "");
            dados.append("complemento", campoComplemento?.value.trim() || "");
            dados.append("telefone", campoTelefone?.value.trim() || "");
            dados.append("data_nascimento", campoNascimento?.value || "");
            dados.append("rg", campoRg?.value.trim() || "");
            dados.append("cpf", campoCpf?.value.trim() || "");
            dados.append("cnpj", campoCnpj?.value.trim() || "");
            dados.append("acesso", campoPerfil?.value.trim() || "");

            if (inputImagem && inputImagem.files && inputImagem.files.length > 0) {
                dados.append("imagem", inputImagem.files[0]);
            }

            const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]")?.value;

            if (!csrfToken) {
                mostrarAlerta("Token de segurança não encontrado.", "erro");
                return;
            }

            try {
                btnSalvarUsuario.disabled = true;

                const resposta = await fetch("/usuarios/cadastrar/", {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken
                    },
                    body: dados
                });

                const resultado = await resposta.json();

                if (!resposta.ok || !resultado.sucesso) {
                    mostrarAlerta(
                        resultado.mensagem || "Não foi possível cadastrar o usuário.",
                        "erro"
                    );
                    return;
                }

                mostrarAlerta("Usuário cadastrado com sucesso.", "sucesso");

                limparCamposUsuario();

                if (inputImagem) inputImagem.value = "";

                if (uploadBox) {
                    uploadBox.innerHTML = `
                        <i class="fa-solid fa-cloud-arrow-up"></i>
                        <span>Arraste uma foto ou clique para selecionar</span>
                    `;
                }

                if (imgPreview) {
                    imgPreview.src = "";
                    imgPreview.style.display = "none";
                }

                if (previewEmpty) {
                    previewEmpty.style.display = "flex";
                }

            } catch (erro) {
                console.error("Erro ao cadastrar usuário:", erro);
                mostrarAlerta("Erro de comunicação com o servidor.", "erro");
            } finally {
                btnSalvarUsuario.disabled = false;
            }
        });
    }

    if (typeof inicializarBuscaCEPGlobal === "function") {
        inicializarBuscaCEPGlobal();
    }

    function marcarErroUsuario(input) {
        if (!input) return;
        input.classList.add("input-erro");
        input.focus();
        input.addEventListener("pointerdown", () => {
            input.classList.remove("input-erro");
        }, { once: true });
    }

    function sairModoEdicaoUsuario(silencioso = false) {
    usuarioEmEdicao = null;
    dadosOriginais = {};
    imagemOriginal = "";

    // Remove o parâmetro ?id= da URL sem recarregar a tela
    window.history.replaceState({}, document.title, window.location.pathname);

    if (document.body) {
        document.body.removeAttribute("data-usuario-editando");
    }

    if (btnEditar) {
        delete btnEditar.dataset.usuarioId;
    }

    limparCamposUsuario();
    alternarVisibilidadeSenha(false);

    if (btnSairEdicao) {
        btnSairEdicao.disabled = true;
    }

    if (btnAtualizar) {
        btnAtualizar.disabled = true;
    }

    if (inputImagem) {
        inputImagem.value = "";
    }

    if (imgPreview) {
        imgPreview.src = "";
        imgPreview.style.display = "none";
    }

    if (previewEmpty) {
        previewEmpty.style.display = "flex";
    }

    // Só exibe o alerta se NÃO for chamado após uma atualização com sucesso
    if (!silencioso) {
        mostrarAlerta(
            "Modo edição encerrado. Você pode cadastrar um novo usuário.",
            "sucesso"
        );
    }
}

    if (campoUsername) {
        campoUsername.addEventListener("input", function () {
            this.value = this.value.replace(/\s+/g, "");

            if (this.value.length > LIMITE_CARACTERES_USERNAME) {
                this.value = this.value.substring(0, LIMITE_CARACTERES_USERNAME);
            }
        });

        campoUsername.addEventListener("blur", async function () {
            const username = this.value.trim();

            if (!username) return;

            const usuarioId = usuarioEmEdicao || document.body.dataset.usuarioEditando;

            try {
                const resposta = await fetch(
                    `/usuarios/verificar-username/?username=${encodeURIComponent(username)}&usuario_id=${usuarioId || ""}`
                );
                const dados = await resposta.json();

                if (dados.existe) {
                    mostrarAlerta(
                        `O nome de usuário "${username}" já está em uso. Escolha outro.`,
                        "erro"
                    );

                    if (typeof marcarErroUsuario === "function") {
                        marcarErroUsuario(campoUsername);
                    } else {
                        campoUsername.classList.add("input-erro");
                    }
                }
            } catch (erro) {
                console.error("Erro ao verificar disponibilidade do nome de usuário:", erro);
            }
        });
    }

    if (btnAtualizarTabela && tabela) {
        btnAtualizarTabela.addEventListener("click", async function () {
            try {
                const resposta = await fetch("/usuarios/atualizar-tabela/", {
                    method: "GET",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest"
                    }
                });

                if (!resposta.ok) {
                    throw new Error("Erro ao atualizar a tabela.");
                }

                const textoResposta = await resposta.text();
                let dados;
                try {
                    dados = JSON.parse(textoResposta);
                } catch (e) {
                    console.error("Resposta não foi JSON válido:", textoResposta);
                    mostrarAlerta("Erro ao carregar dados da tabela do servidor.", "erro");
                    return;
                }

                if (!dados.sucesso) {
                    throw new Error(dados.mensagem || "Não foi possível atualizar a tabela.");
                }

                tabela.innerHTML = dados.html;
                registrarEventosLinhas();

                mostrarAlerta("Tabela de usuários atualizada com sucesso.", "sucesso");

            } catch (erro) {
                console.error("Erro ao atualizar tabela de usuários:", erro);
                mostrarAlerta("Não foi possível atualizar a tabela de usuários.", "erro");
            }
        });
    }

    /* =========================================
       APAGAR USUÁRIO (LÓGICA CUSTOM BACKDROP)
    ========================================= */
    const btnApagarUsuarioModal = document.getElementById("btnApagarUsuarioModal");
    let usuarioParaApagar = null;

    if (btnApagarUsuarioModal) {
        btnApagarUsuarioModal.addEventListener("click", function () {
            const checkboxSelecionado = document.querySelector(
                "#tabelaModalUsuarios input[name='usuario_selecionado']:checked"
            );

            if (!checkboxSelecionado) {
                mostrarAlerta("Selecione um usuário para apagar.", "erro");
                return;
            }

            usuarioParaApagar = checkboxSelecionado.closest("tr");
            const modalElemento = document.getElementById("modalApagarUsuario");

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

    if (btnConfirmarApagar) {
        btnConfirmarApagar.addEventListener("click", function () {
            if (!usuarioParaApagar) return;

            const id = usuarioParaApagar.dataset.usuarioId ||
                usuarioParaApagar.querySelector("input[type='checkbox']").value;

            const csrfInput = document.querySelector("[name=csrfmiddlewaretoken]");

            fetch(`/usuarios/apagar/${id}/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfInput ? csrfInput.value : "",
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.sucesso || data.status === "ok") {
                    usuarioParaApagar.remove();
                    usuarioParaApagar = null;

                    const modalElemento = document.getElementById("modalApagarUsuario");
                    if (modalElemento) {
                        const modal = bootstrap.Modal.getInstance(modalElemento);
                        if (modal) modal.hide();
                    }

                    document.querySelector(".backdrop-confirmacao")?.remove();
                    mostrarAlerta("Usuário apagado com sucesso.", "sucesso");
                } else {
                    mostrarAlerta(data.mensagem || "Erro ao apagar usuário.", "erro");
                }
            })
            .catch(error => {
                console.error(error);
                mostrarAlerta("Erro ao apagar usuário.", "erro");
            });
        });
    }

    const modalApagarUsuarioElemento = document.getElementById("modalApagarUsuario");
    if (modalApagarUsuarioElemento) {
        modalApagarUsuarioElemento.addEventListener("hidden.bs.modal", function () {
            document.querySelector(".backdrop-confirmacao")?.remove();
        });
    }

    /* =========================================
       ALTERNAR VISIBILIDADE DA SENHA (OLHO)
    ========================================= */
    function alternarVisualizacaoSenha(input, btn) {
        if (!input || !btn) return;

        const icone = btn.querySelector("i");

        if (input.type === "password") {
            input.type = "text";
            if (icone) {
                icone.classList.remove("fa-eye");
                icone.classList.add("fa-eye-slash");
            }
        } else {
            input.type = "password";
            if (icone) {
                icone.classList.remove("fa-eye-slash");
                icone.classList.add("fa-eye");
            }
        }
    }

    function inicializarEventosTabelaUsuarios() {
        document
            .querySelectorAll("#modalFiltrarUsuarios tbody tr")
            .forEach(linha => {
                linha.addEventListener("click", function () {
                    const radio = this.querySelector('input[type="radio"]');
                    if (!radio) return;

                    document
                        .querySelectorAll("#modalFiltrarUsuarios tbody tr")
                        .forEach(tr => {
                            tr.classList.remove("usuario-selecionado");
                        });

                    radio.checked = true;
                    this.classList.add("usuario-selecionado");
                    radio.dispatchEvent(new Event("change"));
                });
            });
    }

    const btnAbrirFiltroUsuarios = document.getElementById("btnAbrirFiltroUsuariosModal");

    if (btnAbrirFiltroUsuarios) {
        btnAbrirFiltroUsuarios.addEventListener("click", () => {
            const modalElemento = document.getElementById("modalFiltrarUsuarios");
            if (!modalElemento) return;

            bootstrap.Modal
                .getOrCreateInstance(modalElemento, { backdrop: false })
                .show();

            inicializarEventosTabelaUsuarios();
        });
    }

    const btnExecutarFiltroUsuarios = document.getElementById("btnExecutarFiltro");

    if (btnExecutarFiltroUsuarios) {
        btnExecutarFiltroUsuarios.addEventListener("click", function (event) {
            event.preventDefault();
            filtrarUsuarios();
        });
    }

    const tipoFiltro = document.getElementById("tipoFiltro");
    const labelValorFiltro = document.getElementById("labelValorFiltro");
    const valorFiltro = document.getElementById("valorFiltro");

    if (tipoFiltro) {
        tipoFiltro.addEventListener("change", () => {
            switch (tipoFiltro.value) {
                case "nome":
                    labelValorFiltro.textContent = "Nome do Usuário";
                    valorFiltro.type = "text";
                    valorFiltro.placeholder = "Digite o nome do usuário";
                    break;
                case "usuario":
                    labelValorFiltro.textContent = "Usuário";
                    valorFiltro.type = "text";
                    valorFiltro.placeholder = "Digite o usuário";
                    break;
                case "acesso":
                    labelValorFiltro.textContent = "Acesso";
                    valorFiltro.type = "text";
                    valorFiltro.placeholder = "Digite o tipo de acesso";
                    break;
                case "telefone":
                    labelValorFiltro.textContent = "Telefone";
                    valorFiltro.type = "text";
                    valorFiltro.placeholder = "Digite o telefone";
                    break;
                case "email":
                    labelValorFiltro.textContent = "E-mail";
                    valorFiltro.type = "text";
                    valorFiltro.placeholder = "Digite o e-mail";
                    break;
                case "rg":
                    labelValorFiltro.textContent = "RG";
                    valorFiltro.type = "text";
                    valorFiltro.placeholder = "Digite o RG";
                    break;
                case "cpf":
                    labelValorFiltro.textContent = "CPF";
                    valorFiltro.type = "text";
                    valorFiltro.placeholder = "Digite o CPF";
                    break;
                case "cnpj":
                    labelValorFiltro.textContent = "CNPJ";
                    valorFiltro.type = "text";
                    valorFiltro.placeholder = "Digite o CNPJ";
                    break;
            }
            valorFiltro.value = "";
        });
    }

    async function filtrarUsuarios() {
        const tipo = document.getElementById("tipoFiltro")?.value;
        const valor = document.getElementById("valorFiltro")?.value.trim();

        if (!tipo) {
            mostrarAlerta("Selecione um tipo de filtro.", "erro");
            return;
        }

        if (!valor) {
            mostrarAlerta("Digite um valor para realizar o filtro.", "erro");
            return;
        }

        try {
            const resposta = await fetch(
                `/usuarios/atualizar-tabela/?tipo=${encodeURIComponent(tipo)}&valor=${encodeURIComponent(valor)}`,
                {
                    method: "GET",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest"
                    }
                }
            );

            if (!resposta.ok) {
                throw new Error("Erro ao realizar filtro.");
            }

            const resultado = await resposta.json();

            if (!resultado.sucesso) {
                throw new Error(resultado.mensagem || "Não foi possível realizar o filtro.");
            }

            const tabela = document.getElementById("tabelaModalUsuarios");

            if (!tabela) {
                throw new Error("Tabela de usuários não encontrada.");
            }

            tabela.innerHTML = resultado.html;

            inicializarEventosTabelaUsuarios();
            registrarEventosLinhas();

            const modalFiltro = document.getElementById("modalFiltrarUsuarios");

            if (modalFiltro) {
                const instancia = bootstrap.Modal.getInstance(modalFiltro);
                if (instancia) {
                    instancia.hide();
                }
            }

            mostrarAlerta("Filtro aplicado com sucesso.", "sucesso");

        } catch (erro) {
            console.error("Erro ao filtrar usuários:", erro);
            mostrarAlerta("Não foi possível realizar o filtro.", "erro");
        }
    }

    const btnToggleSenha = document.getElementById("btnToggleSenha");
    if (btnToggleSenha && campoSenha) {
        btnToggleSenha.addEventListener("click", function () {
            alternarVisualizacaoSenha(campoSenha, this);
        });
    }

    const btnToggleSenhaConfirmacao = document.getElementById("btnToggleSenhaConfirmacao");
    if (btnToggleSenhaConfirmacao && campoSenhaConfirmacao) {
        btnToggleSenhaConfirmacao.addEventListener("click", function () {
            alternarVisualizacaoSenha(campoSenhaConfirmacao, this);
        });
    }

    function desmarcarTodasLinhasUsuarios() {
        if (!tabelaUsuarios) return;

        tabelaUsuarios.querySelectorAll('input[name="usuario_selecionado"]').forEach(function (checkbox) {
            checkbox.checked = false;
            const linha = checkbox.closest("tr");
            if (linha) {
                linha.classList.remove("usuario-selecionado");
            }
        });
    }

    document.addEventListener("click", function (event) {
        if (!tabelaUsuarios) return;

        const clicouNaLinha = event.target.closest("#tabelaModalUsuarios tr");
        const clicouNasAcoesTabela = event.target.closest(".acoes-tabela-usuarios");

        if (!clicouNaLinha && !clicouNasAcoesTabela) {
            desmarcarTodasLinhasUsuarios();
        }
    });

    if (modalElement) {
        modalElement.addEventListener("hidden.bs.modal", function () {
            desmarcarTodasLinhasUsuarios();
        });
    }

    const btnAbrirOrdenacaoUsuarios = document.getElementById("btnAbrirOrdenacaoUsuariosModal");
    if (btnAbrirOrdenacaoUsuarios) {
        btnAbrirOrdenacaoUsuarios.addEventListener("click", () => {
            bootstrap.Modal.getOrCreateInstance(document.getElementById("modalOrdenarUsuarios")).show();
        });
    }

    const btnExecutarOrdenacao = document.getElementById("btnExecutarOrdenacao");
    if (btnExecutarOrdenacao) {
        btnExecutarOrdenacao.addEventListener("click", ordenarUsuarios);
    }

    async function ordenarUsuarios() {
        const direcao = document.getElementById("tipoOrdenacaoUsuario").value;

        const resposta = await fetch(`/usuarios/atualizar-tabela/?ordem=${direcao}`);
        const dados = await resposta.json();

        if (dados.sucesso) {
            document.getElementById("tabelaModalUsuarios").innerHTML = dados.html;

            if (typeof inicializarEventosTabelaUsuarios === "function") {
                inicializarEventosTabelaUsuarios();
            }
            registrarEventosLinhas();

            bootstrap.Modal.getInstance(document.getElementById("modalOrdenarUsuarios")).hide();
        } else {
            console.error("Erro ao atualizar a tabela:", dados.mensagem);
        }
    }

    const btnVisualizarImagemUsuario = document.getElementById("btnVisualizarFotoModal");

    if (btnVisualizarImagemUsuario) {
        btnVisualizarImagemUsuario.addEventListener("click", function () {
            const selecionados = document.querySelectorAll(
                "#modalTabelaUsuarios input[type='checkbox']:checked, #modalTabelaUsuarios input[type='radio']:checked"
            );

            if (selecionados.length === 0) {
                mostrarAlerta("Selecione um usuário para visualizar a imagem.", "erro");
                return;
            }

            if (selecionados.length > 1) {
                mostrarAlerta("Selecione apenas 1 usuário por vez para visualizar a imagem.", "erro");
                return;
            }

            const inputSelecionado = selecionados[0];
            const linha = inputSelecionado.closest("tr");
            const imagem = linha ? linha.dataset.imagem : null;

            const img = document.getElementById("imagemUsuarioModal");
            const msg = document.getElementById("mensagemSemImagemUsuario");

            if (imagem && imagem.trim() !== "" && imagem !== "null" && imagem !== "undefined") {
                img.src = imagem;
                img.style.display = "block";
                msg.style.display = "none";
            } else {
                img.src = "";
                img.style.display = "none";
                msg.style.display = "block";
            }

            bootstrap.Modal
                .getOrCreateInstance(document.getElementById("modalVisualizarImagemUsuario"))
                .show();
        });
    }

    const btnGerarExcelUsuario = document.getElementById("btnGerarExcelTabelaModal");
    if (btnGerarExcelUsuario) {
        btnGerarExcelUsuario.addEventListener("click", exportarTabelaParaExcelUsuario);
    }

    function exportarTabelaParaExcelUsuario() {
        const modalTabela = document.getElementById("modalTabelaUsuarios");
        const tabela = modalTabela ? modalTabela.querySelector("table") : null;

        if (!tabela) {
            mostrarAlerta("Tabela de usuários não encontrada.", "erro");
            return;
        }

        const linhas = tabela.querySelectorAll("tbody tr");

        if (linhas.length === 0 || tabela.querySelector(".linha-vazia")) {
            mostrarAlerta("Não há usuário na tabela para exportar.", "erro");
            return;
        }

        const cabecalhos = Array.from(tabela.querySelectorAll("thead th")).map(th => th.innerText.trim().toLowerCase());

        function getIndex(nomeColuna) {
            return cabecalhos.findIndex(c => c.includes(nomeColuna.toLowerCase()));
        }

        const idx = {
            id: getIndex("id"),
            nome: getIndex("nome"),
            usuario: getIndex("usuário"),
            cep: getIndex("cep"),
            endereco: getIndex("endereço"),
            numero: getIndex("número"),
            cidade: getIndex("cidade"),
            bairro: getIndex("bairro"),
            estado: getIndex("estado"),
            complemento: getIndex("complemento"),
            telefone: getIndex("telefone"),
            email: getIndex("e-mail"),
            dataNascimento: getIndex("data de nascimento"),
            rg: getIndex("rg"),
            cpf: getIndex("cpf"),
            cnpj: getIndex("cnpj"),
            usuarioLogado: getIndex("usuário logado"),
            acesso: getIndex("acesso")
        };

        const dadosExcel = [
            [
                "ID",
                "Nome Completo",
                "Usuário",
                "CEP",
                "Endereço",
                "Número",
                "Cidade",
                "Bairro",
                "Estado",
                "Complemento",
                "Telefone / WhatsApp",
                "E-mail",
                "Data de Nascimento",
                "RG",
                "CPF",
                "CNPJ",
                "Usuário Logado",
                "Acesso"
            ]
        ];

        function obterTexto(colunas, i) {
            return (i !== -1 && colunas[i]) ? colunas[i].innerText.trim() : "";
        }

        linhas.forEach(linha => {
            const colunas = linha.querySelectorAll("td");
            if (colunas.length > 1) {
                dadosExcel.push([
                    obterTexto(colunas, idx.id),
                    obterTexto(colunas, idx.nome),
                    obterTexto(colunas, idx.usuario),
                    obterTexto(colunas, idx.cep),
                    obterTexto(colunas, idx.endereco),
                    obterTexto(colunas, idx.numero),
                    obterTexto(colunas, idx.cidade),
                    obterTexto(colunas, idx.bairro),
                    obterTexto(colunas, idx.estado),
                    obterTexto(colunas, idx.complemento),
                    obterTexto(colunas, idx.telefone),
                    obterTexto(colunas, idx.email),
                    obterTexto(colunas, idx.dataNascimento),
                    obterTexto(colunas, idx.rg),
                    obterTexto(colunas, idx.cpf),
                    obterTexto(colunas, idx.cnpj),
                    obterTexto(colunas, idx.usuarioLogado),
                    obterTexto(colunas, idx.acesso)
                ]);
            }
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(dadosExcel);

        ws['!cols'] = [
            { wch: 8 },
            { wch: 25 },
            { wch: 15 },
            { wch: 12 },
            { wch: 25 },
            { wch: 10 },
            { wch: 18 },
            { wch: 18 },
            { wch: 8 },
            { wch: 20 },
            { wch: 20 },
            { wch: 30 },
            { wch: 18 },
            { wch: 15 },
            { wch: 18 },
            { wch: 20 },
            { wch: 20 },
            { wch: 18 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Usuários");

        const dataAtual = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `usuarios_${dataAtual}.xlsx`);

        mostrarAlerta("Relatório em Excel gerado com sucesso!", "sucesso");
    }

    /* =======================================================
       FUNÇÃO DEFINITIVA PARA CARREGAR DADOS DO USUÁRIO
    ======================================================= */
    async function carregarDadosUsuarioParaEdicao(id) {
        try {
            const resposta = await fetch(`/usuarios/${id}/`);
            const dados = await resposta.json();

            if (!dados.sucesso || !dados.usuario) {
                mostrarAlerta(dados.mensagem || "Não foi possível carregar os dados do usuário.", "erro");
                return;
            }

            const u = dados.usuario;

            // 1. Seta a variável global com o ID e marca o body/botão
            usuarioEmEdicao = u.id;
            if (btnEditar) btnEditar.dataset.usuarioId = u.id;
            if (document.body) document.body.dataset.usuarioEditando = u.id;

            // 2. Preenche os campos do formulário
            if (campoNome) campoNome.value = u.nome || "";
            if (campoUsername) campoUsername.value = u.username || "";
            if (campoCep) campoCep.value = u.cep || "";
            if (campoEndereco) campoEndereco.value = u.endereco || "";
            if (campoNumero) campoNumero.value = u.numero || "";
            if (campoBairro) campoBairro.value = u.bairro || "";
            if (campoCidade) campoCidade.value = u.cidade || "";
            if (campoEstado) campoEstado.value = u.estado || "";
            if (campoComplemento) campoComplemento.value = u.complemento || "";
            if (campoTelefone) campoTelefone.value = u.telefone || "";
            if (campoEmail) campoEmail.value = u.email || "";
            if (campoNascimento) campoNascimento.value = u.data_nascimento || "";
            if (campoRg) campoRg.value = u.rg || "";
            if (campoCpf) campoCpf.value = u.cpf || "";
            if (campoCnpj) campoCnpj.value = u.cnpj || "";
            if (campoPerfil) campoPerfil.value = u.acesso || u.perfil || "";

            // 3. Trata foto do usuário
            const fotoUrl = u.foto_url || u.imagem || "";
            imagemOriginal = fotoUrl;

            if (inputImagem) inputImagem.value = "";

            if (imgPreview) {
                if (fotoUrl) {
                    imgPreview.src = fotoUrl;
                    imgPreview.style.display = "block";
                    if (previewEmpty) previewEmpty.style.display = "none";
                } else {
                    imgPreview.src = "";
                    imgPreview.style.display = "none";
                    if (previewEmpty) previewEmpty.style.display = "flex";
                }
            }

            // 4. Salva o snapshot dos dados originais
            dadosOriginais = {
                nome: (u.nome || "").trim(),
                username: (u.username || "").trim(),
                cep: (u.cep || "").trim(),
                endereco: (u.endereco || "").trim(),
                numero: (u.numero || "").trim(),
                bairro: (u.bairro || "").trim(),
                cidade: (u.cidade || "").trim(),
                estado: (u.estado || "").trim(),
                complemento: (u.complemento || "").trim(),
                telefone: (u.telefone || "").trim(),
                email: (u.email || "").trim(),
                data_nascimento: (u.data_nascimento || "").trim(),
                rg: (u.rg || "").trim(),
                cpf: (u.cpf || "").trim(),
                cnpj: (u.cnpj || "").trim(),
                acesso: (u.acesso || u.perfil || "").trim()
            };

            // 5. Oculta os campos de senha e exibe o aviso
            alternarVisibilidadeSenha(true);

            // 6. Habilita os botões de ação do modo edição
            if (btnAtualizar) btnAtualizar.disabled = false;
            if (btnSairEdicao) btnSairEdicao.disabled = false;

        } catch (erro) {
            console.error("Erro ao carregar dados do usuário:", erro);
            mostrarAlerta("Erro de comunicação ao carregar dados do usuário.", "erro");
        }
    }
});
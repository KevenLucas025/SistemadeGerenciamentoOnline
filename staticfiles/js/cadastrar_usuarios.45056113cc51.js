document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       ELEMENTOS E INSTÂNCIA DO BOOTSTRAP
    ========================================= */
    const LIMITE_CARACTERES_USERNAME = 11;

    const modalElement = document.getElementById("modalTabelaUsuarios");

    const btnEditar = document.getElementById("btnEditarUsuario");
    const btnFecharModal = document.getElementById("fecharModalUsuarios");
    const btnLimparCampos = document.getElementById("btnApagarUsuario")
    const btnAtualizar = document.getElementById("btnAtualizarUsuario");
    const btnAtualizarUsuarioModal = document.getElementById("btnAtualizarUsuarioModal")
    const tabelaUsuarios = document.getElementById("tabelaModalUsuarios");
    const btnAtualizarTabela = document.getElementById("btnAtualizarTabelaModal");
    const tabela = document.getElementById("tabelaModalUsuarios");
    const btnApagarModal = document.getElementById("btnApagarUsuarioModal");
    const modalApagarElement = document.getElementById("modalApagarUsuario");
    const btnConfirmarApagar = document.getElementById("btnConfirmarApagarUsuario");
    

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
    const campoCep = document.getElementById("usuarioCep");
    const campoEndereco = document.getElementById("usuarioEndereco");
    const campoNumero = document.getElementById("usuarioNumero");
    const campoBairro = document.getElementById("usuarioBairro");
    const campoCidade = document.getElementById("usuarioCidade");
    const campoEstado = document.getElementById("usuarioEstado");
    const btnUploadCarregar = document.getElementById("btnUploadCarregarCadastrarUsuarios");
    const btnUploadRemover = document.getElementById("btnUploadRemoverCadastrarUsuarios");
    const inputImagem = document.getElementById("inputImagemCadastrarUsuarios");
    const uploadBox = document.getElementById("uploadBoxCadastrarUsuarios");
    const imgPreview =document.getElementById("img-preview");
    const previewEmpty =document.querySelector(".preview-empty-cadastrar-usuarios");

    

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

            // Verifica se existe algum dado preenchido
            const existeDados = campos.some(function (campo) {
                return campo && campo.value.trim() !== "";
            });

            // Verifica também se existe uma imagem selecionada
            const existeImagem =
                inputImagem &&
                inputImagem.files &&
                inputImagem.files.length > 0;

            // Se não houver dados nem imagem
            if (!existeDados && !existeImagem) {

                mostrarAlerta("Não há dados para limpar.","erro");

                return;
            }

            // Limpa os campos
            limparCamposUsuario();

            // Limpa a imagem
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

            // Confirma a limpeza
            mostrarAlerta(
                "Os dados foram limpos com sucesso.",
                "sucesso"
            );

        });

        document.querySelectorAll(".input-erro").forEach(function (campo)
        {campo.classList.remove(".input-erro")});

        }

            /* =========================================
            UPLOAD DA FOTO DO USUÁRIO
        ========================================= */

        if (btnUploadCarregar && inputImagem) {

            btnUploadCarregar.addEventListener(
                "click",
                function () {

                    inputImagem.click();

                }
            );

        }


        /* =========================================
            CLICAR NA ÁREA DE UPLOAD
        ========================================= */

        if (uploadBox && inputImagem) {

            uploadBox.addEventListener(
                "click",
                function () {

                    inputImagem.click();

                }
            );

        }


        /* =========================================
            PRÉ-VISUALIZAÇÃO DA IMAGEM
        ========================================= */

        if (inputImagem && imgPreview) {

            inputImagem.addEventListener(
                "change",
                function () {

                    const arquivo = this.files[0];

                    if (!arquivo) {
                        return;
                    }


                    /* ---------------------------------
                        VALIDAÇÃO
                    --------------------------------- */

                    if (!arquivo.type.startsWith("image/")) {

                        mostrarAlerta(
                            "Selecione um arquivo de imagem válido."
                        );

                        this.value = "";

                        return;
                    }


                    /* ---------------------------------
                        CRIA PRÉ-VISUALIZAÇÃO
                    --------------------------------- */

                    const leitor = new FileReader();


                    leitor.onload = function (evento) {

                        imgPreview.src =
                            evento.target.result;

                        imgPreview.style.display =
                            "block";


                        if (previewEmpty) {

                            previewEmpty.style.display =
                                "none";

                        }

                    };


                    leitor.readAsDataURL(arquivo);

                }
            );

        }


        /* =========================================
            REMOVER FOTO
        ========================================= */

        if (btnUploadRemover) {

            btnUploadRemover.addEventListener(
                "click",
                function () {

                    if (inputImagem) {

                        inputImagem.value = "";

                    }


                    if (imgPreview) {

                        imgPreview.src = "";

                        imgPreview.style.display =
                            "none";

                    }


                    if (previewEmpty) {

                        previewEmpty.style.display =
                            "flex";

                    }

                }
            );

        }

    const campoComplemento =
        document.getElementById("usuarioComplemento");

    const campoTelefone =
        document.getElementById("usuarioTelefone");

    const campoEmail =
        document.getElementById("usuarioEmail");

    const campoNascimento =
        document.getElementById("usuarioNascimento");

    const campoRg =
        document.getElementById("usuarioRg");

    const campoCpf =
        document.getElementById("usuarioCpf");

    const campoCnpj =
        document.getElementById("usuarioCnpj");

    const campoPerfil =
        document.getElementById("usuarioPerfil");

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
        const modalInstance =
            bootstrap.Modal.getOrCreateInstance(modalElement);

        modalInstance.show();
    }


    function fecharModalUsuarios() {
        if (modalUsuarios) {
            modalUsuarios.hide();
        }
    }


    /* =========================================
       EVENTOS DOS BOTÕES
    ========================================= */
    if (btnEditar) {
        btnEditar.addEventListener(
            "click",
            abrirModalUsuarios
        );
    }


    if (btnFecharModal) {
        btnFecharModal.addEventListener(
            "click",
            fecharModalUsuarios
        );
    }


    /* =========================================
       BUSCA NA TABELA
    ========================================= */
    const busca = document.getElementById("buscaModalUsuarios");

    if (busca) {

        busca.addEventListener("input", function () {

            const termo =
                this.value.toLowerCase().trim();

            const linhas =
                document.querySelectorAll(
                    "#tabelaModalUsuarios tr[data-usuario], #tabelaModalUsuarios tr[data-usuario-id]"
                );

            linhas.forEach(function (linha) {

                const texto =
                    linha.textContent.toLowerCase();

                linha.style.display =
                    texto.includes(termo)
                        ? ""
                        : "none";

            });

        });

    }
    const btnSairEdicao =
        document.getElementById("btnSairEdicao");

    if (btnSairEdicao) {

        btnSairEdicao.addEventListener(
            "click",
            function () {

                if (!usuarioEmEdicao) {

                    mostrarAlerta(
                        "Você não está no modo edição.","erro"
                    );

                    return;
                }

                sairModoEdicaoUsuario();

            }
        );

    }
    
    if (btnAtualizar) {

        btnAtualizar.addEventListener("click", function () {

            if (!usuarioEmEdicao) {

                mostrarAlerta(
                    "Nenhum usuário selecionado para atualização. Primeiro recupere um usuário através do botão Editar.",
                    "erro"
                );

                return;
            }

        });

    }

    /* =========================================
       SELEÇÃO DAS LINHAS
    ========================================= */

    function obterLinhasUsuarios() {

        return document.querySelectorAll(
            "#tabelaModalUsuarios tr"
        );

    }


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


            const checkbox =
                linha.querySelector(
                    'input[name="usuario_selecionado"]'
                );

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


    /* =========================================
    1. CARREGAR DADOS DO MODAL PARA O FORMULÁRIO
    ========================================= */
    if (btnAtualizarUsuarioModal) {

        btnAtualizarUsuarioModal.addEventListener("click", function () {

            if (!tabelaUsuarios) return;

            const selecionados = tabelaUsuarios.querySelectorAll(
                'input[name="usuario_selecionado"]:checked'
            );

            /* ---------------------------------
            VALIDAÇÕES DE SELEÇÃO
            --------------------------------- */
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

            /* ---------------------------------
            FUNÇÕES AUXILIARES DE LEITURA
            --------------------------------- */
            const celulas = linha.querySelectorAll("td");

            function obterTextoCelula(indice) {
                if (!celulas[indice]) return "";
                let valor = celulas[indice].textContent.trim();
                if (valor === "—" || valor === "Não informado" || valor === "Nunca alterada") {
                    return "";
                }
                return valor;
            }

            function obterValor(campo, indiceCelula) {
                const atributo = linha.getAttribute("data-" + campo);
                if (atributo !== null && atributo.trim() !== "") {
                    return atributo.trim();
                }
                return obterTextoCelula(indiceCelula);
            }

            /* ---------------------------------
            GUARDA ID DO USUÁRIO
            --------------------------------- */
            const idUsuario = checkbox.value ||
                linha.getAttribute("data-usuario-id") ||
                linha.getAttribute("data-usuario");

            usuarioEmEdicao = idUsuario;

            if (btnEditar) btnEditar.dataset.usuarioId = idUsuario;
            if (document.body) document.body.dataset.usuarioEditando = idUsuario;

            /* ---------------------------------
            RECUPERAÇÃO DOS DADOS
            --------------------------------- */
            const nome = obterValor("nome", 2);
            const username = obterValor("username", 3);
            const senha = obterValor("senha", 4);
            const cep = obterValor("cep", 6);
            const endereco = obterValor("endereco", 7);
            const numero = obterValor("numero", 8);
            const cidade = obterValor("cidade", 9);
            const bairro = obterValor("bairro", 10);
            const estado = obterValor("estado", 11);
            const complemento = obterValor("complemento", 12);
            const telefone = obterValor("telefone", 13);
            const email = obterValor("email", 14);
            const rawNascimento = linha.getAttribute("data-nascimento") || obterTextoCelula(15);
            const rg = obterValor("rg", 16);
            const cpf = obterValor("cpf", 17);
            const cnpj = obterValor("cnpj", 18);
            const acesso = obterValor("acesso", 24);

            /* ---------------------------------
            PREENCHIMENTO DO FORMULÁRIO
            --------------------------------- */
            if (campoNome) campoNome.value = nome;
            if (campoUsername) campoUsername.value = username;

            if (campoSenha) {
                campoSenha.type = "text";
                campoSenha.value = senha;
            }
            if (campoSenhaConfirmacao) {
                campoSenhaConfirmacao.type = "text";
                campoSenhaConfirmacao.value = senha;
            }

            if (campoCep) campoCep.value = cep;
            if (campoEndereco) campoEndereco.value = endereco;
            if (campoNumero) campoNumero.value = numero;
            if (campoBairro) campoBairro.value = bairro;
            if (campoCidade) campoCidade.value = cidade;
            if (campoEstado) campoEstado.value = estado;
            if (campoComplemento) campoComplemento.value = complemento;
            if (campoTelefone) campoTelefone.value = telefone;
            if (campoEmail) campoEmail.value = email;
            if (campoRg) campoRg.value = rg;
            if (campoCpf) campoCpf.value = cpf;
            if (campoCnpj) campoCnpj.value = cnpj;

            /* DATA DE NASCIMENTO */
            if (campoNascimento) {
                let dataNascimento = "";
                if (rawNascimento) {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(rawNascimento)) {
                        dataNascimento = rawNascimento;
                    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawNascimento)) {
                        const partes = rawNascimento.split("/");
                        dataNascimento = `${partes[2]}-${partes[1]}-${partes[0]}`;
                    } else {
                        const data = rawNascimento.split(" ")[0];
                        if (/^\d{4}-\d{2}-\d{2}$/.test(data)) dataNascimento = data;
                    }
                }
                campoNascimento.value = dataNascimento;
            }


            /* PERFIL DE ACESSO */
            if (campoPerfil) {
                const acessoNormalizado = acesso.toLowerCase().trim();

                if (
                    acessoNormalizado.includes("admin") ||
                    acessoNormalizado.includes("administrador")
                ) {
                    campoPerfil.value = "Administrador";
                } else if (
                    acessoNormalizado.includes("usuário comum") ||
                    acessoNormalizado.includes("usuario comum") ||
                    acessoNormalizado.includes("gerente")
                ) {
                    campoPerfil.value = "Usuário Comum";
                } else if (
                    acessoNormalizado.includes("convidado") 
                ) {
                    campoPerfil.value = "Convidado";
                } else {
                    campoPerfil.value = "";
                }
            }

            /* FOTO DO USUÁRIO */
            const urlImagem = linha.getAttribute("data-imagem") || "";
            imagemOriginal = urlImagem;

            if (inputImagem) inputImagem.value = "";

            if (imgPreview) {
                if (urlImagem) {
                    imgPreview.src = urlImagem;
                    imgPreview.style.display = "block";
                    if (previewEmpty) previewEmpty.style.display = "none";
                } else {
                    imgPreview.src = "";
                    imgPreview.style.display = "none";
                    if (previewEmpty) previewEmpty.style.display = "flex";
                }
            }

            /* ATIVA BOTÕES DE EDIÇÃO */
            if (btnAtualizar) btnAtualizar.disabled = false;
            const btnSairEdicao = document.getElementById("btnSairEdicao");
            if (btnSairEdicao) btnSairEdicao.disabled = false;

            /* DESMARCA O CHECKBOX E LIMPA SELEÇÃO VISUAL */
            checkbox.checked = false;
            linha.classList.remove("usuario-selecionado");

            /* FECHA O MODAL */
            fecharModalUsuarios();

            console.log("Usuário carregado para edição:", { id: idUsuario, nome, username });
        });
    }

    /* =========================================
    2. REQUISIÇÃO DE ATUALIZAÇÃO NO BANCO (MANTIDA NO ESCOPO SEPARADO)
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

            const dados = new FormData();
            dados.append("nome", campoNome?.value.trim() || "");
            dados.append("username", campoUsername?.value.trim() || "");
            dados.append("senha", campoSenha?.value.trim() || "");
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

                const resultado = await resposta.json();

                if (!resposta.ok || !resultado.sucesso) {
                    mostrarAlerta(resultado.mensagem || "Não foi possível atualizar o usuário.", "erro");
                    return;
                }

                mostrarAlerta("Usuário atualizado com sucesso", "sucesso");
                sairModoEdicaoUsuario();

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
    if (campoSenha) campoSenha.value = "";
    if (campoSenhaConfirmacao) campoSenhaConfirmacao.value = "";

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

    if (inputImagem){
        inputImagem.value = "";
    }

    if (imgPreview){
        imgPreview.src = "";
        imgPreview.style.display = "none";
    }

    if (previewEmpty){
        previewEmpty.style.display = "flex";
    }

    // Reseta o texto/ícone da caixa de upload se necessário
    if (uploadBox) {
        uploadBox.innerHTML = `
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <span>Arraste uma foto ou clique para selecionar</span>
        `;
    }
}

/* =========================================
   CADASTRAR USUÁRIO
========================================= */


const btnSalvarUsuario =
    document.getElementById("btnSalvarUsuario");


if (btnSalvarUsuario) {

    btnSalvarUsuario.addEventListener(
        "click",
        async function () {

        if (usuarioEmEdicao) {

            mostrarAlerta(
                "Você está editando um usuário. Utilize o botão 'Atualizar' para salvar as alterações.",
                "erro"
            );

            return;
        }


            /* =================================
               CAMPOS OBRIGATÓRIOS
            ================================= */

            const camposObrigatorios = [

                {
                    campo: campoNome,
                    nome: "Nome"
                },

                {
                    campo: campoUsername,
                    nome: "Usuário"
                },

                {
                    campo: campoSenha,
                    nome: "Senha"
                },

                {
                    campo: campoSenhaConfirmacao,
                    nome: "Confirmação de senha"
                },

                {
                    campo: campoEmail,
                    nome: "E-mail"
                },

                {
                    campo: campoPerfil,
                    nome: "Perfil de acesso"
                }

            ];


            /* =================================
               REMOVE ERROS ANTERIORES
            ================================= */

            camposObrigatorios.forEach(function (item) {

                if (item.campo) {
                    item.campo.classList.remove("input-erro");
                }

            });


            /* =================================
               VALIDAÇÃO
            ================================= */

            for (const item of camposObrigatorios) {

                const campo = item.campo;

                if (!campo) {
                    continue;
                }

                const valor =
                    campo.value.trim();


                if (!valor) {

                    mostrarAlerta(
                        `Preencha o campo ${item.nome}.`
                    );


                    if (typeof marcarErroUsuario  === "function") {

                        marcarErroUsuario(campo);

                    } else {

                        campo.classList.add(
                            "input-erro"
                        );

                        campo.focus();

                    }

                    return;
                }

            }


            /* =================================
               CONFIRMAÇÃO DE SENHA
            ================================= */

            if (
                campoSenha &&
                campoSenhaConfirmacao &&
                campoSenha.value !==
                campoSenhaConfirmacao.value
            ) {

                mostrarAlerta(
                    "As senhas não coincidem."
                );


                if (typeof marcarErroUsuario === "function") {

                    marcarErroUsuario(
                        campoSenhaConfirmacao
                    );

                } else {

                    campoSenhaConfirmacao.classList.add(
                        "input-erro"
                    );

                    campoSenhaConfirmacao.focus();

                }

                return;
            }


            /* =================================
               FOTO
            ================================= */

            if (
                inputImagem &&
                inputImagem.files &&
                inputImagem.files.length > 0
            ) {

                console.log(
                    "Imagem selecionada:",
                    inputImagem.files[0]
                );

            }


            /* =================================
               CRIA FORM DATA
            ================================= */

            const dados = new FormData();


            dados.append(
                "nome",
                campoNome?.value.trim() || ""
            );

            dados.append(
                "username",
                campoUsername?.value.trim() || ""
            );

            dados.append(
                "senha",
                campoSenha?.value.trim() || ""
            );

            dados.append(
                "email",
                campoEmail?.value.trim() || ""
            );

            dados.append(
                "cep",
                campoCep?.value.trim() || ""
            );

            dados.append(
                "endereco",
                campoEndereco?.value.trim() || ""
            );

            dados.append(
                "numero",
                campoNumero?.value.trim() || ""
            );

            dados.append(
                "bairro",
                campoBairro?.value.trim() || ""
            );

            dados.append(
                "cidade",
                campoCidade?.value.trim() || ""
            );

            dados.append(
                "estado",
                campoEstado?.value.trim() || ""
            );

            dados.append(
                "complemento",
                campoComplemento?.value.trim() || ""
            );

            dados.append(
                "telefone",
                campoTelefone?.value.trim() || ""
            );

            dados.append(
                "data_nascimento",
                campoNascimento?.value || ""
            );

            dados.append(
                "rg",
                campoRg?.value.trim() || ""
            );

            dados.append(
                "cpf",
                campoCpf?.value.trim() || ""
            );

            dados.append(
                "cnpj",
                campoCnpj?.value.trim() || ""
            );

            dados.append(
                "acesso",
                campoPerfil?.value.trim() || ""
            );


            /* =================================
               FOTO
            ================================= */

            if (
                inputImagem &&
                inputImagem.files &&
                inputImagem.files.length > 0
            ) {

                dados.append(
                    "imagem",
                    inputImagem.files[0]
                );

            }


            /* =================================
               CSRF
            ================================= */

            const csrfToken =
                document.querySelector(
                    "[name=csrfmiddlewaretoken]"
                )?.value;


            if (!csrfToken) {

                mostrarAlerta(
                    "Token de segurança não encontrado.",
                    "erro"
                );

                return;
            }


            /* =================================
               ENVIA PARA O DJANGO
            ================================= */

            try {

                btnSalvarUsuario.disabled = true;


                const resposta =
                    await fetch(
                        "/usuarios/cadastrar/",
                        {
                            method: "POST",

                            headers: {
                                "X-CSRFToken":
                                    csrfToken
                            },

                            body: dados
                        }
                    );


                const resultado =
                    await resposta.json();


                /* =================================
                   ERRO
                ================================= */

                if (
                    !resposta.ok ||
                    !resultado.sucesso
                ) {

                    mostrarAlerta(
                        resultado.mensagem ||
                        "Não foi possível cadastrar o usuário.",
                        "erro"
                    );

                    return;
                }


                /* =================================
                   SUCESSO
                ================================= */

                mostrarAlerta(
                    "Usuário cadastrado com sucesso.",
                    "sucesso"
                );


                console.log(
                    "Usuário cadastrado:",
                    resultado
                );


                /* =================================
                   LIMPA FORMULÁRIO
                ================================= */

                limparCamposUsuario();


                /* =================================
                   LIMPA FOTO
                ================================= */

                if (inputImagem) {
                    inputImagem.value = "";
                }


                if (uploadBox) {

                    uploadBox.innerHTML = `
                        <i class="fa-solid fa-cloud-arrow-up"></i>

                        <span>
                            Arraste uma foto ou clique para selecionar
                        </span>
                    `;

                }


                /* =================================
                   LIMPA PRÉ-VISUALIZAÇÃO
                ================================= */

                const imgPreview =
                    document.getElementById(
                        "img-preview"
                    );

                const previewEmpty =
                    document.querySelector(
                        ".preview-empty-cadastrar-usuarios"
                    );


                if (imgPreview) {

                    imgPreview.src = "";
                    imgPreview.style.display =
                        "none";

                }


                if (previewEmpty) {

                    previewEmpty.style.display =
                        "flex";

                }


            } catch (erro) {

                console.error(
                    "Erro ao cadastrar usuário:",
                    erro
                );

                mostrarAlerta(
                    "Erro de comunicação com o servidor.",
                    "erro"
                );

            } finally {

                btnSalvarUsuario.disabled =
                    false;

            }

        }
    );

}

if (typeof inicializarBuscaCEPGlobal === "function"){
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

function sairModoEdicaoUsuario(){
    produtoEmEdicao = null;
    dadosOriginais = {};
    imagemOriginal = "";

    if (document.body) {
        document.body.removeAttribute(
            "data-usuario-editando"
        );
    }

    if (btnEditar) {
        delete btnEditar.dataset.usuarioId;
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
        "Modo edição encerrado. Você pode cadastrar um novo usuário.",
        "sucesso"
    );
}

if (campoUsername) {

    // 1. Limita o número de caracteres e impede espaços/caracteres inválidos em tempo real
    campoUsername.addEventListener("input", function () {
        // Remove espaços em branco automaticamente
        this.value = this.value.replace(/\s+/g, "");

        // Limita ao máximo de caracteres configurado (ex: 10)
        if (this.value.length > LIMITE_CARACTERES_USERNAME) {
            this.value = this.value.substring(0, LIMITE_CARACTERES_USERNAME);
        }
    });

    // 2. Verifica a disponibilidade no banco (Django) ao perder o foco (blur)
    campoUsername.addEventListener("blur", async function () {
        const username = this.value.trim();

        // Não valida se estiver vazio
        if (!username) {
            return;
        }

        // Se estiver no modo edição e o username não mudou, ignora a verificação
        const usuarioId = usuarioEmEdicao || document.body.dataset.usuarioEditando;

        try {
            const resposta = await fetch(`/usuarios/verificar-username/?username=${encodeURIComponent(username)}&usuario_id=${usuarioId || ""}`);
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




    if (!btnAtualizarTabela || !tabela) {
    return;
}

btnAtualizarTabela.addEventListener("click", async function () {

    try {

        const resposta = await fetch(
            "/usuarios/atualizar-tabela/",
            {
                method: "GET",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            }
        );

        if (!resposta.ok) {
            throw new Error(
                "Erro ao atualizar a tabela."
            );
        }

        const dados = await resposta.json();

        if (!dados.sucesso) {
            throw new Error(
                "Não foi possível atualizar a tabela."
            );
        }

        console.log("HTML recebido pelo servidor:");
        console.log(dados.html);

        console.log(
            "Quantidade de <tr> recebidos:",
            (dados.html.match(/<tr/g) || []).length
        );

        /* =========================================
           ATUALIZA A TABELA
        ========================================= */

        tabela.innerHTML = dados.html;


        /* =========================================
           MENSAGEM DE SUCESSO
        ========================================= */

        mostrarAlerta(
            "Tabela de usuários atualizada com sucesso.",
            "sucesso"
        );


    } catch (erro) {

        console.error(
            "Erro ao atualizar tabela de usuários:",
            erro
        );

        mostrarAlerta(
            "Não foi possível atualizar a tabela de usuários.",
            "erro"
        );

    }

});

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
            // Cria a cortina de fundo manual que fica por cima do modal da tabela
            const backdrop = document.createElement("div");
            backdrop.className = "backdrop-confirmacao";
            document.body.appendChild(backdrop);

            // Instancia o modal desativando o backdrop nativo
            const modalApagar = bootstrap.Modal.getOrCreateInstance(
                modalElemento,
                { backdrop: false }
            );

            modalApagar.show();
        }
    });
}

const btnConfirmarApagarUsuario = document.getElementById("btnConfirmarApagarUsuario");

if (btnConfirmarApagarUsuario) {
    btnConfirmarApagarUsuario.addEventListener("click", function () {
        if (!usuarioParaApagar) return;

        // Pega o ID pelo dataset ou value do checkbox
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
                // Remove a linha da tabela
                usuarioParaApagar.remove();
                usuarioParaApagar = null;

                // Esconde a modal de apagar
                const modalElemento = document.getElementById("modalApagarUsuario");
                if (modalElemento) {
                    const modal = bootstrap.Modal.getInstance(modalElemento);
                    if (modal) modal.hide();
                }

                // Remove o backdrop criado manualmente
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

// Limpa o backdrop caso o usuário feche a modal pelo botão 'X' ou 'Cancelar'
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

/* =====================================================
   INICIALIZA EVENTOS DA TABELA DE FILTRO
===================================================== */

function inicializarEventosTabelaUsuarios() {

    document
        .querySelectorAll("#modalFiltrarUsuarios tbody tr")
        .forEach(linha => {

            linha.addEventListener("click", function () {

                const radio =
                    this.querySelector('input[type="radio"]');

                if (!radio) return;

                document
                    .querySelectorAll(
                        "#modalFiltrarUsuarios tbody tr"
                    )
                    .forEach(tr => {

                        tr.classList.remove(
                            "usuario-selecionado"
                        );

                    });

                radio.checked = true;

                this.classList.add(
                    "usuario-selecionado"
                );

                radio.dispatchEvent(
                    new Event("change")
                );

            });

        });

}


/* =====================================================
   ABRIR MODAL DE FILTRO
===================================================== */

const btnAbrirFiltroUsuarios =
    document.getElementById(
        "btnAbrirFiltroUsuariosModal"
    );

if (btnAbrirFiltroUsuarios) {

    btnAbrirFiltroUsuarios.addEventListener(
        "click",
        () => {

            const modalElemento =
                document.getElementById(
                    "modalFiltrarUsuarios"
                );

            if (!modalElemento) return;

            bootstrap.Modal
                .getOrCreateInstance(
                    modalElemento,
                    {
                        backdrop: false
                    }
                )
                .show();

            inicializarEventosTabelaUsuarios();

        }
    );

}


/* =====================================================
   BOTÃO EXECUTAR FILTRO
===================================================== */
const btnExecutarFiltroUsuarios =
    document.getElementById(
        "btnExecutarFiltro"
    );

console.log(
    "Botão filtro encontrado:",
    btnExecutarFiltroUsuarios
);

if (btnExecutarFiltroUsuarios) {
    btnExecutarFiltroUsuarios.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            console.log(
                "BOTÃO FILTRAR FOI CLICADO"
            );
            filtrarUsuarios();

        }
    );

} else {
    console.error(
        "BOTÃO btnExecutarFiltroUsuarios NÃO FOI ENCONTRADO!"
    );

}


/* =====================================================
   CAMPOS DO FILTRO
===================================================== */

const tipoFiltro =
    document.getElementById("tipoFiltro");

const labelValorFiltro =
    document.getElementById("labelValorFiltro");

const valorFiltro =
    document.getElementById("valorFiltro");


/* =====================================================
   ALTERAÇÃO DO TIPO DE FILTRO
===================================================== */

if (tipoFiltro) {

    tipoFiltro.addEventListener(
        "change",
        () => {

            switch (tipoFiltro.value) {

                case "nome":

                    labelValorFiltro.textContent =
                        "Nome do Usuário";

                    valorFiltro.type = "text";

                    valorFiltro.placeholder =
                        "Digite o nome do usuário";

                    break;


                case "usuario":

                    labelValorFiltro.textContent =
                        "Usuário";

                    valorFiltro.type = "text";

                    valorFiltro.placeholder =
                        "Digite o usuário";

                    break;


                case "acesso":

                    labelValorFiltro.textContent =
                        "Acesso";

                    valorFiltro.type = "text";

                    valorFiltro.placeholder =
                        "Digite o tipo de acesso";

                    break;


                case "telefone":

                    labelValorFiltro.textContent =
                        "Telefone";

                    valorFiltro.type = "text";

                    valorFiltro.placeholder =
                        "Digite o telefone";

                    break;


                case "email":

                    labelValorFiltro.textContent =
                        "E-mail";

                    valorFiltro.type = "text";

                    valorFiltro.placeholder =
                        "Digite o e-mail";

                    break;


                case "rg":

                    labelValorFiltro.textContent =
                        "RG";

                    valorFiltro.type = "text";

                    valorFiltro.placeholder =
                        "Digite o RG";

                    break;


                case "cpf":

                    labelValorFiltro.textContent =
                        "CPF";

                    valorFiltro.type = "text";

                    valorFiltro.placeholder =
                        "Digite o CPF";

                    break;


                case "cnpj":

                    labelValorFiltro.textContent =
                        "CNPJ";

                    valorFiltro.type = "text";

                    valorFiltro.placeholder =
                        "Digite o CNPJ";

                    break;

            }

            valorFiltro.value = "";

        }
    );

}


async function filtrarUsuarios() {

    const tipo =
        document.getElementById(
            "tipoFiltro"
        )?.value;

    const valor =
        document.getElementById(
            "valorFiltro"
        )?.value.trim();


    /* =========================================
       VALIDAÇÃO
    ========================================= */

    if (!tipo) {

        mostrarAlerta(
            "Selecione um tipo de filtro.",
            "erro"
        );

        return;
    }


    if (!valor) {

        mostrarAlerta(
            "Digite um valor para realizar o filtro.",
            "erro"
        );

        return;
    }


    try {

        const resposta =
            await fetch(
                `/usuarios/atualizar-tabela/?tipo=${encodeURIComponent(tipo)}&valor=${encodeURIComponent(valor)}`,
                {
                    method: "GET",

                    headers: {
                        "X-Requested-With": "XMLHttpRequest"
                    }
                }
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao realizar filtro."
            );

        }


        /* =========================================
           CONVERTE RESPOSTA PARA JSON
        ========================================= */

        const resultado =
            await resposta.json();


        if (!resultado.sucesso) {

            throw new Error(
                resultado.mensagem ||
                "Não foi possível realizar o filtro."
            );

        }


        /* =========================================
           LOCALIZA A TABELA
        ========================================= */

        const tabela =
            document.getElementById(
                "tabelaModalUsuarios"
            );


        if (!tabela) {

            throw new Error(
                "Tabela de usuários não encontrada."
            );

        }


        /* =========================================
           INSERE SOMENTE O HTML
        ========================================= */

        tabela.innerHTML =
            resultado.html;


        /* =========================================
           REINICIALIZA OS EVENTOS
        ========================================= */

        inicializarEventosTabelaUsuarios();


        /* =========================================
           FECHA MODAL DE FILTRO
        ========================================= */

        const modalFiltro =
            document.getElementById(
                "modalFiltrarUsuarios"
            );


        if (modalFiltro) {

            const instancia =
                bootstrap.Modal.getInstance(
                    modalFiltro
                );


            if (instancia) {

                instancia.hide();

            }

        }


        /* =========================================
           MENSAGEM
        ========================================= */

        mostrarAlerta(
            "Filtro aplicado com sucesso.",
            "sucesso"
        );


    } catch (erro) {

        console.error(
            "Erro ao filtrar usuários:",
            erro
        );


        mostrarAlerta(
            "Não foi possível realizar o filtro.",
            "erro"
        );
    }

}

// Botão olho da Senha
const btnToggleSenha = document.getElementById("btnToggleSenha");
if (btnToggleSenha && campoSenha) {
    btnToggleSenha.addEventListener("click", function () {
        alternarVisualizacaoSenha(campoSenha, this);
    });
}

// Botão olho da Confirmação de Senha
const btnToggleSenhaConfirmacao = document.getElementById("btnToggleSenhaConfirmacao");
if (btnToggleSenhaConfirmacao && campoSenhaConfirmacao) {
    btnToggleSenhaConfirmacao.addEventListener("click", function () {
        alternarVisualizacaoSenha(campoSenhaConfirmacao, this);
    });
}

function desmarcarTodasLinhasUsuarios(){
    if (!tabelaUsuarios) return;

    tabelaUsuarios.querySelectorAll('input[name="usuario_selecionado"]').forEach(function (checkbox){
        checkbox.checked = false;
        const linha = checkbox.closest("tr");
        if (linha){
            linha.classList.remove("usuario-selecionado");
        }
    });
}

// Escuta cliques em qualquer lugar da página/modal
document.addEventListener("click", function (event) {
    // Se a tabela não estiver visível ou não existir na tela, não faz nada
    if (!tabelaUsuarios) return;

    // Verifica se o clique ocorreu DENTRO de uma linha da tabela de usuários
    const clicouNaLinha = event.target.closest("#tabelaModalUsuarios tr");

    // Verifica se o clique foi nos botões de ação do modal (Atualizar, Apagar, etc.)
    const clicouNasAcoesTabela = event.target.closest(".acoes-tabela-usuarios");

    // Se o clique NÃO foi em uma linha e NÃO foi nos botões do topo da tabela:
    if (!clicouNaLinha && !clicouNasAcoesTabela) {
        desmarcarTodasLinhasUsuarios();
    }
});

// Garante que, ao fechar o modal da tabela, tudo seja desmarcado
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

// CORREÇÃO: ID alterado de 'btnExecutarOrdenacaoUsuarios' para 'btnExecutarOrdenacao'
const btnExecutarOrdenacao = document.getElementById("btnExecutarOrdenacao");
if (btnExecutarOrdenacao) {
    // CORREÇÃO: Função alterada de 'ordenarProdutos' para 'ordenarUsuarios'
    btnExecutarOrdenacao.addEventListener("click", ordenarUsuarios);
}

async function ordenarUsuarios() {
    const direcao = document.getElementById("tipoOrdenacaoUsuario").value;
    
    // Faz a requisição
    const resposta = await fetch(`/usuarios/atualizar-tabela/?ordem=${direcao}`);
    
    // Converte a resposta para JSON em vez de .text()
    const dados = await resposta.json();

    if (dados.sucesso) {
        // Insere apenas a propriedade 'html' do objeto retornado
        document.getElementById("tabelaModalUsuarios").innerHTML = dados.html;

        if (typeof inicializarEventosTabelaUsuarios === "function") {
            inicializarEventosTabelaUsuarios();
        }

        bootstrap.Modal.getInstance(document.getElementById("modalOrdenarUsuarios")).hide();
    } else {
        console.error("Erro ao atualizar a tabela:", dados.mensagem);
    }
}
const btnVisualizarImagemUsuario = document.getElementById("btnVisualizarFotoModal");

if (btnVisualizarImagemUsuario) {
    btnVisualizarImagemUsuario.addEventListener("click", function () {
        // 1. Busca todos os inputs de seleção marcados na tabela (checkbox ou radio)
        const selecionados = document.querySelectorAll(
            "#modalTabelaUsuarios input[type='checkbox']:checked, #modalTabelaUsuarios input[type='radio']:checked"
        );

        // 2. Valida se nenhum foi selecionado
        if (selecionados.length === 0) {
            mostrarAlerta("Selecione um usuário para visualizar a imagem.", "erro");
            return;
        }

        // 3. Valida se mais de 1 usuário foi selecionado
        if (selecionados.length > 1) {
            mostrarAlerta("Selecione apenas 1 usuário por vez para visualizar a imagem.", "erro");
            return;
        }

        // 4. Pega a linha do único elemento selecionado
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

        // 5. Exibe o modal
        bootstrap.Modal
            .getOrCreateInstance(document.getElementById("modalVisualizarImagemUsuario"))
            .show();
    });
}
const btnGerarExcelUsuario = document.getElementById("btnGerarExcelTabelaModal");
    if (btnGerarExcelUsuario){
        btnGerarExcelUsuario.addEventListener("click",exportarTabelaParaExcelUsuario);
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

    // 1. Mapeia os índices de cada coluna com base no texto do cabeçalho (<th>)
    const cabecalhos = Array.from(tabela.querySelectorAll("thead th")).map(th => th.innerText.trim().toLowerCase());

    function getIndex(nomeColuna) {
        return cabecalhos.findIndex(c => c.includes(nomeColuna.toLowerCase()));
    }

    // Mapeamento automático dos índices
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

    // 2. Monta os cabeçalhos do arquivo Excel
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

    // Função auxiliar para extrair o texto com segurança do índice correto
    function obterTexto(colunas, i) {
        return (i !== -1 && colunas[i]) ? colunas[i].innerText.trim() : "";
    }

    // 3. Lê os dados de cada linha
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

    // 4. Cria e baixa a planilha Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(dadosExcel);

    ws['!cols'] = [
        { wch: 8 },  // ID
        { wch: 25 }, // Nome Completo
        { wch: 15 }, // Usuário
        { wch: 12 }, // CEP
        { wch: 25 }, // Endereço
        { wch: 10 }, // Número
        { wch: 18 }, // Cidade
        { wch: 18 }, // Bairro
        { wch: 8 },  // Estado
        { wch: 20 }, // Complemento
        { wch: 20 }, // Telefone
        { wch: 30 }, // E-mail
        { wch: 18 }, // Data de Nascimento
        { wch: 15 }, // RG
        { wch: 18 }, // CPF
        { wch: 20 }, // CNPJ
        { wch: 20 }, // Usuário Logado
        { wch: 18 }  // Acesso
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Usuários");

    const dataAtual = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `usuarios_${dataAtual}.xlsx`);

    mostrarAlerta("Relatório em Excel gerado com sucesso!", "sucesso");
}
});
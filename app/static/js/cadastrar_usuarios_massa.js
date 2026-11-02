
document.addEventListener("DOMContentLoaded", function () {

    // =========================================
    // 1. ELEMENTOS DA PÁGINA
    // =========================================
    const btnAbrirPlanilha = document.getElementById("btnAbrirPlanilha");
    const inputPlanilha = document.getElementById("inputPlanilhaUsuarios");
    const btnLimparTabela = document.getElementById("btnLimparTabela");

    const progresso = document.getElementById("progressoImportacao");
    const textoProgresso = document.getElementById("textoProgressoImportacao");
    const percentualProgresso = document.getElementById("percentualProgressoImportacao");
    const trilhoProgresso = document.getElementById("barraProgressoImportacao");
    const preenchimentoProgresso = document.getElementById("preenchimentoProgressoImportacao");

    const btnCadastroMassa = document.getElementById("btnCadastroMassaUsuarios");
    const relatorioCadastroMassa = document.getElementById("relatorioCadastroMassa");

    const btnEditarUsuario = document.getElementById("btnEditarusuario");

    const modalCredenciaisElemento = document.getElementById("modalCredenciaisUsuarios");
    const listaCredenciais = document.getElementById("listaCredenciaisUsuarios");
    const totalCredenciais = document.getElementById("totalCredenciais");
    const btnCopiarTodasCredenciais = document.getElementById("btnCopiarTodasCredenciais");

    console.table({
        botaoAbrir: !!btnAbrirPlanilha,
        inputPlanilha: !!inputPlanilha,
        modal: !!modalCredenciaisElemento,
        lista: !!listaCredenciais,
        total: !!totalCredenciais,
        botaoCopiar: !!btnCopiarTodasCredenciais
    });

    // Credenciais mantidas somente durante a visualização.
    let credenciaisPendentes = [];

    let planilhaImportada = false;
    let arquivoPlanilhaSelecionado = null;
    let inicioImportacao = 0;

    const tabela = document.querySelector(".usuarios-table");

    const DURACAO_MINIMA_IMPORTACAO = 700;
    const TEMPO_MENSAGEM_FINAL = 800;

    // =========================================
    // 2. COLUNAS OBRIGATÓRIAS
    // =========================================
    const colunasObrigatorias = [
        "Nome",
        "Usuário",
        "CEP",
        "Endereço",
        "Número",
        "Cidade",
        "Bairro",
        "Estado",
        "Complemento",
        "Telefone",
        "E-mail",
        "Data de Nascimento",
        "RG",
        "CPF",
        "CNPJ"
    ];

    // =========================================
    // 3. ABRIR SELETOR DE PLANILHA
    // =========================================
    if (btnAbrirPlanilha && inputPlanilha) {

        btnAbrirPlanilha.addEventListener("click", function (e) {

            e.preventDefault();

            if (btnAbrirPlanilha.disabled) {
                return;
            }

            // Abre o Explorer para selecionar o arquivo.
            inputPlanilha.click();
        });

    } else {

        console.error(
            "Botão ou input de seleção da planilha não encontrado."
        );
    }

    // =========================================
    // 4. FUNÇÕES AUXILIARES
    // =========================================
    function atualizarProgresso(percentual, mensagem) {

        if (
            !progresso ||
            !textoProgresso ||
            !percentualProgresso ||
            !trilhoProgresso ||
            !preenchimentoProgresso
        ) {
            return;
        }

        const valor = Math.max(0, Math.min(100, Math.round(percentual)));

        progresso.hidden = false;
        textoProgresso.textContent = mensagem;
        percentualProgresso.textContent = `${valor}%`;
        preenchimentoProgresso.style.width = `${valor}%`;

        trilhoProgresso.setAttribute("aria-valuenow", valor);
    }

    function iniciarProgresso() {

        inicioImportacao = performance.now();

        atualizarProgresso(
            0,
            "Preparando a importação..."
        );
    }

    function ocultarProgresso() {

        if (progresso) {
            progresso.hidden = true;
        }
    }

    function aguardarRenderizacao() {

        return new Promise(resolve => requestAnimationFrame(resolve));
    }

    function aguardar(ms) {

        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function garantirDuracaoMinima() {

        const tempoDecorrido = performance.now() - inicioImportacao;

        const tempoRestante =
            DURACAO_MINIMA_IMPORTACAO - tempoDecorrido;

        if (tempoRestante > 0) {
            await aguardar(tempoRestante);
        }
    }

    function normalizarCabecalho(valor) {

        return String(valor ?? "")
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function mostrarErro(mensagem) {

        mostrarAlerta(mensagem, "erro");
    }

    // =========================================
    // 5. MODAL DE CREDENCIAIS
    // =========================================

    function formatarCredencial(item) {

        return [
            `Nome: ${item.nome}`,
            `Usuário: ${item.username}`,
            `Senha: ${item.senha}`,
            "--------------------------------"
        ].join("\n");
    }

    // =========================================
    // 6. COPIAR CREDENCIAL INDIVIDUAL
    // =========================================

    async function copiarCredencial(item) {

        try {

            await navigator.clipboard.writeText(
                formatarCredencial(item)
            );

            mostrarAlerta(
                `Credenciais de ${item.nome} copiadas com sucesso.`,
                "sucesso"
            );

        } catch (erro) {

            console.error("Erro ao copiar credencial:", erro);

            mostrarAlerta(
                "Não foi possível copiar as credenciais. Verifique a permissão da área de transferência.",
                "erro"
            );
        }
    }

    // =========================================
    // 7. COPIAR TODAS AS CREDENCIAIS
    // =========================================

    async function copiarTodasCredenciais() {

        if (!credenciaisPendentes.length) {

            mostrarErro("Não existem credenciais disponíveis.");

            return;
        }

        const conteudo = [
            "CREDENCIAIS DOS USUÁRIOS",
            "",
            ...credenciaisPendentes.map(formatarCredencial)
        ].join("\n");

        try {

            await navigator.clipboard.writeText(conteudo);

            mostrarAlerta(
                `${credenciaisPendentes.length} credenciais copiadas com sucesso.`,
                "sucesso"
            );

        } catch (erro) {

            console.error("Erro ao copiar credenciais:", erro);

            mostrarAlerta(
                "Não foi possível copiar as credenciais.",
                "erro"
            );
        }
    }

    // =========================================
    // 8. EXIBIR MODAL DE CREDENCIAIS
    // =========================================

    function exibirModalCredenciais(credenciais) {

        if (!modalCredenciaisElemento || !listaCredenciais) {

            console.error(
                "Elementos do modal de credenciais não encontrados."
            );

            mostrarErro(
                "Os usuários foram cadastrados, mas não foi possível abrir o modal de credenciais. Não feche nem atualize esta página antes de tentar novamente."
            );

            return;
        }

        if (!credenciais.length) {
            return;
        }

        credenciaisPendentes = credenciais.map(item => ({
            nome: String(item.nome || ""),
            username: String(item.username || ""),
            senha: String(item.senha || "")
        }));

        listaCredenciais.replaceChildren();

        if (totalCredenciais) {
            totalCredenciais.textContent = credenciaisPendentes.length;
        }

        credenciaisPendentes.forEach(function (item) {

            const card = document.createElement("div");
            card.className = "credencial-card";

            const cabecalho = document.createElement("div");
            cabecalho.className = "credencial-card-cabecalho";

            const nome = document.createElement("strong");
            nome.textContent = item.nome;

            const identificador = document.createElement("span");
            identificador.className = "credencial-login";
            identificador.textContent = `Usuário: ${item.username}`;

            const senhaContainer = document.createElement("div");
            senhaContainer.className = "credencial-senha-container";

            const senha = document.createElement("code");
            senha.textContent = item.senha;

            const btnCopiar = document.createElement("button");
            btnCopiar.type = "button";
            btnCopiar.className = "btn-copiar-credencial";
            btnCopiar.innerHTML = '<i class="fa-solid fa-copy"></i>';
            btnCopiar.title = "Copiar credenciais";
            btnCopiar.setAttribute(
                "aria-label",
                `Copiar credenciais de ${item.nome}`
            );

            btnCopiar.addEventListener("click", function () {

                copiarCredencial(item);
            });

            cabecalho.appendChild(nome);

            senhaContainer.append(senha, btnCopiar);

            card.append(
                cabecalho,
                identificador,
                senhaContainer
            );

            listaCredenciais.appendChild(card);
        });

        if (typeof bootstrap === "undefined") {

            mostrarErro(
                "O Bootstrap não está disponível para abrir o modal."
            );

            return;
        }

        bootstrap.Modal
            .getOrCreateInstance(modalCredenciaisElemento)
            .show();
    }

    // =========================================
    // 9. DESCARTAR CREDENCIAIS AO FECHAR O MODAL
    // =========================================

    if (modalCredenciaisElemento) {

        modalCredenciaisElemento.addEventListener(
            "hidden.bs.modal",
            function () {

                credenciaisPendentes = [];

                listaCredenciais?.replaceChildren();

                if (totalCredenciais) {
                    totalCredenciais.textContent = "0";
                }

                console.log(
                    "Credenciais temporárias descartadas da interface."
                );
            }
        );
    }

    // =========================================
    // 10. EVENTO: COPIAR TODAS
    // =========================================

    if (btnCopiarTodasCredenciais) {

        btnCopiarTodasCredenciais.addEventListener(
            "click",
            copiarTodasCredenciais
        );
    }

    // =========================================
    // 11. LIMPAR TABELA
    // =========================================

    function limparPlanilhaAnterior() {

        planilhaImportada = false;
        arquivoPlanilhaSelecionado = null;

        if (tabela) {

            const tbody = tabela.querySelector("tbody");

            if (tbody) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="15" class="sem-registros-usuarios">
                            <div class="sem-registros-content">
                                <i class="fa-solid fa-users"></i>
                                <p>Usuários importados serão exibidos aqui.</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }

        if (relatorioCadastroMassa) {

            relatorioCadastroMassa.replaceChildren();
            relatorioCadastroMassa.hidden = true;
        }

        ocultarProgresso();

        if (btnCadastroMassa) {
            btnCadastroMassa.disabled = true;
        }

        if (btnLimparTabela) {
            btnLimparTabela.disabled = false;
        }
    }

    // =========================================
    // 12. BOTÃO LIMPAR TABELA
    // =========================================

    if (btnLimparTabela) {

        btnLimparTabela.addEventListener("click", function () {

            limparPlanilhaAnterior();

            if (inputPlanilha) {
                inputPlanilha.value = "";
            }

            mostrarAlerta(
                "Tabela de usuários limpa com sucesso.",
                "sucesso"
            );

            console.log("Tabela de usuários limpa.");
        });
    }

    // =========================================
    // 13. PREPARAR TABELA
    // =========================================

    function prepararTabela(cabecalhos, dados) {

        const novoThead = document.createElement("thead");
        const trCabecalho = document.createElement("tr");

        cabecalhos.forEach(function (cabecalho) {

            const th = document.createElement("th");

            th.textContent = cabecalho;

            trCabecalho.appendChild(th);
        });

        novoThead.appendChild(trCabecalho);

        const novoTbody = document.createElement("tbody");
        const fragmento = document.createDocumentFragment();

        dados.forEach(function (linha) {

            const tr = document.createElement("tr");

            linha.forEach(function (valor) {

                const td = document.createElement("td");

                // Não exibe as senhas na tabela de pré-visualização.
                td.textContent = String(valor ?? "");

                tr.appendChild(td);
            });

            fragmento.appendChild(tr);
        });

        novoTbody.appendChild(fragmento);

        return {
            thead: novoThead,
            tbody: novoTbody
        };
    }

    // =========================================
    // 14. PROCESSAR LINHAS EM LOTES
    // =========================================

    async function processarLinhasEmLotes(linhasDados, indicesColunas) {

        const dados = [];
        const total = linhasDados.length;

        const tamanhoLote = 100;

        for (let inicio = 0; inicio < total; inicio += tamanhoLote) {

            const fim = Math.min(inicio + tamanhoLote, total);

            const lote = linhasDados.slice(inicio, fim);

            for (const linha of lote) {

                dados.push(
                    indicesColunas.map(indice => linha[indice] ?? "")
                );
            }

            const percentual = 60 + (fim / total) * 30;

            atualizarProgresso(
                percentual,
                `Organizando usuários: ${fim} de ${total}...`
            );

            await aguardarRenderizacao();
        }

        return dados;
    }

    // =========================================
    // 15. IMPORTAR PLANILHA
    // =========================================

    if (inputPlanilha) {

        inputPlanilha.addEventListener("change", async function () {

            const arquivo = inputPlanilha.files[0];

            if (!arquivo) {
                return;
            }

            limparPlanilhaAnterior();

            if (btnAbrirPlanilha) {
                btnAbrirPlanilha.disabled = true;
            }

            try {

                // 15.1. Validar arquivo
                if (!arquivo.name.toLowerCase().endsWith(".xlsx")) {

                    throw new Error(
                        "Selecione um arquivo Excel no formato .xlsx."
                    );
                }

                if (typeof XLSX === "undefined") {

                    throw new Error(
                        "Não foi possível carregar a biblioteca de leitura do Excel."
                    );
                }

                // 15.2. Iniciar progresso
                iniciarProgresso();

                await aguardarRenderizacao();

                atualizarProgresso(
                    10,
                    "Lendo o arquivo selecionado..."
                );

                await aguardarRenderizacao();

                // 15.3. Ler arquivo Excel
                const buffer = await arquivo.arrayBuffer();

                atualizarProgresso(
                    25,
                    "Interpretando a planilha..."
                );

                await aguardarRenderizacao();

                const workbook = XLSX.read(buffer, {
                    type: "array",
                    cellDates: true
                });

                const primeiraAba = workbook.SheetNames.find(
                    nome => nome !== "_VALIDACAO"
                );

                if (!primeiraAba) {

                    throw new Error(
                        "A planilha não possui uma aba para leitura."
                    );
                }

                const worksheet = workbook.Sheets[primeiraAba];

                const linhas = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: "",
                    raw: false,
                    blankrows: false
                });

                if (!linhas.length || !linhas[0].length) {

                    throw new Error(
                        "A planilha está vazia."
                    );
                }

                atualizarProgresso(
                    45,
                    "Validando as colunas..."
                );

                await aguardarRenderizacao();

                // 15.4. Validar cabeçalhos
                const cabecalhos = linhas[0].map(function (valor) {

                    return String(valor ?? "").trim();
                });

                const cabecalhosNormalizados = cabecalhos.map(
                    normalizarCabecalho
                );

                if (cabecalhos.some(cabecalho => !cabecalho)) {

                    throw new Error(
                        "A planilha possui cabeçalhos vazios."
                    );
                }

                if (
                    new Set(cabecalhosNormalizados).size !==
                    cabecalhosNormalizados.length
                ) {

                    throw new Error(
                        "A planilha possui colunas duplicadas."
                    );
                }

                const colunasAusentes = colunasObrigatorias.filter(
                    function (coluna) {

                        return !cabecalhosNormalizados.includes(
                            normalizarCabecalho(coluna)
                        );
                    }
                );

                if (colunasAusentes.length > 0) {

                    throw new Error(
                        "A planilha não corresponde ao modelo de usuários.\n\n" +
                        "Colunas ausentes:\n- " +
                        colunasAusentes.join("\n- ")
                    );
                }

                // 15.5. Verificar quantidade de colunas
                const colunasExtras = cabecalhos.filter(function (coluna) {

                    return !colunasObrigatorias.some(
                        obrigatoria =>
                            normalizarCabecalho(obrigatoria) ===
                            normalizarCabecalho(coluna)
                    );
                });

                if (colunasExtras.length > 0) {

                    throw new Error(
                        "A planilha possui colunas não permitidas:\n- " +
                        colunasExtras.join("\n- ")
                    );
                }

                // 15.6. Filtrar linhas vazias
                const linhasDados = linhas.slice(1).filter(function (linha) {

                    return linha.some(
                        valor => String(valor ?? "").trim() !== ""
                    );
                });

                if (linhasDados.length === 0) {

                    throw new Error(
                        "A planilha não contém usuários para importar."
                    );
                }

                if (linhasDados.length > 500) {

                    throw new Error(
                        "O limite máximo é de 500 usuários por importação."
                    );
                }

                const indicesColunas = colunasObrigatorias.map(
                    function (coluna) {

                        return cabecalhosNormalizados.indexOf(
                            normalizarCabecalho(coluna)
                        );
                    }
                );

                atualizarProgresso(
                    55,
                    "Preparando os usuários..."
                );

                await aguardarRenderizacao();

                const dados = await processarLinhasEmLotes(
                    linhasDados,
                    indicesColunas
                );

                // 15.7. Preparar tabela
                atualizarProgresso(
                    93,
                    "Preparando a tabela..."
                );

                await aguardarRenderizacao();

                const novaTabela = prepararTabela(
                    colunasObrigatorias,
                    dados
                );

                // 15.8. Finalizar
                atualizarProgresso(
                    97,
                    "Finalizando a importação..."
                );

                await aguardarRenderizacao();

                await garantirDuracaoMinima();

                atualizarProgresso(
                    100,
                    "Importação concluída!"
                );

                await aguardarRenderizacao();

                // 15.9. Atualizar tabela
                if (!tabela) {

                    throw new Error(
                        "A tabela de usuários não foi encontrada na página."
                    );
                }

                const thead = tabela.querySelector("thead");
                const tbody = tabela.querySelector("tbody");

                if (thead) {

                    thead.replaceChildren(
                        ...Array.from(novaTabela.thead.children).map(
                            elemento => elemento.cloneNode(true)
                        )
                    );
                }

                if (tbody) {

                    tbody.replaceChildren(
                        ...Array.from(novaTabela.tbody.children)
                    );
                }

                arquivoPlanilhaSelecionado = arquivo;
                planilhaImportada = true;

                if (btnCadastroMassa) {
                    btnCadastroMassa.disabled = false;
                }

                if (btnLimparTabela) {
                    btnLimparTabela.disabled = false;
                }

                console.log(
                    `Planilha carregada: ${dados.length} usuário(s).`
                );

                await aguardar(TEMPO_MENSAGEM_FINAL);

                ocultarProgresso();

            } catch (erro) {

                console.error(
                    "Erro ao importar planilha:",
                    erro
                );

                limparPlanilhaAnterior();

                mostrarErro(
                    erro.message ||
                    "Não foi possível ler a planilha."
                );

                await aguardar(1500);

                ocultarProgresso();

            } finally {

                inputPlanilha.value = "";

                if (btnAbrirPlanilha) {
                    btnAbrirPlanilha.disabled = false;
                }
            }
        });
    }

    // =========================================
    // 16. RELATÓRIO DO CADASTRO EM MASSA
    // =========================================

    function exibirRelatorioCadastro(resultado) {

        if (!relatorioCadastroMassa) {

            mostrarAlerta(
                `Concluído: ${resultado.cadastrados} cadastrado(s), ` +
                `${resultado.rejeitados} rejeitado(s).`,
                resultado.cadastrados > 0 ? "sucesso" : "erro"
            );

            return;
        }

        relatorioCadastroMassa.replaceChildren();
        relatorioCadastroMassa.hidden = false;

        const titulo = document.createElement("h3");

        titulo.textContent = "Resultado do cadastro em massa";

        const resumo = document.createElement("p");

        resumo.textContent =
            `Total recebido: ${resultado.total_recebido} | ` +
            `Cadastrados: ${resultado.cadastrados} | ` +
            `Rejeitados: ${resultado.rejeitados}`;

        relatorioCadastroMassa.append(titulo, resumo);

        const lista = document.createElement("ul");

        // Usuários cadastrados
        (resultado.resultados || []).forEach(function (item) {

            const linha = document.createElement("li");

            linha.textContent =
                `Linha ${item.linha} — ${item.nome || "Sem nome"}: ` +
                "Usuário cadastrado com sucesso.";

            linha.classList.add("resultado-sucesso");

            lista.appendChild(linha);
        });

        // Usuários rejeitados
        (resultado.erros || []).forEach(function (item) {

            const linha = document.createElement("li");

            linha.textContent =
                `Linha ${item.linha} — ${item.nome || "Sem nome"}: ` +
                `${item.motivo}`;

            linha.classList.add("resultado-erro");

            lista.appendChild(linha);
        });

        relatorioCadastroMassa.appendChild(lista);

        mostrarAlerta(
            resultado.cadastrados > 0
                ? `Concluído: ${resultado.cadastrados} cadastrado(s), ${resultado.rejeitados} rejeitado(s).`
                : "Nenhum usuário foi cadastrado.",
            resultado.cadastrados > 0 ? "sucesso" : "erro"
        );
    }

    // =========================================
    // 17. ENVIAR CADASTRO EM MASSA
    // =========================================

    if (btnCadastroMassa) {

        btnCadastroMassa.addEventListener("click", async function () {

            if (!planilhaImportada) {

                mostrarAlerta(
                    "Importe uma planilha de usuários antes de realizar o cadastro em massa.",
                    "erro"
                );

                return;
            }

            if (!arquivoPlanilhaSelecionado) {

                mostrarAlerta(
                    "Não foi possível localizar o arquivo original. Importe novamente a planilha.",
                    "erro"
                );

                return;
            }

            if (btnCadastroMassa.disabled) {
                return;
            }

            const confirmar = await confirmarAcao(
                "Deseja cadastrar os usuários da planilha?\n\n" +
                "Os registros com dados inválidos ou duplicados " +
                "serão rejeitados individualmente."
            );

            if (!confirmar) {
                return;
            }

            btnCadastroMassa.disabled = true;

            if (btnAbrirPlanilha) {
                btnAbrirPlanilha.disabled = true;
            }

            if (btnLimparTabela) {
                btnLimparTabela.disabled = true;
            }

            if (relatorioCadastroMassa) {
                relatorioCadastroMassa.hidden = true;
            }

            iniciarProgresso();

            atualizarProgresso(
                10,
                "Enviando usuários para o servidor..."
            );

            try {

                const csrfToken = document.cookie
                    .split("; ")
                    .find(cookie => cookie.startsWith("csrftoken="))
                    ?.split("=")
                    .slice(1)
                    .join("=");

                const formulario = new FormData();

                formulario.append(
                    "arquivo_planilha",
                    arquivoPlanilhaSelecionado
                );

                const resposta = await fetch(
                    btnCadastroMassa.dataset.url,
                    {
                        method: "POST",
                        credentials: "same-origin",
                        headers: {
                            "X-CSRFToken": csrfToken || ""
                        },
                        body: formulario
                    }
                );

                const resultado = await resposta.json();

                console.log("Importação processada:", {
                    total: resultado.total_recebido,
                    cadastrados: resultado.cadastrados,
                    rejeitados: resultado.rejeitados
                });

                // Exibe os motivos das rejeições.
                if (resultado.erros && resultado.erros.length > 0) {

                    console.group("Motivos das rejeições");

                    console.table(
                        resultado.erros.map(erro => ({
                            Linha: erro.linha,
                            Nome: erro.nome,
                            Motivo: erro.motivo
                        }))
                    );

                    console.groupEnd();
                }

                if (!resposta.ok) {

                    throw new Error(
                        resultado.mensagem ||
                        "O servidor não conseguiu processar o cadastro."
                    );
                }

                atualizarProgresso(
                    100,
                    `Concluído: ${resultado.cadastrados} cadastrado(s), ` +
                    `${resultado.rejeitados} rejeitado(s).`
                );

                exibirRelatorioCadastro(resultado);

                exibirModalCredenciais(
                    (resultado.resultados || []).filter(item =>
                        item.senha && item.username
                    )
                );

            } catch (erro) {

                console.error(
                    "Erro no cadastro em massa:",
                    erro
                );

                mostrarAlerta(
                    erro.message ||
                    "Ocorreu um erro ao enviar os usuários para cadastro.",
                    "erro"
                );

            } finally {

                btnCadastroMassa.disabled = false;

                if (btnAbrirPlanilha) {
                    btnAbrirPlanilha.disabled = false;
                }

                if (btnLimparTabela) {
                    btnLimparTabela.disabled = false;
                }
            }
        });
    }

    // =========================================
    // 18. BOTÃO EDITAR USUÁRIO
    // =========================================

    if (btnEditarUsuario) {

        btnEditarUsuario.addEventListener("click", function () {

            window.location.href = this.dataset.url;
        });
    }

});

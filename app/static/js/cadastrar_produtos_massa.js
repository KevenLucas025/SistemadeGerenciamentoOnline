
document.addEventListener("DOMContentLoaded", function () {

    // =========================================
    // 1. ELEMENTOS DA PÁGINA
    // =========================================
    const btnAbrirPlanilha = document.getElementById("btnAbrirPlanilha");
    const inputPlanilha = document.getElementById("inputPlanilhaProdutos");
    const btnLimparTabela = document.getElementById("btnLimparTabela");

    const progresso = document.getElementById("progressoImportacao");
    const textoProgresso = document.getElementById("textoProgressoImportacao");
    const percentualProgresso = document.getElementById("percentualProgressoImportacao");
    const trilhoProgresso = document.getElementById("barraProgressoImportacao");
    const preenchimentoProgresso = document.getElementById("preenchimentoProgressoImportacao");

    const btnCadastroMassa = document.getElementById("btnCadastroMassa");
    const relatorioCadastroMassa = document.getElementById("relatorioCadastroMassa");
    const btnEditarProduto = document.getElementById("btnEditarProduto");

    let planilhaImportada = false;
    let arquivoPlanilhaSelecionado = null;

    const tabela = document.querySelector(".produtos-table");

    const DURACAO_MINIMA_IMPORTACAO = 700;
    const TEMPO_MENSAGEM_FINAL = 800;

    let inicioImportacao = 0;

    // =========================================
    // 2. COLUNAS OBRIGATÓRIAS
    // =========================================
    const colunasObrigatorias = [
        "Produto",
        "Quantidade",
        "Valor Unitário",
        "Desconto",
        "Data do Cadastro",
        "Código do Item",
        "Cliente",
        "Descrição"
    ];

    // =========================================
    // 3. BOTÃO ABRIR PLANILHA
    // =========================================
    if (btnAbrirPlanilha && inputPlanilha) {
        btnAbrirPlanilha.addEventListener("click", function (e) {
            e.preventDefault();

            if (btnAbrirPlanilha.disabled) {
                return;
            }

            // Abre o seletor de arquivos diretamente pelo clique do usuário.
            inputPlanilha.click();
        });
    } else {
        console.error("Botão ou campo de seleção da planilha não encontrado.", {
            btnAbrirPlanilha,
            inputPlanilha
        });
    }

    // =========================================
    // 4. FUNÇÃO DE LIMPEZA DA TABELA
    // =========================================
    function limparPlanilhaAnterior() {
        planilhaImportada = false;
        arquivoPlanilhaSelecionado = null;

        if (tabela) {
            const tbody = tabela.querySelector("tbody");

            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="sem-registros-produtos">
                            <div class="sem-registros-content">
                                <i class="fa-solid fa-box-open"></i>
                                <p>Produtos importados serão exibidos aqui.</p>
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
    // 5. BOTÃO LIMPAR TABELA
    // =========================================
    if (btnLimparTabela) {
        btnLimparTabela.addEventListener("click", function () {

            limparPlanilhaAnterior();

            if (inputPlanilha) {
                inputPlanilha.value = "";
            }

            mostrarAlerta(
                "Tabela de produtos limpa com sucesso.",
                "sucesso"
            );

            console.log("Tabela de produtos limpa.");
        });
    }

    // =========================================
    // 6. CONTROLE DE PROGRESSO
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
        atualizarProgresso(0, "Preparando a importação...");
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
        const tempoRestante = DURACAO_MINIMA_IMPORTACAO - tempoDecorrido;

        if (tempoRestante > 0) {
            await aguardar(tempoRestante);
        }
    }

    // =========================================
    // 7. NORMALIZAÇÃO E ERROS
    // =========================================
    function normalizarCabecalho(valor) {
        return String(valor ?? "")
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function mostrarErro(mensagem) {
        mostrarAlerta(mensagem);
    }

    // =========================================
    // 8. PREPARAR TABELA EM MEMÓRIA
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
    // 9. PROCESSAR LINHAS EM LOTES
    // =========================================
    async function processarLinhasEmLotes(linhasDados, indicesColunas) {
        const dados = [];
        const total = linhasDados.length;

        const tamanhoLote = total <= 500
            ? 100
            : total <= 5000
                ? 500
                : 1000;

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
                `Organizando produtos: ${fim} de ${total}...`
            );

            await aguardarRenderizacao();
        }

        return dados;
    }

    // =========================================
    // 10. IMPORTAR PLANILHA
    // =========================================
    if (inputPlanilha) {
        inputPlanilha.addEventListener("change", async function () {

            const arquivo = inputPlanilha.files[0];

            if (!arquivo) {
                return;
            }

            // Limpa totalmente qualquer importação prévia.
            limparPlanilhaAnterior();

            if (btnAbrirPlanilha) {
                btnAbrirPlanilha.disabled = true;
            }

            try {

                // 10.1. VALIDAR ARQUIVO
                if (!arquivo.name.toLowerCase().endsWith(".xlsx")) {
                    throw new Error(
                        "Selecione um arquivo Excel no formato .xlsx."
                    );
                }

                if (typeof XLSX === "undefined") {
                    throw new Error(
                        "Não foi possível carregar a biblioteca de leitura do Excel. Atualize a página e tente novamente."
                    );
                }

                if (!tabela) {
                    throw new Error(
                        "Não foi possível localizar a tabela de produtos na página."
                    );
                }

                // 10.2. INICIAR PROGRESSO
                iniciarProgresso();
                await aguardarRenderizacao();

                atualizarProgresso(10, "Lendo o arquivo selecionado...");
                await aguardarRenderizacao();

                // 10.3. LER ARQUIVO EXCEL
                const buffer = await arquivo.arrayBuffer();

                atualizarProgresso(25, "Interpretando a planilha...");
                await aguardarRenderizacao();

                const workbook = XLSX.read(buffer, {
                    type: "array",
                    cellDates: true
                });

                const primeiraAba = workbook.SheetNames[0];

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
                    throw new Error("A planilha está vazia.");
                }

                atualizarProgresso(45, "Validando as colunas...");
                await aguardarRenderizacao();

                // 10.4. VALIDAR CABEÇALHOS
                const cabecalhos = linhas[0].map(function (valor) {
                    return String(valor ?? "").trim();
                });

                const cabecalhosNormalizados = cabecalhos.map(
                    normalizarCabecalho
                );

                if (cabecalhos.some(cabecalho => !cabecalho)) {
                    throw new Error(
                        "A planilha possui cabeçalhos vazios. Corrija a primeira linha e tente novamente."
                    );
                }

                if (
                    new Set(cabecalhosNormalizados).size !==
                    cabecalhosNormalizados.length
                ) {
                    throw new Error(
                        "A planilha possui colunas duplicadas. Corrija os cabeçalhos e tente novamente."
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
                        "A planilha selecionada não corresponde ao modelo de produtos.\n\n" +
                        "Colunas ausentes:\n- " +
                        colunasAusentes.join("\n- ")
                    );
                }

                // 10.5. FILTRAR E ORGANIZAR DADOS
                const linhasDados = linhas.slice(1).filter(function (linha) {
                    return linha.some(
                        valor => String(valor ?? "").trim() !== ""
                    );
                });

                if (linhasDados.length === 0) {
                    throw new Error(
                        "A planilha possui os cabeçalhos, mas não contém produtos."
                    );
                }

                const indicesColunas = colunasObrigatorias.map(
                    function (coluna) {
                        return cabecalhosNormalizados.indexOf(
                            normalizarCabecalho(coluna)
                        );
                    }
                );

                atualizarProgresso(55, "Preparando os produtos...");
                await aguardarRenderizacao();

                const dados = await processarLinhasEmLotes(
                    linhasDados,
                    indicesColunas
                );

                // 10.6. PREPARAR TABELA EM MEMÓRIA
                atualizarProgresso(93, "Preparando a tabela...");
                await aguardarRenderizacao();

                const novaTabela = prepararTabela(
                    colunasObrigatorias,
                    dados
                );

                // 10.7. DURAÇÃO MÍNIMA
                atualizarProgresso(97, "Finalizando a importação...");
                await aguardarRenderizacao();

                await garantirDuracaoMinima();

                // 10.8. RENDERIZAR OS NOVOS DADOS
                atualizarProgresso(100, "Importação concluída!");
                await aguardarRenderizacao();

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
                    `Nova planilha carregada: ${dados.length} produto(s).`
                );

                await aguardar(TEMPO_MENSAGEM_FINAL);
                ocultarProgresso();

            } catch (erro) {

                console.error("Erro ao importar planilha:", erro);

                limparPlanilhaAnterior();

                mostrarErro(
                    erro.message ||
                    "Não foi possível ler a planilha. Verifique se o arquivo está íntegro e tente novamente."
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
    // 11. RELATÓRIO DO CADASTRO EM MASSA
    // =========================================
    function exibirRelatorioCadastro(resultado) {

        if (!relatorioCadastroMassa) {
            mostrarAlerta(
                resultado.cadastrados > 0
                    ? `Concluído: ${resultado.cadastrados} cadastrado(s), ${resultado.rejeitados} rejeitado(s).`
                    : "Nenhum produto foi cadastrado.",
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

        (resultado.resultados || []).forEach(function (item) {

            const linha = document.createElement("li");

            const identificacao = item.codigo
                ? `Código ${item.codigo}`
                : `Linha ${item.linha}`;

            linha.textContent =
                `Linha ${item.linha} — ${identificacao} — ` +
                `${item.produto || "Produto sem nome"}: ${item.mensagem}`;

            linha.classList.add(
                item.status === "sucesso"
                    ? "resultado-sucesso"
                    : "resultado-erro"
            );

            lista.appendChild(linha);
        });

        relatorioCadastroMassa.appendChild(lista);

        mostrarAlerta(
            resultado.cadastrados > 0
                ? `Concluído: ${resultado.cadastrados} cadastrado(s), ${resultado.rejeitados} rejeitado(s).`
                : "Nenhum produto foi cadastrado.",
            resultado.cadastrados > 0 ? "sucesso" : "erro"
        );
    }

    // =========================================
    // 12. CADASTRO EM MASSA
    // =========================================
    if (btnCadastroMassa) {

        btnCadastroMassa.addEventListener("click", async function () {

            if (!planilhaImportada) {
                mostrarAlerta(
                    "Importe uma planilha de produtos antes de realizar o cadastro em massa.",
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
                "Deseja cadastrar os produtos da planilha?\n\n" +
                "Os produtos com dados inválidos ou clientes não cadastrados " +
                "serão rejeitados individualmente."
            );

            if (!confirmar) {
                return;
            }

            if (relatorioCadastroMassa) {
                relatorioCadastroMassa.hidden = true;
            }

            atualizarProgresso(
                0,
                "Enviando produtos para o servidor..."
            );

            btnCadastroMassa.disabled = true;

            try {

                const csrfToken = document.cookie
                    .split("; ")
                    .find(cookie => cookie.startsWith("csrftoken="))
                    ?.split("=")
                    .slice(1)
                    .join("=");

                console.log(
                    "Arquivo Excel enviado:",
                    arquivoPlanilhaSelecionado.name
                );

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

                console.log("Resultado completo do servidor:", resultado);
                console.log("Total recebido:", resultado.total_recebido);
                console.log("Cadastrados:", resultado.cadastrados);
                console.log("Rejeitados:", resultado.rejeitados);
                console.table(resultado.resultados);

                console.log("Primeiros 20 erros do cadastro:");

                console.table(
                    (resultado.resultados || [])
                        .filter(item => item.status === "erro")
                        .slice(0, 20)
                        .map(item => ({
                            linha: item.linha,
                            produto: item.produto,
                            codigo: item.codigo,
                            mensagem: item.mensagem
                        }))
                );

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

            } catch (erro) {

                console.error("Erro no cadastro em massa:", erro);

                mostrarAlerta(
                    erro.message ||
                    "Ocorreu um erro ao enviar os produtos para cadastro."
                );

            } finally {

                btnCadastroMassa.disabled = false;

                if (btnAbrirPlanilha) {
                    btnAbrirPlanilha.disabled = false;
                }
            }
        });
    }

    // =========================================
    // 13. VALIDAR DESCONTO DA PLANILHA
    // =========================================
    function validarDesconto(valor, numeroLinha) {

        const texto = String(valor ?? "").trim();

        if (texto === "") {
            return {
                valido: true,
                valor: "0"
            };
        }

        const desconto = Number(texto.replace(",", "."));

        if (
            !Number.isFinite(desconto) ||
            desconto < 0 ||
            desconto > 100
        ) {
            return {
                valido: false,
                mensagem:
                    `Linha ${numeroLinha}: desconto inválido. ` +
                    "Informe um número entre 0 e 100 ou deixe a célula em branco."
            };
        }

        return {
            valido: true,
            valor: String(desconto)
        };
    }

    // =========================================
    // 14. EDITAR PRODUTO
    // =========================================
    if (btnEditarProduto) {
        btnEditarProduto.addEventListener("click", function () {
            window.location.href = this.dataset.url;
        });
    }

});

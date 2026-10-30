document.addEventListener("DOMContentLoaded", function () {

    // =========================================
    // 1. ELEMENTOS DA PÁGINA
    // =========================================
    const btnAbrirPlanilha = document.getElementById("btnAbrirPlanilha");
    const inputPlanilha = document.getElementById("inputPlanilhaProdutos");

    const btnPlanilhas = document.getElementById("btnPlanilhasExemplo");
    const modalElemento = document.getElementById("modalPlanilhasExemplo");

    const progresso = document.getElementById("progressoImportacao");
    const textoProgresso = document.getElementById("textoProgressoImportacao");
    const percentualProgresso = document.getElementById("percentualProgressoImportacao");
    const trilhoProgresso = document.getElementById("barraProgressoImportacao");
    const preenchimentoProgresso = document.getElementById("preenchimentoProgressoImportacao");

    const btnCadastroMassa = document.getElementById("btnCadastroMassa");
    const relatorioCadastroMassa = document.getElementById("relatorioCadastroMassa");

    let planilhaImportada = false;

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
    // FUNÇÃO DE LIMPEZA ABSOLUTA DA TABELA
    // =========================================
    function limparPlanilhaAnterior() {
        planilhaImportada = false;

        if (tabela) {
            // Limpa totalmente o HTML interno da tabela
            tabela.innerHTML = "";
            
            // Reconstrói a estrutura básica zerada para evitar erros de seleção
            tabela.innerHTML = "<thead></thead><tbody></tbody>";
        }

        if (relatorioCadastroMassa) {
            relatorioCadastroMassa.innerHTML = "";
            relatorioCadastroMassa.hidden = true;
        }

        ocultarProgresso();

        if (btnCadastroMassa) {
            btnCadastroMassa.disabled = true;
        }
    }
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
    // 4. MODAL DE PLANILHAS DE EXEMPLO
    // =========================================
    if (btnPlanilhas && modalElemento) {
        btnPlanilhas.addEventListener("click", function (event) {
            event.preventDefault();

            if (typeof bootstrap === "undefined") {
                console.error("A biblioteca Bootstrap não foi carregada.");
                mostrarErro("Não foi possível abrir o menu de planilhas.");
                return;
            }

            bootstrap.Modal
                .getOrCreateInstance(modalElemento)
                .show();
        });

        const opcoes = modalElemento.querySelectorAll(".opcao-planilha");

        opcoes.forEach(function (opcao) {
            opcao.addEventListener("click", function (event) {
                event.preventDefault();

                const url = opcao.dataset.url;

                if (!url) {
                    console.error("URL da planilha não definida.", opcao);
                    mostrarErro("Não foi possível localizar o arquivo para download.");
                    return;
                }

                const link = document.createElement("a");
                link.href = url;
                link.style.display = "none";

                document.body.appendChild(link);
                link.click();
                link.remove();
            });
        });
    } else {
        console.warn("Botão ou modal de planilhas de exemplo não encontrado.");
    }

    // =========================================
    // 5. VALIDAR ELEMENTOS DA IMPORTAÇÃO
    // =========================================
    if (
        !btnAbrirPlanilha ||
        !inputPlanilha ||
        !tabela ||
        !progresso ||
        !textoProgresso ||
        !percentualProgresso ||
        !trilhoProgresso ||
        !preenchimentoProgresso
    ) {
        console.error(
            "Não foi possível inicializar a importação. Confira os IDs dos elementos e a classe .produtos-table."
        );
        return;
    }

    // =========================================
    // 6. ABRIR SELETOR DE ARQUIVOS
    // =========================================
    btnAbrirPlanilha.addEventListener("click", function () {
        if (!btnAbrirPlanilha.disabled) {
            inputPlanilha.click();
        }
    });

    // =========================================
    // 7. PREPARAR TABELA EM MEMÓRIA
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
    // 8. PROCESSAR LINHAS EM LOTES
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
    // 9. IMPORTAR PLANILHA
    // =========================================
    inputPlanilha.addEventListener("change", async function () {
        const arquivo = inputPlanilha.files[0];

        if (!arquivo) {
            return;
        }

        // Limpa totalmente qualquer importação prévia
        limparPlanilhaAnterior();

        btnAbrirPlanilha.disabled = true;

        try {
            // 9.1. Validar arquivo
            if (!arquivo.name.toLowerCase().endsWith(".xlsx")) {
                mostrarErro("Selecione um arquivo Excel no formato .xlsx.");
                return;
            }

            if (typeof XLSX === "undefined") {
                mostrarErro(
                    "Não foi possível carregar a biblioteca de leitura do Excel. Atualize a página e tente novamente."
                );
                return;
            }

            // 9.2. Iniciar progresso
            iniciarProgresso();
            await aguardarRenderizacao();

            atualizarProgresso(10, "Lendo o arquivo selecionado...");
            await aguardarRenderizacao();

            // 9.3. Ler arquivo Excel
            const buffer = await arquivo.arrayBuffer();

            atualizarProgresso(25, "Interpretando a planilha...");
            await aguardarRenderizacao();

            const workbook = XLSX.read(buffer, {
                type: "array",
                cellDates: true
            });

            const primeiraAba = workbook.SheetNames[0];

            if (!primeiraAba) {
                throw new Error("A planilha não possui uma aba para leitura.");
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

            // 9.4. Validar cabeçalhos
            const cabecalhos = linhas[0].map(function (valor) {
                return String(valor ?? "").trim();
            });

            const cabecalhosNormalizados = cabecalhos.map(normalizarCabecalho);

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

            const colunasAusentes = colunasObrigatorias.filter(function (coluna) {
                return !cabecalhosNormalizados.includes(
                    normalizarCabecalho(coluna)
                );
            });

            if (colunasAusentes.length > 0) {
                throw new Error(
                    "A planilha selecionada não corresponde ao modelo de produtos.\n\n" +
                    "Colunas ausentes:\n- " +
                    colunasAusentes.join("\n- ")
                );
            }

            // 9.5. Filtrar e organizar dados
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

            const indicesColunas = colunasObrigatorias.map(function (coluna) {
                return cabecalhosNormalizados.indexOf(
                    normalizarCabecalho(coluna)
                );
            });

            atualizarProgresso(55, "Preparando os produtos...");
            await aguardarRenderizacao();

            const dados = await processarLinhasEmLotes(
                linhasDados,
                indicesColunas
            );

            // 9.6. Preparar tabela em memória
            atualizarProgresso(93, "Preparando a tabela...");
            await aguardarRenderizacao();

            const novaTabela = prepararTabela(
                colunasObrigatorias,
                dados
            );

            // 9.7. Duração mínima
            atualizarProgresso(97, "Finalizando a importação...");
            await aguardarRenderizacao();

            await garantirDuracaoMinima();

            // 9.8. Renderizar exclusivamente os novos dados
            // =========================================
            // 9.8. RENDERIZAR EXCLUSIVAMENTE OS NOVOS DADOS
            // =========================================
            atualizarProgresso(100, "Importação concluída!");
            await aguardarRenderizacao();

            // Esvazia e injeta os novos nós diretamente
            tabela.innerHTML = "";
            tabela.appendChild(novaTabela.thead);
            tabela.appendChild(novaTabela.tbody);

            planilhaImportada = true;

            if (btnCadastroMassa) {
                btnCadastroMassa.disabled = false;
            }

            console.log(
                `Nova planilha carregada: ${dados.length} produto(s).`
            );

            await aguardar(TEMPO_MENSAGEM_FINAL);
            ocultarProgresso();

        } catch (erro) {
            console.error("Erro ao importar planilha:", erro);

            // Garante que a tabela continue limpa em caso de falha na importação
            limparPlanilhaAnterior();

            mostrarErro(
                erro.message ||
                "Não foi possível ler a planilha. Verifique se o arquivo está íntegro e tente novamente."
            );

            await aguardar(1500);
            ocultarProgresso();

        } finally {
            inputPlanilha.value = "";
            btnAbrirPlanilha.disabled = false;
        }
    });

    // =========================================
    // 10. RELATÓRIO E CADASTRO EM MASSA
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

        // Notificação conforme o resultado do processamento
        mostrarAlerta(
            resultado.cadastrados > 0
                ? `Concluído: ${resultado.cadastrados} cadastrado(s), ${resultado.rejeitados} rejeitado(s).`
                : "Nenhum produto foi cadastrado.",
            resultado.cadastrados > 0 ? "sucesso" : "erro"
        );
    }

    if (btnCadastroMassa) {
        btnCadastroMassa.addEventListener("click", async function () {
            if (!planilhaImportada) {
                mostrarAlerta("Importe uma planilha de produtos antes de realizar o cadastro em massa.","erro");
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

            const thead = tabela.querySelector("thead");
            const tbody = tabela.querySelector("tbody");

            if (!thead || !tbody) {
                mostrarAlerta("Não foi possível localizar a tabela de produtos.");
                return;
            }

            const cabecalhos = Array.from(
                thead.querySelectorAll("th")
            ).map(th => normalizarCabecalho(th.textContent));

            const indices = {
                nome: cabecalhos.indexOf(normalizarCabecalho("Produto")),
                quantidade: cabecalhos.indexOf(normalizarCabecalho("Quantidade")),
                valor_unitario: cabecalhos.indexOf(normalizarCabecalho("Valor Unitário")),
                desconto: cabecalhos.indexOf(normalizarCabecalho("Desconto")),
                data_cadastro: cabecalhos.indexOf(normalizarCabecalho("Data do Cadastro")),
                codigo: cabecalhos.indexOf(normalizarCabecalho("Código do Item")),
                cliente: cabecalhos.indexOf(normalizarCabecalho("Cliente")),
                descricao: cabecalhos.indexOf(normalizarCabecalho("Descrição"))
            };

            const indicesInvalidos = Object.values(indices).some(
                indice => indice < 0
            );

            if (indicesInvalidos) {
                mostrarAlerta("A tabela não corresponde ao modelo esperado de produtos.");
                return;
            }

            const linhasProdutos = Array.from(
                tbody.querySelectorAll("tr")
            ).filter(tr =>
                tr.querySelectorAll("td").length === cabecalhos.length
            );

            const produtos = [];

            const errosDesconto = [];

            linhasProdutos.forEach(function (tr, indice) {
                const celulas = Array.from(
                    tr.querySelectorAll("td")
                ).map(td => td.textContent.trim());

                const numeroLinha = indice + 2;

                const validacaoDesconto = validarDesconto(
                    celulas[indices.desconto],
                    numeroLinha
                );

                if (!validacaoDesconto.valido) {
                    errosDesconto.push(validacaoDesconto.mensagem);
                    return;
                }

                produtos.push({
                    nome: celulas[indices.nome],
                    quantidade: celulas[indices.quantidade],
                    valor_unitario: celulas[indices.valor_unitario],
                    desconto: validacaoDesconto.valor,
                    data_cadastro: celulas[indices.data_cadastro],
                    codigo: celulas[indices.codigo],
                    cliente: celulas[indices.cliente],
                    descricao: celulas[indices.descricao]
                });
            });

            if (errosDesconto.length > 0) {
                mostrarAlerta(
                    "Existem descontos inválidos na planilha:\n\n" +
                    errosDesconto.slice(0, 10).join("\n") +
                    (errosDesconto.length > 10
                        ? `\n\nE mais ${errosDesconto.length - 10} erro(s).`
                        : ""),
                    "erro"
                );

                return;
            }

            if (!produtos.length) {
                mostrarAlerta("Não há produtos para cadastrar.");
                return;
            }

            btnCadastroMassa.disabled = true;
            btnAbrirPlanilha.disabled = true;

            if (relatorioCadastroMassa) {
                relatorioCadastroMassa.hidden = true;
            }

            atualizarProgresso(0, "Enviando produtos para o servidor...");

            try {
                const csrfToken = document.cookie
                    .split("; ")
                    .find(cookie => cookie.startsWith("csrftoken="))
                    ?.split("=")
                    .slice(1)
                    .join("=");

                console.log("Total de produtos enviados:", produtos.length);
                console.table(produtos.slice(0, 10));

                const resposta = await fetch(btnCadastroMassa.dataset.url, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken || ""
                    },
                    body: JSON.stringify({ produtos })
                });

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
                btnAbrirPlanilha.disabled = false;
            }
        });
    }

    // =========================================
    // VALIDAR DESCONTO DA PLANILHA
    // =========================================
    function validarDesconto(valor, numeroLinha) {
        const texto = String(valor ?? "").trim();

        // Célula vazia equivale a 0%
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

});
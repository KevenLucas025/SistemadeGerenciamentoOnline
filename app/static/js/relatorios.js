document.addEventListener("DOMContentLoaded", function () {

    // =============================================
    // NAVEGAÇÃO DE ABAS
    // =============================================
    const botoesAbas = document.querySelectorAll(".btn-aba, [data-aba]");

    const paginas = {
        cliente_juridico: document.getElementById("abaRelatorioClientesJuridicos"),
        cliente_fisico: document.getElementById("abaRelatorioClientesFisicos"),
        usuarios: document.getElementById("abaRelatorioUsuarios"),
        bi: document.getElementById("abaRelatorioBI")
    };

    const titulos = {
        cliente_juridico: {
            titulo: "Relatórios de Clientes Jurídicos",
            descricao: "Gere relatórios personalizados dos clientes jurídicos cadastrados."
        },
        cliente_fisico: {
            titulo: "Relatórios de Clientes Físicos",
            descricao: "Gere relatórios personalizados dos clientes físicos cadastrados."
        },
        usuarios: {
            titulo: "Relatórios de Usuários",
            descricao: "Gere relatórios e consulte informações dos usuários do sistema."
        },
        bi: {
            titulo: "BI - Relatórios",
            descricao: "Acompanhe indicadores, métricas e análises do sistema."
        }
    };

    botoesAbas.forEach(botao => {
        botao.addEventListener("click", function () {
            const abaSelecionada = this.dataset.aba;

            if (!paginas[abaSelecionada] || !titulos[abaSelecionada]) return;

            botoesAbas.forEach(btn => btn.classList.remove("ativo"));

            Object.values(paginas).forEach(pagina => {
                if (pagina) pagina.classList.remove("ativa");
            });

            this.classList.add("ativo");
            paginas[abaSelecionada].classList.add("ativa");

            const tituloPagina = document.getElementById("tituloPaginaRelatorio");
            const descricaoPagina = document.getElementById("descricaoPaginaRelatorio");

            if (tituloPagina) tituloPagina.textContent = titulos[abaSelecionada].titulo;
            if (descricaoPagina) descricaoPagina.textContent = titulos[abaSelecionada].descricao;
        });
    });

    // =============================================
    // AUXILIARES
    // =============================================
    function escaparHTML(valor) {
        return String(valor ?? '-').replace(/[&<>"']/g, caractere => {
            const caracteres = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return caracteres[caractere];
        });
    }

    // =============================================
    // ABA: CLIENTES JURÍDICOS
    // =============================================
    const wrapperJuridico = document.querySelector('#abaRelatorioClientesJuridicos .popover-exportar-wrapper');
    const btnTriggerJuridico = document.getElementById('btnTriggerBaixar');
    const popoverCardJuridico = document.getElementById('popoverBaixarCard');
    const btnConfirmarDownloadJuridico = document.getElementById('btnConfirmarDownload');
    const opcoesFormatoJuridico = wrapperJuridico ? wrapperJuridico.querySelectorAll('.btn-formato-opcao') : [];

    let formatoSelecionadoJuridico = 'csv';
    let resultadosJuridicosAtuais = [];

    const campoDataInicialJuridico = document.getElementById('dataInicialJuridico');
    const campoDataFinalJuridico = document.getElementById('dataFinalJuridico');
    const containerFiltrosJuridicos = document.getElementById('filtrosRelatorioJuridicos');
    const tbodyJuridicos = document.getElementById('tbodyClientesJuridicos');
    const totalClientesJuridicos = document.getElementById('totalClientesJuridicos');
    const totalPessoaJuridica = document.getElementById('totalPessoaJuridica');
    const valorMovimentadoJuridicos = document.getElementById('valorMovimentadoJuridicos');
    const infoPaginacaoJuridicos = document.getElementById('infoPaginacaoJuridicos');
    const paginacaoJuridicos = document.getElementById('paginacaoJuridicos');

    const campoStatusJuridico = document.getElementById('statusClienteJuridico');
    const campoCategoriaJuridico = document.getElementById('categoriaClienteJuridico');
    const campoCidadeJuridico = document.getElementById('cidadeClienteJuridico');
    const campoEstadoJuridico = document.getElementById('estadoClienteJuridico');
    const campoPesquisaJuridico = document.getElementById('pesquisaClienteJuridico');
    const campoOrdenarJuridicos = document.getElementById('ordenarClientesJuridicos');
    const camposOrdemJuridicos = document.querySelectorAll('input[name="ordem_juridicos"]');

    const masterJuridicos = document.getElementById('masterInformacoesRelatorioJuridicos');
    const gridColunasJuridicos = document.getElementById('checkboxGridInformacoesJuridicos');


    const colunasJuridicos = [
        { chave: 'nome_razao_social', titulo: 'NOME / RAZÃO SOCIAL', render: c => escaparHTML(c.nome) },
        { chave: 'nome_tipo', titulo: 'TIPO', render: () => `<span class="badge-tipo juridico">Jurídico</span>` },
        { chave: 'nome_categoria', titulo: 'CATEGORIA', render: c => escaparHTML(c.categoria) },
        { chave: 'nome_cnpj', titulo: 'CNPJ', render: c => escaparHTML(c.cnpj) },
        { chave: 'nome_email', titulo: 'E-MAIL', render: c => escaparHTML(c.email) },
        { chave: 'nome_telefone', titulo: 'TELEFONE / WHATSAPP', render: c => escaparHTML(c.telefone) },
        { chave: 'nome_cidade', titulo: 'CIDADE / ESTADO', render: c => `${escaparHTML(c.cidade)} / ${escaparHTML(c.estado)}` },
        {
            chave: 'nome_status',
            titulo: 'STATUS',
            render: c => {
                const status = String(c.status || 'Inativo').toLowerCase();
                const classeStatus = status === 'ativo' ? 'ativo' : 'inativo';
                return `<span class="badge-status ${classeStatus}">${escaparHTML(status.toUpperCase())}</span>`;
            }
        },
        { chave: 'nome_data_cadastro', titulo: 'DATA DO CADASTRO', render: c => escaparHTML(c.data_inclusao) },
        { chave: 'nome_valor_gasto_total', titulo: 'VALOR GASTO TOTAL', render: c => `R$ ${escaparHTML(c.valor_gasto)}` },
        { chave: 'nome_ultima_compra', titulo: 'ÚLTIMA COMPRA', render: c => escaparHTML(c.ultima_compra) }
    ];

    function obterColunasSelecionadasJuridicos() {
        if (!gridColunasJuridicos) return [];
        return Array.from(gridColunasJuridicos.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    }

    function renderizarTabelaJuridicos(resultados) {
        if (!tbodyJuridicos) return;

        const selecionadas = obterColunasSelecionadasJuridicos();
        const colunasVisiveis = colunasJuridicos.filter(coluna => selecionadas.includes(coluna.chave));
        const tabela = tbodyJuridicos.closest('table');
        const linhaCabecalho = tabela?.querySelector('thead tr');

        if (linhaCabecalho) {
            linhaCabecalho.innerHTML = colunasVisiveis.map(coluna => `<th>${coluna.titulo}</th>`).join('');
        }

        if (colunasVisiveis.length === 0) {
            tbodyJuridicos.innerHTML = `<tr><td colspan="1" style="text-align: center; padding: 20px;">Selecione pelo menos uma coluna para visualizar.</td></tr>`;
            return;
        }

        if (!resultados.length) {
            tbodyJuridicos.innerHTML = `<tr><td colspan="${colunasVisiveis.length}" style="text-align: center; padding: 20px;">Nenhum cliente jurídico encontrado.</td></tr>`;
            return;
        }

        tbodyJuridicos.innerHTML = resultados.map(cliente => {
            const celulas = colunasVisiveis.map(coluna => `<td>${coluna.render(cliente)}</td>`).join('');
            return `<tr>${celulas}</tr>`;
        }).join('');
    }

    function renderizarPaginacaoJuridicos(paginacao) {
        if (!paginacaoJuridicos) return;

        const anterior = paginacao.tem_anterior
            ? `<button type="button" class="btn-paginacao" data-page="${paginacao.pagina_anterior}"><i class="fa-solid fa-chevron-left"></i></button>`
            : `<button type="button" class="btn-paginacao" disabled><i class="fa-solid fa-chevron-left"></i></button>`;

        const proxima = paginacao.tem_proxima
            ? `<button type="button" class="btn-paginacao" data-page="${paginacao.pagina_proxima}"><i class="fa-solid fa-chevron-right"></i></button>`
            : `<button type="button" class="btn-paginacao" disabled><i class="fa-solid fa-chevron-right"></i></button>`;

        const numeros = paginacao.intervalo.map(numero => {
            if (numero === '…') return `<span class="btn-paginacao">…</span>`;
            if (Number(numero) === paginacao.pagina_atual) return `<span class="btn-paginacao ativo">${numero}</span>`;
            return `<button type="button" class="btn-paginacao" data-page="${numero}">${numero}</button>`;
        }).join('');

        paginacaoJuridicos.innerHTML = `${anterior}${numeros}${proxima}`;
    }

    function atualizarResumoJuridicos(dados) {
        if (totalClientesJuridicos) totalClientesJuridicos.textContent = dados.total_clientes;
        if (totalPessoaJuridica) totalPessoaJuridica.textContent = dados.total_clientes;
        if (valorMovimentadoJuridicos) valorMovimentadoJuridicos.textContent = `R$ ${dados.valor_movimentado}`;
        if (infoPaginacaoJuridicos) {
            infoPaginacaoJuridicos.textContent = dados.total_clientes > 0
                ? `Mostrando ${dados.paginacao.inicio} a ${dados.paginacao.fim} de ${dados.total_clientes}`
                : 'Nenhum cliente jurídico encontrado';
        }
    }

    async function carregarClientesJuridicos(pagina = 1) {
        if (!containerFiltrosJuridicos || !tbodyJuridicos) return;

        const url = containerFiltrosJuridicos.dataset.url;
        if (!url || url.includes('undefined')) return;

        const dataInicial = campoDataInicialJuridico?.value || '';
        const dataFinal = campoDataFinalJuridico?.value || '';

        if (dataInicial && dataFinal && dataInicial > dataFinal) {
            mostrarAlerta('A data inicial não pode ser maior que a data final.',"erro");
            return;
        }

        const parametros = new URLSearchParams({
            data_inicial: dataInicial,
            data_final: dataFinal,
            status: campoStatusJuridico?.value || 'todos',
            categoria: campoCategoriaJuridico?.value || 'todos',
            cidade: campoCidadeJuridico?.value.trim() || '',
            estado: campoEstadoJuridico?.value || '',
            pesquisa: campoPesquisaJuridico?.value.trim() || '',
            ordenar_por: campoOrdenarJuridicos?.value || 'razao_social',
            ordem: document.querySelector('input[name="ordem_juridicos"]:checked')?.value || 'asc',
            page: pagina
        });

        try {
            tbodyJuridicos.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando resultados...</td></tr>`;

            const resposta = await fetch(`${url}?${parametros.toString()}`, {
                method: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.erro || 'Erro ao filtrar clientes.');

            resultadosJuridicosAtuais = dados.resultados;
            renderizarTabelaJuridicos(resultadosJuridicosAtuais);
            atualizarResumoJuridicos(dados);
            renderizarPaginacaoJuridicos(dados.paginacao);
        } catch (erro) {
            console.error('Erro ao filtrar clientes jurídicos:', erro);
            tbodyJuridicos.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 20px;">Não foi possível carregar os resultados.</td></tr>`;
        }
    }

    // Eventos - Jurídico
    if (btnTriggerJuridico && wrapperJuridico) {
        btnTriggerJuridico.addEventListener('click', (e) => {
            e.stopPropagation();
            wrapperJuridico.classList.toggle('ativo');
        });
    }

    if (popoverCardJuridico) {
        popoverCardJuridico.addEventListener('click', (e) => e.stopPropagation());
    }

    opcoesFormatoJuridico.forEach(btn => {
        btn.addEventListener('click', function () {
            opcoesFormatoJuridico.forEach(b => b.classList.remove('ativo'));
            this.classList.add('ativo');
            formatoSelecionadoJuridico = this.dataset.formato;
        });
    });

    if (btnConfirmarDownloadJuridico) {
        btnConfirmarDownloadJuridico.addEventListener('click', async function () {
            const urlExportacao = wrapperJuridico?.dataset.url;
            const colunasSelecionadas = obterColunasSelecionadasJuridicos();

            if (!colunasSelecionadas.length) {
                mostrarAlerta('Selecione pelo menos uma coluna para exportar.',"erro");
                return;
            }

            const parametros = new URLSearchParams({
                formato: formatoSelecionadoJuridico,
                data_inicial: campoDataInicialJuridico?.value || '',
                data_final: campoDataFinalJuridico?.value || '',
                status: campoStatusJuridico?.value || 'todos',
                categoria: campoCategoriaJuridico?.value || 'todos',
                cidade: campoCidadeJuridico?.value.trim() || '',
                estado: campoEstadoJuridico?.value || '',
                pesquisa: campoPesquisaJuridico?.value.trim() || '',
                ordenar_por: campoOrdenarJuridicos?.value || 'razao_social',
                ordem: document.querySelector('input[name="ordem_juridicos"]:checked')?.value || 'asc'
            });

            colunasSelecionadas.forEach(coluna => parametros.append('colunas', coluna));

            try {
                btnConfirmarDownloadJuridico.disabled = true;
                btnConfirmarDownloadJuridico.textContent = 'Preparando arquivo...';

                const resposta = await fetch(`${urlExportacao}?${parametros.toString()}`, {
                    method: 'GET',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });

                if (!resposta.ok) {
                    const erro = await resposta.json();
                    throw new Error(erro.erro || 'Não foi possível gerar o arquivo.');
                }

                const arquivo = await resposta.blob();
                const contentDisposition = resposta.headers.get('Content-Disposition');
                let nomeArquivo = `clientes_juridicos.${formatoSelecionadoJuridico}`;

                if (contentDisposition) {
                    const correspondencia = contentDisposition.match(/filename="?([^";]+)"?/i);
                    if (correspondencia) nomeArquivo = correspondencia[1];
                }

                const urlArquivo = URL.createObjectURL(arquivo);
                const link = document.createElement('a');
                link.href = urlArquivo;
                link.download = nomeArquivo;
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(urlArquivo), 1000);
                wrapperJuridico.classList.remove('ativo');
            } catch (erro) {
                console.error('Erro ao exportar relatório:', erro);
                alert(erro.message);
            } finally {
                btnConfirmarDownloadJuridico.disabled = false;
                btnConfirmarDownloadJuridico.textContent = 'Baixar';
            }
        });
    }

    if (masterJuridicos && gridColunasJuridicos) {
        const checkboxesJuridicos = gridColunasJuridicos.querySelectorAll('input[type="checkbox"]');
        masterJuridicos.addEventListener('change', function () {
            checkboxesJuridicos.forEach(checkbox => checkbox.checked = this.checked);
            masterJuridicos.indeterminate = false;
            renderizarTabelaJuridicos(resultadosJuridicosAtuais);
        });
    }

    if (gridColunasJuridicos) {
        const checkboxesColunas = gridColunasJuridicos.querySelectorAll('input[type="checkbox"]');
        checkboxesColunas.forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const totalSelecionados = Array.from(checkboxesColunas).filter(c => c.checked).length;
                if (masterJuridicos) {
                    masterJuridicos.checked = totalSelecionados === checkboxesColunas.length;
                    masterJuridicos.indeterminate = totalSelecionados > 0 && totalSelecionados < checkboxesColunas.length;
                }
                renderizarTabelaJuridicos(resultadosJuridicosAtuais);
            });
        });
    }

    [campoDataInicialJuridico, campoDataFinalJuridico, campoStatusJuridico, campoCategoriaJuridico, campoEstadoJuridico, campoOrdenarJuridicos].forEach(el => {
        el?.addEventListener('change', () => carregarClientesJuridicos(1));
    });

    [campoCidadeJuridico, campoPesquisaJuridico].forEach(el => {
        el?.addEventListener('input', () => carregarClientesJuridicos(1));
    });

    camposOrdemJuridicos.forEach(radio => radio.addEventListener('change', () => carregarClientesJuridicos(1)));

    if (paginacaoJuridicos) {
        paginacaoJuridicos.addEventListener('click', function (e) {
            const elemento = e.target.closest('[data-page], a[href*="page_juridicos"]');
            if (!elemento) return;
            e.preventDefault();
            const pagina = elemento.dataset.page ? Number(elemento.dataset.page) : Number(new URL(elemento.href).searchParams.get('page_juridicos'));
            if (pagina > 0) carregarClientesJuridicos(pagina);
        });
    }

    // =============================================
    // ABA: CLIENTES FÍSICOS
    // =============================================
    const containerFiltrosFisicos = document.getElementById('filtrosRelatorioFisicos');
    const tbodyFisicos = document.getElementById('tbodyClientesFisicos');
    const totalClientesFisicos = document.getElementById('totalClientesFisicos');
    const totalPessoaFisica = document.getElementById('totalPessoaFisica');
    const valorMovimentadoFisicos = document.getElementById('valorMovimentadoFisicos');
    const infoPaginacaoFisicos = document.getElementById('infoPaginacaoFisicos');
    const paginacaoFisicos = document.getElementById('paginacaoFisicos');

    const campoDataInicialFisico = document.getElementById('dataInicialFisico');
    const campoDataFinalFisico = document.getElementById('dataFinalFisico');
    const campoStatusFisico = document.getElementById('statusClienteFisico');
    const campoCidadeFisico = document.getElementById('cidadeClienteFisico');
    const campoEstadoFisico = document.getElementById('estadoClienteFisico');
    const campoPesquisaFisico = document.getElementById('pesquisaClienteFisico');
    const campoOrdenarFisicos = document.getElementById('ordenarClientesFisicos');
    const camposOrdemFisicos = document.querySelectorAll('input[name="ordem_fisicos"]');

    const masterFisicos = document.getElementById('masterInformacoesRelatorioFisicos');
    const gridColunasFisicos = document.getElementById('checkboxGridInformacoesFisicos');
    const wrapperFisicos = document.getElementById('popoverExportarFisicos');
    const btnTriggerFisicos = document.getElementById('btnTriggerBaixarFisicos');
    const popoverCardFisicos = document.getElementById('popoverBaixarCardFisicos');
    const btnConfirmarDownloadFisicos = document.getElementById('btnConfirmarDownloadFisicos');
    const opcoesFormatoFisicos = wrapperFisicos ? wrapperFisicos.querySelectorAll('.btn-formato-opcao') : [];

    let resultadosFisicosAtuais = [];
    let formatoSelecionadoFisicos = 'csv';

    const colunasFisicos = [
        { chave: 'nome', titulo: 'NOME', render: c => escaparHTML(c.nome) },
        { chave: 'tipo', titulo: 'TIPO', render: () => `<span class="badge-tipo fisico">Físico</span>` },
        { chave: 'cpf', titulo: 'CPF', render: c => escaparHTML(c.cpf) },
        { chave: 'email', titulo: 'E-MAIL', render: c => escaparHTML(c.email) },
        { chave: 'telefone', titulo: 'TELEFONE / WHATSAPP', render: c => escaparHTML(c.telefone) },
        { chave: 'cidade_estado', titulo: 'CIDADE / ESTADO', render: c => `${escaparHTML(c.cidade)} / ${escaparHTML(c.estado)}` },
        {
            chave: 'status',
            titulo: 'STATUS',
            render: c => {
                const status = String(c.status || 'Inativo').toLowerCase();
                const classeStatus = status === 'ativo' ? 'ativo' : 'inativo';
                return `<span class="badge-status ${classeStatus}">${escaparHTML(status.toUpperCase())}</span>`;
            }
        },
        { chave: 'data_cadastro', titulo: 'DATA DO CADASTRO', render: c => escaparHTML(c.data_inclusao) },
        { chave: 'valor_gasto_total', titulo: 'VALOR GASTO TOTAL', render: c => `R$ ${escaparHTML(c.valor_gasto)}` },
        { chave: 'ultima_compra', titulo: 'ÚLTIMA COMPRA', render: c => escaparHTML(c.ultima_compra) }
    ];

    function obterColunasSelecionadasFisicos() {
        if (!gridColunasFisicos) return [];
        return Array.from(gridColunasFisicos.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    }

    function renderizarTabelaFisicos(resultados) {
        if (!tbodyFisicos) return;

        const selecionadas = obterColunasSelecionadasFisicos();
        const colunasVisiveis = colunasFisicos.filter(coluna => selecionadas.includes(coluna.chave));
        const tabela = tbodyFisicos.closest('table');
        const linhaCabecalho = tabela?.querySelector('thead tr');

        if (linhaCabecalho) {
            linhaCabecalho.innerHTML = colunasVisiveis.map(coluna => `<th>${coluna.titulo}</th>`).join('');
        }

        if (colunasVisiveis.length === 0) {
            tbodyFisicos.innerHTML = `<tr><td colspan="1" style="text-align: center; padding: 20px;">Selecione pelo menos uma coluna para visualizar.</td></tr>`;
            return;
        }

        if (!resultados.length) {
            tbodyFisicos.innerHTML = `<tr><td colspan="${colunasVisiveis.length}" style="text-align: center; padding: 20px;">Nenhum cliente físico encontrado.</td></tr>`;
            return;
        }

        tbodyFisicos.innerHTML = resultados.map(cliente => {
            const celulas = colunasVisiveis.map(coluna => `<td>${coluna.render(cliente)}</td>`).join('');
            return `<tr>${celulas}</tr>`;
        }).join('');
    }

    function renderizarPaginacaoFisicos(paginacao) {
        if (!paginacaoFisicos) return;

        const anterior = paginacao.tem_anterior
            ? `<button type="button" class="btn-paginacao" data-page="${paginacao.pagina_anterior}"><i class="fa-solid fa-chevron-left"></i></button>`
            : `<button type="button" class="btn-paginacao" disabled><i class="fa-solid fa-chevron-left"></i></button>`;

        const proxima = paginacao.tem_proxima
            ? `<button type="button" class="btn-paginacao" data-page="${paginacao.pagina_proxima}"><i class="fa-solid fa-chevron-right"></i></button>`
            : `<button type="button" class="btn-paginacao" disabled><i class="fa-solid fa-chevron-right"></i></button>`;

        const numeros = paginacao.intervalo.map(numero => {
            if (numero === '…') return `<span class="btn-paginacao">…</span>`;
            if (Number(numero) === paginacao.pagina_atual) return `<span class="btn-paginacao ativo">${numero}</span>`;
            return `<button type="button" class="btn-paginacao" data-page="${numero}">${numero}</button>`;
        }).join('');

        paginacaoFisicos.innerHTML = `${anterior}${numeros}${proxima}`;
    }

    function atualizarResumoFisicos(dados) {
        if (totalClientesFisicos) totalClientesFisicos.textContent = dados.total_clientes;
        if (totalPessoaFisica) totalPessoaFisica.textContent = dados.total_pessoa_fisica;
        if (valorMovimentadoFisicos) valorMovimentadoFisicos.textContent = `R$ ${dados.valor_movimentado}`;
        if (infoPaginacaoFisicos) {
            infoPaginacaoFisicos.textContent = dados.total_clientes > 0
                ? `Mostrando ${dados.paginacao.inicio} a ${dados.paginacao.fim} de ${dados.total_clientes}`
                : 'Nenhum cliente físico encontrado';
        }
    }

    async function carregarClientesFisicos(pagina = 1) {
        if (!containerFiltrosFisicos || !tbodyFisicos) return;

        const url = containerFiltrosFisicos.dataset.url;
        if (!url || url.includes('undefined')) return;

        const dataInicial = campoDataInicialFisico?.value || '';
        const dataFinal = campoDataFinalFisico?.value || '';

        if (dataInicial && dataFinal && dataInicial > dataFinal) {
            mostrarAlerta('A data inicial não pode ser maior que a data final.',"erro");
            return;
        }

        const parametros = new URLSearchParams({
            data_inicial: dataInicial,
            data_final: dataFinal,
            status: campoStatusFisico?.value || 'todos',
            cidade: campoCidadeFisico?.value.trim() || '',
            estado: campoEstadoFisico?.value || '',
            pesquisa: campoPesquisaFisico?.value.trim() || '',
            ordenar_por: campoOrdenarFisicos?.value || 'nome',
            ordem: document.querySelector('input[name="ordem_fisicos"]:checked')?.value || 'asc',
            page: pagina
        });

        try {
            tbodyFisicos.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando resultados...</td></tr>`;

            const resposta = await fetch(`${url}?${parametros.toString()}`, {
                method: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.erro || 'Erro ao filtrar clientes físicos.');

            resultadosFisicosAtuais = dados.resultados;
            renderizarTabelaFisicos(resultadosFisicosAtuais);
            atualizarResumoFisicos(dados);
            renderizarPaginacaoFisicos(dados.paginacao);
        } catch (erro) {
            console.error('Erro ao filtrar clientes físicos:', erro);
            tbodyFisicos.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 20px;">Não foi possível carregar os resultados.</td></tr>`;
        }
    }

    // Eventos - Físico
    if (btnTriggerFisicos && wrapperFisicos) {
        btnTriggerFisicos.addEventListener('click', function (e) {
            e.stopPropagation();
            wrapperFisicos.classList.toggle('ativo');
        });
    }

    if (popoverCardFisicos) {
        popoverCardFisicos.addEventListener('click', e => e.stopPropagation());
    }

    opcoesFormatoFisicos.forEach(btn => {
        btn.addEventListener('click', function () {
            opcoesFormatoFisicos.forEach(opcao => opcao.classList.remove('ativo'));
            this.classList.add('ativo');
            formatoSelecionadoFisicos = this.dataset.formato;
        });
    });

    if (btnConfirmarDownloadFisicos) {
        btnConfirmarDownloadFisicos.addEventListener('click', async function () {
            const urlExportacao = wrapperFisicos?.dataset.url;
            const colunasSelecionadas = obterColunasSelecionadasFisicos();

            if (!urlExportacao || !colunasSelecionadas.length) {
                mostrarAlerta(!urlExportacao ? 'URL não encontrada.' : 'Selecione pelo menos uma coluna.',"erro");
                return;
            }

            const parametros = new URLSearchParams({
                data_inicial: campoDataInicialFisico?.value || '',
                data_final: campoDataFinalFisico?.value || '',
                status: campoStatusFisico?.value || 'todos',
                cidade: campoCidadeFisico?.value.trim() || '',
                estado: campoEstadoFisico?.value || '',
                pesquisa: campoPesquisaFisico?.value.trim() || '',
                ordenar_por: campoOrdenarFisicos?.value || 'nome',
                ordem: document.querySelector('input[name="ordem_fisicos"]:checked')?.value || 'asc',
                formato: formatoSelecionadoFisicos
            });

            colunasSelecionadas.forEach(coluna => parametros.append('colunas', coluna));

            try {
                btnConfirmarDownloadFisicos.disabled = true;
                btnConfirmarDownloadFisicos.textContent = 'Preparando arquivo...';

                const resposta = await fetch(`${urlExportacao}?${parametros.toString()}`, {
                    method: 'GET',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });

                if (!resposta.ok) throw new Error('Não foi possível gerar o arquivo.');

                const arquivo = await resposta.blob();
                const contentDisposition = resposta.headers.get('Content-Disposition');
                let nomeArquivo = `clientes_fisicos.${formatoSelecionadoFisicos}`;

                if (contentDisposition) {
                    const correspondencia = contentDisposition.match(/filename="?([^";]+)"?/i);
                    if (correspondencia) nomeArquivo = correspondencia[1];
                }

                const urlArquivo = URL.createObjectURL(arquivo);
                const link = document.createElement('a');
                link.href = urlArquivo;
                link.download = nomeArquivo;
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(urlArquivo), 1000);
                wrapperFisicos.classList.remove('ativo');
            } catch (erro) {
                console.error('Erro ao exportar:', erro);
                alert(erro.message);
            } finally {
                btnConfirmarDownloadFisicos.disabled = false;
                btnConfirmarDownloadFisicos.textContent = 'Baixar';
            }
        });
    }

    if (masterFisicos && gridColunasFisicos) {
        const checkboxesFisicos = gridColunasFisicos.querySelectorAll('input[type="checkbox"]');
        masterFisicos.addEventListener('change', function () {
            checkboxesFisicos.forEach(cb => cb.checked = this.checked);
            masterFisicos.indeterminate = false;
            renderizarTabelaFisicos(resultadosFisicosAtuais);
        });
    }

    if (gridColunasFisicos) {
        const checkboxesFisicos = gridColunasFisicos.querySelectorAll('input[type="checkbox"]');
        checkboxesFisicos.forEach(cb => {
            cb.addEventListener('change', function () {
                const totalSelecionados = Array.from(checkboxesFisicos).filter(c => c.checked).length;
                if (masterFisicos) {
                    masterFisicos.checked = totalSelecionados === checkboxesFisicos.length;
                    masterFisicos.indeterminate = totalSelecionados > 0 && totalSelecionados < checkboxesFisicos.length;
                }
                renderizarTabelaFisicos(resultadosFisicosAtuais);
            });
        });
    }

    [campoDataInicialFisico, campoDataFinalFisico, campoStatusFisico, campoEstadoFisico, campoOrdenarFisicos].forEach(el => {
        el?.addEventListener('change', () => carregarClientesFisicos(1));
    });

    [campoCidadeFisico, campoPesquisaFisico].forEach(el => {
        el?.addEventListener('input', () => carregarClientesFisicos(1));
    });

    camposOrdemFisicos.forEach(radio => radio.addEventListener('change', () => carregarClientesFisicos(1)));

    if (paginacaoFisicos) {
        paginacaoFisicos.addEventListener('click', function (e) {
            const elemento = e.target.closest('[data-page]');
            if (!elemento) return;
            e.preventDefault();
            const pagina = Number(elemento.dataset.page);
            if (pagina > 0) carregarClientesFisicos(pagina);
        });
    }

    // FECHAR POPOVERS AO CLICAR FORA
    document.addEventListener('click', () => {
        wrapperJuridico?.classList.remove('ativo');
        wrapperFisicos?.classList.remove('ativo');
    });

    

    
    // =============================================
    // ABA: USUÁRIOS
    // =============================================

    const containerFiltrosUsuarios = document.getElementById("filtrosRelatorioUsuarios");
    const tbodyUsuarios = document.getElementById("tbodyUsuarios");
    const theadUsuarios = document.getElementById("theadUsuarios");

    const totalUsuarios = document.getElementById("totalUsuarios");
    const totalUsuariosAtivos = document.getElementById("totalUsuariosAtivos");
    const totalUsuariosInativos = document.getElementById("totalUsuariosInativos");

    const infoPaginacaoUsuarios = document.getElementById("infoPaginacaoUsuarios");
    const paginacaoUsuarios = document.getElementById("paginacaoUsuarios");

    const dataInicialUsuario = document.getElementById("dataInicialUsuario");
    const dataFinalUsuario = document.getElementById("dataFinalUsuario");
    const statusUsuario = document.getElementById("statusUsuario");
    const conexaoUsuario = document.getElementById("conexaoUsuario");
    const acessoUsuario = document.getElementById("acessoUsuario");
    const pesquisaUsuario = document.getElementById("pesquisaUsuario");

    const ordenarUsuarios = document.getElementById("ordenarUsuarios");
    const masterUsuarios = document.getElementById("masterInformacoesRelatorioUsuarios");
    const gridUsuarios = document.getElementById("checkboxGridInformacoesUsuarios");

    const wrapperUsuarios = document.getElementById("popoverExportarUsuarios");
    const btnTriggerUsuarios = document.getElementById("btnTriggerBaixarUsuarios");
    const popoverCardUsuarios = document.getElementById("popoverBaixarCardUsuarios");
    const btnConfirmarUsuarios = document.getElementById("btnConfirmarDownloadUsuarios");

    const secaoRelatorioUsuarios = document.getElementById("filtrosRelatorioUsuarios");

    const urlAlterarStatus = secaoRelatorioUsuarios.dataset.urlAlterarStatus;

    const menuStatusTempo = document.getElementById("menuStatusTempo");

    let usuarioSelecionadoStatus = null;

    // =============================================
    // MODAL - TEMPO DE CONEXÃO
    // =============================================

    const elementoModalTempo = document.getElementById(
        "modalTempoConexaoUsuarios"
    );

    const modalTempoConexao = elementoModalTempo
        ? bootstrap.Modal.getOrCreateInstance(elementoModalTempo)
        : null;

    const opcoesFormatoUsuarios = wrapperUsuarios
        ? wrapperUsuarios.querySelectorAll(".btn-formato-opcao")
        : [];

    let resultadosUsuariosAtuais = [];
    let formatoSelecionadoUsuarios = "csv";

    const colunasUsuarios = [
        { chave: "nome", titulo: "NOME COMPLETO", render: u => escaparHTML(u.nome) },
        { chave: "username", titulo: "USUÁRIO", render: u => escaparHTML(u.username) },
        { chave: "email", titulo: "E-MAIL", render: u => escaparHTML(u.email) },
        { chave: "telefone", titulo: "TELEFONE", render: u => escaparHTML(u.telefone) },
        { chave: "cpf", titulo: "CPF", render: u => escaparHTML(u.cpf) },
        { chave: "cnpj", titulo: "CNPJ", render: u => escaparHTML(u.cnpj) },
        { chave: "rg", titulo: "RG", render: u => escaparHTML(u.rg) },
        { chave: "acesso", titulo: "ACESSO", render: u => escaparHTML(u.acesso) },
        {
            chave: "status",
            titulo: "STATUS DA CONTA",
            render: u => {
                const status = String(u.status || "Inativo").toLowerCase();
                const classe = status === "ativo" ? "ativo" : "inativo";

                return `<span class="badge-status ${classe}">
                    ${escaparHTML(status.toUpperCase())}
                </span>`;
            }
        },
        {
            chave: "status_conexao",
            titulo: "STATUS DE CONEXÃO",
            render: u => renderizarBadgeConexao(u.status_conexao)
        },
        { chave: "cidade", titulo: "CIDADE", render: u => escaparHTML(u.cidade) },
        { chave: "estado", titulo: "ESTADO", render: u => escaparHTML(u.estado) },
        { chave: "data_cadastro", titulo: "DATA DO CADASTRO", render: u => escaparHTML(u.data_cadastro) },
        { chave: "data_nascimento", titulo: "DATA DE NASCIMENTO", render: u => escaparHTML(u.data_nascimento) }
    ];

    function obterColunasSelecionadasUsuarios() {
        if (!gridUsuarios) return [];

        return Array.from(
            gridUsuarios.querySelectorAll('input[type="checkbox"]:checked')
        ).map(cb => cb.value);
    }

    function renderizarTabelaUsuarios(resultados) {
        if (!tbodyUsuarios || !theadUsuarios) return;

        const selecionadas = obterColunasSelecionadasUsuarios();

        const colunasVisiveis = colunasUsuarios.filter(
            coluna => selecionadas.includes(coluna.chave)
        );

        theadUsuarios.innerHTML = `
            <tr>
                ${colunasVisiveis.map(coluna => `<th>${coluna.titulo}</th>`).join("")}
            </tr>
        `;

        if (!colunasVisiveis.length) {
            tbodyUsuarios.innerHTML = `
                <tr>
                    <td colspan="1" style="text-align:center;padding:20px;">
                        Selecione pelo menos uma coluna.
                    </td>
                </tr>
            `;
            return;
        }

        if (!resultados.length) {
            tbodyUsuarios.innerHTML = `
                <tr>
                    <td colspan="${colunasVisiveis.length}" style="text-align:center;padding:20px;">
                        Nenhum usuário encontrado.
                    </td>
                </tr>
            `;
            return;
        }

        tbodyUsuarios.innerHTML = resultados.map(usuario => {
            const celulas = colunasVisiveis.map(
                coluna => `<td>${coluna.render(usuario)}</td>`
            ).join("");

            return `<tr>${celulas}</tr>`;
        }).join("");
    }

    function renderizarBadgeConexao(status) {
        const statusNormalizado = (status || "offline").toLowerCase();

        const configuracoes = {
            online: {
                classe: "online",
                texto: "Online"
            },
            ausente: {
                classe: "ausente",
                texto: "Ausente"
            },
            offline: {
                classe: "offline",
                texto: "Offline"
            }
        };

        const config = configuracoes[statusNormalizado] || configuracoes.offline;

        return `
            <span class="badge-conexao ${config.classe}">
                ${config.texto}
            </span>
        `;
    }

    function renderizarPaginacaoUsuarios(paginacao) {
        if (!paginacaoUsuarios) return;

        const anterior = paginacao.tem_anterior
            ? `<button type="button" class="btn-paginacao" data-page="${paginacao.pagina_anterior}">
                <i class="fa-solid fa-chevron-left"></i>
            </button>`
            : `<button type="button" class="btn-paginacao" disabled>
                <i class="fa-solid fa-chevron-left"></i>
            </button>`;

        const proxima = paginacao.tem_proxima
            ? `<button type="button" class="btn-paginacao" data-page="${paginacao.pagina_proxima}">
                <i class="fa-solid fa-chevron-right"></i>
            </button>`
            : `<button type="button" class="btn-paginacao" disabled>
                <i class="fa-solid fa-chevron-right"></i>
            </button>`;

        const numeros = paginacao.intervalo.map(numero => {
            if (numero === "…") {
                return `<span class="btn-paginacao">…</span>`;
            }

            if (Number(numero) === paginacao.pagina_atual) {
                return `<span class="btn-paginacao ativo">${numero}</span>`;
            }

            return `<button type="button" class="btn-paginacao" data-page="${numero}">
                ${numero}
            </button>`;
        }).join("");

        paginacaoUsuarios.innerHTML = anterior + numeros + proxima;
    }

    function atualizarResumoUsuarios(dados) {
        if (totalUsuarios) {
            totalUsuarios.textContent = dados.total_usuarios;
        }

        if (totalUsuariosAtivos) {
            totalUsuariosAtivos.textContent = dados.total_ativos;
        }

        if (totalUsuariosInativos) {
            totalUsuariosInativos.textContent = dados.total_inativos;
        }

        if (infoPaginacaoUsuarios) {
            infoPaginacaoUsuarios.textContent = dados.total_usuarios > 0
                ? `Exibindo ${dados.paginacao.inicio} a ${dados.paginacao.fim} de ${dados.total_usuarios} usuários`
                : "Nenhum usuário encontrado";
        }
    }

    async function carregarUsuarios(pagina = 1) {
        if (!containerFiltrosUsuarios || !tbodyUsuarios) return;

        const url = containerFiltrosUsuarios.dataset.url;

        if (!url) {
            console.error("URL de filtragem dos usuários não encontrada.");
            return;
        }

        const dataInicial = dataInicialUsuario?.value || "";
        const dataFinal = dataFinalUsuario?.value || "";

        if (dataInicial && dataFinal && dataInicial > dataFinal) {
            mostrarAlerta("A data inicial não pode ser maior que a data final.","erro");
            return;
        }

        const parametros = new URLSearchParams({
            data_inicial: dataInicial,
            data_final: dataFinal,
            status: statusUsuario?.value || "todos",
            conexao: conexaoUsuario?.value || "todos",
            acesso: acessoUsuario?.value.trim() || "",
            pesquisa: pesquisaUsuario?.value.trim() || "",
            ordenar_por: ordenarUsuarios?.value || "nome",
            ordem: document.querySelector('input[name="ordem_usuarios"]:checked')?.value || "asc",
            page: pagina
        });

        try {
            tbodyUsuarios.innerHTML = `
                <tr>
                    <td colspan="14" style="text-align:center;padding:20px;">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Carregando usuários...
                    </td>
                </tr>
            `;

            const resposta = await fetch(`${url}?${parametros.toString()}`, {
                method: "GET",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || "Erro ao consultar usuários.");
            }

            resultadosUsuariosAtuais = dados.resultados || [];

            renderizarTabelaUsuarios(resultadosUsuariosAtuais);
            atualizarResumoUsuarios(dados);
            renderizarPaginacaoUsuarios(dados.paginacao);

        } catch (erro) {
            console.error("Erro ao carregar usuários:", erro);

            tbodyUsuarios.innerHTML = `
                <tr>
                    <td colspan="14" style="text-align:center;padding:20px;">
                        Não foi possível carregar os usuários.
                    </td>
                </tr>
            `;
        }
    }

    // FILTROS
    [
        dataInicialUsuario,
        dataFinalUsuario,
        statusUsuario,
        conexaoUsuario,
        ordenarUsuarios
    ].forEach(campo => {
        campo?.addEventListener("change", () => carregarUsuarios(1));
    });

    [
        acessoUsuario,
        pesquisaUsuario
    ].forEach(campo => {
        campo?.addEventListener("input", () => carregarUsuarios(1));
    });

    // ORDENAÇÃO
    document.querySelectorAll('input[name="ordem_usuarios"]').forEach(radio => {
        radio.addEventListener("change", () => carregarUsuarios(1));
    });

    // CHECKBOX MASTER
    if (masterUsuarios && gridUsuarios) {
        const checkboxes = gridUsuarios.querySelectorAll('input[type="checkbox"]');

        masterUsuarios.addEventListener("change", function () {
            checkboxes.forEach(cb => cb.checked = this.checked);
            masterUsuarios.indeterminate = false;

            renderizarTabelaUsuarios(resultadosUsuariosAtuais);
        });

        checkboxes.forEach(cb => {
            cb.addEventListener("change", function () {
                const selecionados = Array.from(checkboxes).filter(cb => cb.checked).length;

                masterUsuarios.checked = selecionados === checkboxes.length;
                masterUsuarios.indeterminate =
                    selecionados > 0 && selecionados < checkboxes.length;

                renderizarTabelaUsuarios(resultadosUsuariosAtuais);
            });
        });
    }

    // PAGINAÇÃO
    if (paginacaoUsuarios) {
        paginacaoUsuarios.addEventListener("click", function (e) {
            const botao = e.target.closest("[data-page]");

            if (!botao) return;

            const pagina = Number(botao.dataset.page);

            if (pagina > 0) {
                carregarUsuarios(pagina);
            }
        });
    }

    // EXPORTAÇÃO
    if (btnTriggerUsuarios && wrapperUsuarios) {
        btnTriggerUsuarios.addEventListener("click", function (e) {
            e.stopPropagation();
            wrapperUsuarios.classList.toggle("ativo");
        });
    }

    if (popoverCardUsuarios) {
        popoverCardUsuarios.addEventListener("click", e => e.stopPropagation());
    }

    opcoesFormatoUsuarios.forEach(botao => {
        botao.addEventListener("click", function () {
            opcoesFormatoUsuarios.forEach(opcao => opcao.classList.remove("ativo"));

            this.classList.add("ativo");
            formatoSelecionadoUsuarios = this.dataset.formato;
        });
    });

    if (btnConfirmarUsuarios) {
        btnConfirmarUsuarios.addEventListener("click", async function () {
            const urlExportacao = wrapperUsuarios?.dataset.url;
            const colunas = obterColunasSelecionadasUsuarios();

            if (!urlExportacao) {
                mostrarAlerta("URL de exportação não encontrada.","erro");
                return;
            }

            if (!colunas.length) {
                mostrarAlerta("Selecione pelo menos uma coluna para exportar.","erro");
                return;
            }

            const parametros = new URLSearchParams({
                formato: formatoSelecionadoUsuarios,
                data_inicial: dataInicialUsuario?.value || "",
                data_final: dataFinalUsuario?.value || "",
                status: statusUsuario?.value || "todos",
                conexao: conexaoUsuario?.value || "todos",
                acesso: acessoUsuario?.value.trim() || "",
                pesquisa: pesquisaUsuario?.value.trim() || "",
                ordenar_por: ordenarUsuarios?.value || "nome",
                ordem: document.querySelector('input[name="ordem_usuarios"]:checked')?.value || "asc"
            });

            colunas.forEach(coluna => parametros.append("colunas", coluna));

            try {
                btnConfirmarUsuarios.disabled = true;
                btnConfirmarUsuarios.textContent = "Preparando arquivo...";

                const resposta = await fetch(`${urlExportacao}?${parametros.toString()}`, {
                    headers: {
                        "X-Requested-With": "XMLHttpRequest"
                    }
                });

                if (!resposta.ok) {
                    const erro = await resposta.json();
                    throw new Error(erro.erro || "Erro ao exportar usuários.");
                }

                const arquivo = await resposta.blob();

                const extensao = formatoSelecionadoUsuarios;
                const nomeArquivo = `relatorio_usuarios.${extensao}`;

                const urlArquivo = URL.createObjectURL(arquivo);
                const link = document.createElement("a");

                link.href = urlArquivo;
                link.download = nomeArquivo;

                document.body.appendChild(link);
                link.click();
                link.remove();

                setTimeout(() => URL.revokeObjectURL(urlArquivo), 1000);

                wrapperUsuarios.classList.remove("ativo");

            } catch (erro) {
                console.error("Erro ao exportar usuários:", erro);
                alert(erro.message);

            } finally {
                btnConfirmarUsuarios.disabled = false;
                btnConfirmarUsuarios.textContent = "Baixar";
            }
        });
    }

    // =============================================
// RELATÓRIO DE TEMPO DE CONEXÃO
// =============================================

const btnTempoConexaoUsuarios = document.getElementById(
    "btnTempoConexaoUsuarios"
);


const tbodyTempoConexaoUsuarios = document.getElementById(
    "tbodyTempoConexaoUsuarios"
);


async function carregarTempoConexaoUsuarios() {

    const url = containerFiltrosUsuarios?.dataset.urlTempoConexao;

    if (!url) {
        console.error("URL do relatório de tempo não encontrada.");
        return;
    }

    const parametros = new URLSearchParams({
        data_inicial: dataInicialUsuario?.value || "",
        data_final: dataFinalUsuario?.value || ""
    });

    try {

        tbodyTempoConexaoUsuarios.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="tempo-carregando">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Calculando tempos de conexão...
                    </div>
                </td>
            </tr>
        `;

        const resposta = await fetch(`${url}?${parametros.toString()}`, {
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao carregar os tempos.");
        }

        const resultados = dados.resultados || [];

        if (!resultados.length) {
            tbodyTempoConexaoUsuarios.innerHTML = `
                <tr>
                    <td colspan="5" class="tempo-vazio">
                        Nenhum usuário encontrado.
                    </td>
                </tr>
            `;
            return;
        }

        tbodyTempoConexaoUsuarios.innerHTML = resultados.map(usuario => `
            <tr>
                <td>
                    <div class="usuario-tempo-identificacao">
                        <div class="usuario-tempo-avatar">
                            <i class="fa-solid fa-user"></i>
                        </div>

                        <div>
                            <strong>${escaparHTML(usuario.nome)}</strong>
                            <small>${escaparHTML(usuario.username)}</small>
                        </div>
                    </div>
                </td>

                <td>
                    <span class="tempo-valor tempo-online">
                        ${escaparHTML(usuario.tempo_online)}
                    </span>
                </td>

                <td>
                    <span class="tempo-valor tempo-ausente">
                        ${escaparHTML(usuario.tempo_ausente)}
                    </span>
                </td>

                <td>
                    <span class="tempo-valor tempo-offline">
                        ${escaparHTML(usuario.tempo_offline)}
                    </span>
                </td>

                <td>
                    <strong class="tempo-total">
                        ${escaparHTML(usuario.tempo_total)}
                    </strong>
                </td>

                <td>
                    <button
                        type="button"
                        class="btn-editar-status-tempo"
                        data-usuario-id="${usuario.id}"
                        title="Alterar status"
                    >
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                </td>

            </tr>
        `).join("");

        // Indicadores do modal
        const totalOnline = somarTemposUsuarios(resultados, "tempo_online");
        const totalAusente = somarTemposUsuarios(resultados, "tempo_ausente");

        document.getElementById("totalUsuariosTempo").textContent =
            resultados.length;

        document.getElementById("totalOnlineTempo").textContent =
            formatarSegundosTempo(totalOnline);

        document.getElementById("totalAusenteTempo").textContent =
            formatarSegundosTempo(totalAusente);

        document.getElementById("infoTempoConexao").textContent =
            `Exibindo ${resultados.length} usuários`;

    } catch (erro) {

        console.error("Erro ao carregar tempo de conexão:", erro);

        tbodyTempoConexaoUsuarios.innerHTML = `
            <tr>
                <td colspan="5" class="tempo-vazio">
                    Não foi possível carregar os tempos de conexão.
                </td>
            </tr>
        `;
    }
}


// Converte HHh MMmin SSs em segundos
function converterTempoParaSegundos(valor) {

    const partes = valor.match(/(\d+)h\s*(\d+)min\s*(\d+)s/);

    if (!partes) return 0;

    return (
        Number(partes[1]) * 3600 +
        Number(partes[2]) * 60 +
        Number(partes[3])
    );
}


// Soma os tempos de todos os usuários
function somarTemposUsuarios(usuarios, campo) {

    return usuarios.reduce((total, usuario) => {
        return total + converterTempoParaSegundos(usuario[campo]);
    }, 0);

}


// Formata os totais
function formatarSegundosTempo(valor) {

    const horas = Math.floor(valor / 3600);
    const minutos = Math.floor((valor % 3600) / 60);

    return `${String(horas).padStart(2, "0")}h ${String(minutos).padStart(2, "0")}min`;

}

    // ABRIR MODAL
    btnTempoConexaoUsuarios?.addEventListener("click", function () {

        if (!modalTempoConexao) return;

        modalTempoConexao.show();

        carregarTempoConexaoUsuarios();

    });

    // Abrir menu ao clicar no lápis
document.addEventListener("click", function (event) {

    const botaoEditar = event.target.closest(
        ".btn-editar-status-tempo"
    );

    if (botaoEditar) {

        event.stopPropagation();

        usuarioSelecionadoStatus = botaoEditar.dataset.usuarioId;

        menuStatusTempo.classList.toggle("ativo");

        const rect = botaoEditar.getBoundingClientRect();

        menuStatusTempo.style.position = "fixed";
        menuStatusTempo.style.top = `${rect.bottom + 5}px`;
        menuStatusTempo.style.left = `${Math.max(8, rect.right - 135)}px`;

        return;
    }

    if (!event.target.closest("#menuStatusTempo")) {
        menuStatusTempo.classList.remove("ativo");
    }
});


// =============================================
// ALTERAÇÃO DE STATUS - TEMPO DE CONEXÃO
// =============================================

// Abrir menu ao clicar no lápis
document.addEventListener("click", function (event) {

    const botaoEditar = event.target.closest(
        ".btn-editar-status-tempo"
    );

    if (botaoEditar) {

        event.stopPropagation();

        if (!menuStatusTempo) return;

        usuarioSelecionadoStatus = botaoEditar.dataset.usuarioId;

        menuStatusTempo.classList.add("ativo");

        const rect = botaoEditar.getBoundingClientRect();

        menuStatusTempo.style.position = "fixed";
        menuStatusTempo.style.top = `${rect.bottom + 5}px`;
        menuStatusTempo.style.left = `${Math.max(8, rect.right - 135)}px`;

        return;
    }

    if (
        menuStatusTempo &&
        !event.target.closest("#menuStatusTempo")
    ) {
        menuStatusTempo.classList.remove("ativo");
    }
});


// Alterar status do usuário
menuStatusTempo?.addEventListener("click", async function (event) {

    const botao = event.target.closest("button[data-status]");

    if (!botao || !usuarioSelecionadoStatus) return;

    const novoStatus = botao.dataset.status;

    const csrfToken = document.querySelector(
        "[name=csrfmiddlewaretoken]"
    )?.value;

    const url = urlAlterarStatus.replace(
        "/0/",
        `/${usuarioSelecionadoStatus}/`
    );

    try {

        botao.disabled = true;

        const dados = new FormData();
        dados.append("status", novoStatus);

        const resposta = await fetch(url, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken
            },
            body: dados
        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error(
                resultado.mensagem || "Não foi possível alterar o status."
            );
        }

        menuStatusTempo.classList.remove("ativo");

        usuarioSelecionadoStatus = null;

        mostrarAlerta(
            resultado.mensagem,
            "sucesso"
        );

        // Atualiza o relatório de tempo
        await carregarTempoConexaoUsuarios();

        // Atualiza também a tabela normal de usuários
        await carregarUsuarios(1);

    } catch (erro) {

        mostrarAlerta(
            erro.message || "Erro ao alterar o status do usuário.",
            "erro"
        );

    } finally {

        botao.disabled = false;

    }

});


    // =============================================
    // ABA: BI - RELATÓRIOS
    // =============================================

    
// =====================================================
// ABA: BUSINESS INTELLIGENCE
// =====================================================

(() => {
    const abaBI = document.getElementById("abaRelatorioBI");

    if (!abaBI) return;

    const urlBI = abaBI.dataset.url;

    let dadosBI = null;
    let graficosBI = {};
    let carregamentoBI = false;
    let ultimaAtualizacaoBI = null;

    // =================================================
    // ELEMENTOS
    // =================================================

    const dataInicialBI = document.getElementById("biDataInicial");
    const dataFinalBI = document.getElementById("biDataFinal");

    const btnFiltrarBI = document.getElementById("btnFiltrarBI");
    const btnLimparBI = document.getElementById("btnLimparBI");

    // =================================================
    // FUNÇÕES AUXILIARES
    // =================================================

    function formatarNumero(valor) {
        return Number(valor || 0).toLocaleString("pt-BR");
    }

    function obterContexto(id) {
        const canvas = document.getElementById(id);

        if (!canvas) {
            console.warn(`Canvas não encontrado: ${id}`);
            return null;
        }

        return canvas.getContext("2d");
    }

    function atualizarTexto(id, valor) {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = valor;
        }
    }

    function atualizarIndicadores(indicadores) {
        atualizarTexto(
            "biTotalJuridicos",
            formatarNumero(indicadores.total_juridicos)
        );

        atualizarTexto(
            "biTotalFisicos",
            formatarNumero(indicadores.total_fisicos)
        );

        atualizarTexto(
            "biTotalUsuarios",
            formatarNumero(indicadores.total_usuarios)
        );

        atualizarTexto(
            "biUsuariosAtivos",
            formatarNumero(indicadores.usuarios_ativos)
        );

        atualizarTexto(
            "biVariacaoJuridicos",
            `${formatarNumero(indicadores.novos_juridicos)} novos no período`
        );

        atualizarTexto(
            "biVariacaoFisicos",
            `${formatarNumero(indicadores.novos_fisicos)} novos no período`
        );

        atualizarTexto(
            "biVariacaoUsuarios",
            `${formatarNumero(indicadores.novos_usuarios)} novos no período`
        );

        atualizarTexto(
            "biPercentualUsuariosAtivos",
            `${indicadores.percentual_usuarios_ativos}% dos usuários`
        );
    }

    // =================================================
    // CONFIGURAÇÕES DOS GRÁFICOS
    // =================================================

    const coresBI = {
        azul: "#60a5fa",
        roxo: "#a78bfa",
        ciano: "#22d3ee",
        verde: "#34d399",
        amarelo: "#fbbf24",
        vermelho: "#f87171",
        cinza: "#64748b",
        grade: "rgba(148, 163, 184, 0.10)",
        texto: "#94a3b8"
    };

    function opcoesComuns() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1100,
                easing: "easeOutQuart"
            },
            plugins: {
                legend: {
                    labels: {
                        color: coresBI.texto,
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 18,
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    backgroundColor: "#1e293b",
                    titleColor: "#f8fafc",
                    bodyColor: "#cbd5e1",
                    borderColor: "#334155",
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 7
                }
            }
        };
    }

    function destruirGrafico(id) {
        if (graficosBI[id]) {
            graficosBI[id].destroy();
            delete graficosBI[id];
        }
    }

    function criarGrafico(id, configuracao) {
        const contexto = obterContexto(id);

        if (!contexto) return;

        destruirGrafico(id);

        graficosBI[id] = new Chart(
            contexto,
            configuracao
        );
    }

    // =================================================
    // GRÁFICO DE LINHAS
    // =================================================

    function criarGraficoLinha(id, labels, conjuntos) {
        criarGrafico(id, {
            type: "line",

            data: {
                labels: labels,

                datasets: conjuntos.map(conjunto => ({
                    label: conjunto.label,
                    data: conjunto.dados,

                    borderColor: conjunto.cor,
                    backgroundColor: conjunto.cor + "20",

                    borderWidth: 2.5,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: conjunto.cor,

                    tension: 0.4,
                    fill: conjunto.fill || false
                }))
            },

            options: {
                ...opcoesComuns(),

                interaction: {
                    intersect: false,
                    mode: "index"
                },

                scales: {
                    x: {
                        grid: {
                            color: coresBI.grade
                        },
                        ticks: {
                            color: coresBI.texto,
                            font: { size: 10 }
                        },
                        border: {
                            display: false
                        }
                    },

                    y: {
                        beginAtZero: true,
                        grid: {
                            color: coresBI.grade
                        },
                        ticks: {
                            color: coresBI.texto,
                            precision: 0,
                            font: { size: 10 }
                        },
                        border: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // =================================================
    // GRÁFICO DE ROSCA
    // =================================================

    function criarGraficoDonut(id, labels, valores, cores) {
        criarGrafico(id, {
            type: "doughnut",

            data: {
                labels: labels,

                datasets: [{
                    data: valores,
                    backgroundColor: cores,
                    borderColor: "#0f172a",
                    borderWidth: 4,
                    hoverOffset: 9,
                    spacing: 2
                }]
            },

            options: {
                ...opcoesComuns(),

                cutout: "70%",

                plugins: {
                    ...opcoesComuns().plugins,

                    legend: {
                        position: "bottom",
                        labels: {
                            color: coresBI.texto,
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 17,
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }

    // =================================================
    // GRÁFICO DE BARRAS
    // =================================================

    function criarGraficoBarras(id, labels, valores, cor) {
        criarGrafico(id, {
            type: "bar",

            data: {
                labels: labels,

                datasets: [{
                    label: "Cadastros",
                    data: valores,

                    backgroundColor: cor + "CC",
                    borderColor: cor,
                    borderWidth: 1,
                    borderRadius: 5,
                    maxBarThickness: 35
                }]
            },

            options: {
                ...opcoesComuns(),

                indexAxis: "y",

                plugins: {
                    ...opcoesComuns().plugins,
                    legend: {
                        display: false
                    }
                },

                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: coresBI.grade
                        },
                        ticks: {
                            color: coresBI.texto,
                            precision: 0
                        }
                    },

                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: coresBI.texto,
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }

    // =================================================
    // GRÁFICO DE TEMPO DE CONEXÃO
    // =================================================

    function criarGraficoTempoConexao(dados) {
        criarGrafico("graficoTempoConexao", {
            type: "bar",

            data: {
                labels: ["Tempo registrado"],

                datasets: [
                    {
                        label: "Online",
                        data: [dados.online || 0],
                        backgroundColor: coresBI.verde,
                        borderRadius: 5
                    },
                    {
                        label: "Ausente",
                        data: [dados.ausente || 0],
                        backgroundColor: coresBI.amarelo,
                        borderRadius: 5
                    },
                    {
                        label: "Offline",
                        data: [dados.offline || 0],
                        backgroundColor: coresBI.cinza,
                        borderRadius: 5
                    }
                ]
            },

            options: {
                ...opcoesComuns(),

                indexAxis: "y",

                scales: {
                    x: {
                        stacked: true,
                        beginAtZero: true,
                        grid: {
                            color: coresBI.grade
                        },
                        ticks: {
                            color: coresBI.texto,
                            callback: valor => `${valor} h`
                        }
                    },

                    y: {
                        stacked: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: coresBI.texto
                        }
                    }
                },

                plugins: {
                    ...opcoesComuns().plugins,

                    tooltip: {
                        ...opcoesComuns().plugins.tooltip,
                        callbacks: {
                            label: contexto =>
                                `${contexto.dataset.label}: ${contexto.raw} horas`
                        }
                    }
                }
            }
        });
    }

    // =================================================
    // ATUALIZAR TODOS OS GRÁFICOS
    // =================================================

    function atualizarGraficos(dados) {
        const evolucao = dados.evolucao;

        const mesesFormatados = evolucao.meses.map(mes => {
            const [ano, numeroMes] = mes.split("-");

            return new Date(
                Number(ano),
                Number(numeroMes) - 1,
                1
            ).toLocaleDateString("pt-BR", {
                month: "short",
                year: "2-digit"
            });
        });

        // Evolução geral
        criarGraficoLinha(
            "graficoEvolucaoCadastros",
            mesesFormatados,
            [
                {
                    label: "Clientes jurídicos",
                    dados: evolucao.juridicos,
                    cor: coresBI.azul
                },
                {
                    label: "Clientes físicos",
                    dados: evolucao.fisicos,
                    cor: coresBI.roxo
                },
                {
                    label: "Usuários",
                    dados: evolucao.usuarios,
                    cor: coresBI.ciano
                }
            ]
        );

        // Distribuição de clientes
        criarGraficoDonut(
            "graficoDistribuicaoClientes",
            ["Jurídicos", "Físicos"],
            [
                dados.indicadores.total_juridicos,
                dados.indicadores.total_fisicos
            ],
            [coresBI.azul, coresBI.roxo]
        );

        // Situação dos usuários
        criarGraficoDonut(
            "graficoSituacaoUsuarios",
            ["Ativos", "Inativos"],
            [
                dados.situacao_usuarios.ativos,
                dados.situacao_usuarios.inativos
            ],
            [coresBI.verde, coresBI.vermelho]
        );

        // Evolução dos clientes jurídicos
        criarGraficoLinha(
            "graficoEvolucaoJuridicos",
            mesesFormatados,
            [{
                label: "Clientes jurídicos",
                dados: evolucao.juridicos,
                cor: coresBI.azul,
                fill: true
            }]
        );

        // Estados dos jurídicos
        const estadosJuridicos = dados.estados.juridicos;

        criarGraficoBarras(
            "graficoEstadosJuridicos",
            Object.keys(estadosJuridicos),
            Object.values(estadosJuridicos),
            coresBI.azul
        );

        // Evolução dos clientes físicos
        criarGraficoLinha(
            "graficoEvolucaoFisicos",
            mesesFormatados,
            [{
                label: "Clientes físicos",
                dados: evolucao.fisicos,
                cor: coresBI.roxo,
                fill: true
            }]
        );

        // Estados dos físicos
        const estadosFisicos = dados.estados.fisicos;

        criarGraficoBarras(
            "graficoEstadosFisicos",
            Object.keys(estadosFisicos),
            Object.values(estadosFisicos),
            coresBI.roxo
        );

        // Status de conexão
        criarGraficoDonut(
            "graficoStatusConexao",
            ["Online", "Ausente", "Offline"],
            [
                dados.status_conexao.online,
                dados.status_conexao.ausente,
                dados.status_conexao.offline
            ],
            [
                coresBI.verde,
                coresBI.amarelo,
                coresBI.cinza
            ]
        );

        // Evolução de usuários
        criarGraficoLinha(
            "graficoEvolucaoUsuarios",
            mesesFormatados,
            [{
                label: "Novos usuários",
                dados: evolucao.usuarios,
                cor: coresBI.ciano,
                fill: true
            }]
        );

        // Tempo de conexão
        criarGraficoTempoConexao(
            dados.tempo_conexao
        );
    }

    // =================================================
    // BUSCAR DADOS DA API
    // =================================================

    async function carregarDadosBI() {
        if (carregamentoBI) return;

        if (!urlBI) {
            console.error("URL da API do BI não foi configurada.");
            mostrarAlerta(
                "URL do Business Intelligence não configurada.",
                "erro"
            );
            return;
        }

        carregamentoBI = true;

        if (btnFiltrarBI) {
            btnFiltrarBI.disabled = true;
            btnFiltrarBI.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Carregando';
        }

        try {
            const parametros = new URLSearchParams();

            if (dataInicialBI?.value) {
                parametros.set(
                    "data_inicial",
                    dataInicialBI.value
                );
            }

            if (dataFinalBI?.value) {
                parametros.set(
                    "data_final",
                    dataFinalBI.value
                );
            }

            const resposta = await fetch(
                `${urlBI}?${parametros.toString()}`,
                {
                    method: "GET",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest"
                    },
                    credentials: "same-origin"
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok || !dados.sucesso) {
                throw new Error(
                    dados.erro || "Não foi possível carregar os dados do BI."
                );
            }

            dadosBI = dados;

            atualizarIndicadores(dados.indicadores);

            // Os gráficos só são desenhados quando a aba estiver visível.
            if (abaBI.getClientRects().length > 0) {
                atualizarGraficos(dados);
            }

            ultimaAtualizacaoBI = new Date();

            console.log(
                "Business Intelligence atualizado:",
                dados
            );

        } catch (erro) {
            console.error("Erro ao carregar BI:", erro);

            mostrarAlerta(
                erro.message || "Erro ao carregar o Business Intelligence.",
                "erro"
            );

        } finally {
            carregamentoBI = false;

            if (btnFiltrarBI) {
                btnFiltrarBI.disabled = false;
                btnFiltrarBI.innerHTML =
                    '<i class="fa-solid fa-filter"></i> Filtrar';
            }
        }
    }

    // =================================================
    // FILTROS
    // =================================================

    btnFiltrarBI?.addEventListener("click", () => {
        if (
            dataInicialBI?.value &&
            dataFinalBI?.value &&
            dataInicialBI.value > dataFinalBI.value
        ) {
            mostrarAlerta(
                "A data inicial não pode ser maior que a data final.",
                "erro"
            );
            return;
        }

        carregarDadosBI();
    });

    btnLimparBI?.addEventListener("click", () => {
        if (dataInicialBI) dataInicialBI.value = "";
        if (dataFinalBI) dataFinalBI.value = "";

        carregarDadosBI();
    });

    // =================================================
    // INICIALIZAÇÃO QUANDO A ABA FICAR VISÍVEL
    // =================================================

    function inicializarGraficosBI() {
        if (!dadosBI) return;

        if (!abaBI.getClientRects().length) return;

        atualizarGraficos(dadosBI);
    }

    // Observa a mudança de classe da aba.
    const observadorBI = new MutationObserver(() => {
        if (abaBI.getClientRects().length > 0) {
            requestAnimationFrame(() => {
                inicializarGraficosBI();

                Object.values(graficosBI).forEach(grafico => {
                    grafico.resize();
                });
            });
        }
    });

    observadorBI.observe(abaBI, {
        attributes: true,
        attributeFilter: ["class", "style"]
    });

    // Também atualiza ao clicar na aba de BI.
    document.querySelectorAll(".btn-tab-relatorio").forEach(botao => {
        botao.addEventListener("click", () => {
            setTimeout(() => {
                inicializarGraficosBI();

                Object.values(graficosBI).forEach(grafico => {
                    grafico.resize();
                });
            }, 150);
        });
    });

    // =================================================
    // INICIALIZAÇÃO
    // =================================================

    function iniciarBI() {
        carregarDadosBI();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            iniciarBI,
            { once: true }
        );
    } else {
        iniciarBI();
    }

})();


    // ATUALIZAÇÃO AUTOMÁTICA DO STATUS DE CONEXÃO
    setInterval(() => {
        carregarUsuarios(1);
    }, 300000);


    // CARREGAMENTOS INICIAIS
    carregarClientesJuridicos(1);
    carregarClientesFisicos(1);
    carregarUsuarios(1);

});
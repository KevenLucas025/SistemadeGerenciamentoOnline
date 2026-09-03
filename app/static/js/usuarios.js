document.addEventListener("DOMContentLoaded", function () {

    // 2. Clique no botão lateral "Gerar Saída"
    const btnGerarSaida = document.getElementById("btnGerarSaida");
    const modalSaidaEl = document.getElementById("modalConfirmarSaida");
    const modalSaida = modalSaidaEl ? bootstrap.Modal.getOrCreateInstance(modalSaidaEl) : null;
    const nomeUsuarioSaidaModal = document.getElementById("nomeUsuarioSaidaModal");


    /* =========================================
       FUNÇÕES DE FORMATAÇÃO E MÁSCARAS
    ========================================= */
    function somenteNumeros(valor) {
        return (valor || "").replace(/\D/g, "");
    }

    function formatarCPF(valor) {
        valor = somenteNumeros(valor);
        if (valor.length === 11) {
            return valor.replace(
                /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
                "$1.$2.$3-$4"
            );
        }
        return valor;
    }

    function formatarCNPJ(valor) {
        valor = somenteNumeros(valor);
        if (valor.length === 14) {
            return valor.replace(
                /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                "$1.$2.$3/$4-$5"
            );
        }
        return valor;
    }

    function formatarRG(valor) {
        valor = somenteNumeros(valor);
        if (valor.length === 9) {
            return valor.replace(
                /^(\d{2})(\d{3})(\d{3})(\d{1})$/,
                "$1.$2.$3-$4"
            );
        }
        return valor;
    }

    function formatarCEP(valor) {
        valor = somenteNumeros(valor);
        if (valor.length === 8) {
            return valor.replace(
                /^(\d{5})(\d{3})$/,
                "$1-$2"
            );
        }
        return valor;
    }

    function formatarTelefone(valor) {
        valor = somenteNumeros(valor);
        if (valor.length === 11) {
            return valor.replace(
                /^(\d{2})(\d{5})(\d{4})$/,
                "($1) $2-$3"
            );
        }
        if (valor.length === 10) {
            return valor.replace(
                /^(\d{2})(\d{4})(\d{4})$/,
                "($1) $2-$3"
            );
        }
        return valor;
    }

    /* =========================================
       APLICAR FORMATAÇÕES NA TABELA
    ========================================= */
    function aplicarFormatacoesTabela() {
        document.querySelectorAll(".tabela-cpf").forEach(function (elemento) {
            elemento.textContent = formatarCPF(elemento.textContent);
        });

        document.querySelectorAll(".tabela-cnpj").forEach(function (elemento) {
            elemento.textContent = formatarCNPJ(elemento.textContent);
        });

        document.querySelectorAll(".tabela-rg").forEach(function (elemento) {
            elemento.textContent = formatarRG(elemento.textContent);
        });

        document.querySelectorAll(".tabela-cep").forEach(function (elemento) {
            elemento.textContent = formatarCEP(elemento.textContent);
        });

        document.querySelectorAll(".tabela-telefone").forEach(function (elemento) {
            elemento.textContent = formatarTelefone(elemento.textContent);
        });
    }

    // Executa no carregamento inicial
    aplicarFormatacoesTabela();

    /* =========================================
       ATUALIZAÇÃO ASSÍNCRONA DAS TABELAS (AJAX)
    ========================================= */
    const btnAtualizarAtivos = document.getElementById("btnAtualizarAtivos");
    const btnAtualizarInativos = document.getElementById("btnAtualizarInativos");
    const tbodyAtivos = document.getElementById("tbodyUsuariosAtivos");
    const tbodyInativos = document.getElementById("tbodyUsuariosInativos");

    async function atualizarTabela(tipo, botao, tbody) {
        if (!tbody || !botao) return;

        const icone = botao.querySelector("i");

        try {
            botao.disabled = true;
            if (icone) icone.classList.add("fa-spin");

            const resposta = await fetch(`/usuarios/atualizar-status/?tipo=${tipo}`);

            if (!resposta.ok) {
                throw new Error(`Erro HTTP: ${resposta.status}`);
            }

            const dados = await resposta.json();

            if (dados.sucesso) {
                tbody.innerHTML = dados.html;
                
                // Reexecuta as máscaras nas novas linhas carregadas
                aplicarFormatacoesTabela();

                if (typeof mostrarAlerta === "function") {
                    const nomeTabela = tipo === "ativos" ? "ativos" : "inativos";
                    mostrarAlerta(`Tabela de usuários ${nomeTabela} atualizada com sucesso!`, "sucesso");
                }
            } else {
                throw new Error(dados.mensagem || "Erro ao processar dados da tabela.");
            }

        } catch (erro) {
            console.error(`Erro ao atualizar tabela de ${tipo}:`, erro);
            if (typeof mostrarAlerta === "function") {
                mostrarAlerta(`Não foi possível atualizar a tabela de usuários ${tipo}.`, "erro");
            }
        } finally {
            botao.disabled = false;
            if (icone) icone.classList.remove("fa-spin");
        }
    }

    if (btnAtualizarAtivos) {
        btnAtualizarAtivos.addEventListener("click", function () {
            atualizarTabela("ativos", btnAtualizarAtivos, tbodyAtivos);
        });
    }

    if (btnAtualizarInativos) {
        btnAtualizarInativos.addEventListener("click", function () {
            atualizarTabela("inativos", btnAtualizarInativos, tbodyInativos);
        });
    }

    let linhaAtivaSelecionada = null;

    // Evento de clique na tabela de ativos (com Toggle ao clicar na mesma linha)
    if (tbodyAtivos) {
        tbodyAtivos.addEventListener("click", function (e) {
            const linha = e.target.closest("tr.linha-usuario-ativo");
            if (!linha) return;

            // Se clicou na linha que JÁ estava selecionada -> Deseleciona (Toggle)
            if (linha.classList.contains("linha-selecionada")) {
                desmarcarLinhaAtiva();
                return;
            }

            // Se clicou em outra linha -> Limpa as anteriores e seleciona a nova
            tbodyAtivos.querySelectorAll("tr").forEach(tr => tr.classList.remove("linha-selecionada"));
            linha.classList.add("linha-selecionada");
            linhaAtivaSelecionada = linha;
        });
    }

    if (btnGerarSaida){
        btnGerarSaida.addEventListener("click",function (){
            if (!linhaAtivaSelecionada){
                if (typeof mostrarAlerta === "function"){
                    mostrarAlerta("Selecione um usuário para gerar a saída","erro");
                }else{
                    mostrarAlerta("Selecione um usuário ativo na tabela para gerar a saída.")
                }
                return;
            }

            const nomeUsuario = linhaAtivaSelecionada.querySelector("td:nth-child(2)")?.textContent.trim() 
            || linhaAtivaSelecionada.querySelector("td:first-child")?.textContent.trim();

            if (nomeUsuarioSaidaModal) {
                nomeUsuarioSaidaModal.textContent = nomeUsuario;
            }

            if (modalSaida) modalSaida.show();
        });
    }
    // 3. Confirmar a saída definitiva dentro do modal
    const btnConfirmarSaidaDefinitiva = document.getElementById("btnConfirmarSaidaDefinitiva");

    if (btnConfirmarSaidaDefinitiva) {
        btnConfirmarSaidaDefinitiva.addEventListener("click", async function () {
            if (!linhaAtivaSelecionada) return;

            const usuarioId = linhaAtivaSelecionada.getAttribute("data-usuario-id");
            if (!usuarioId) return;

            const csrfToken = getCSRFToken();

            try {
                btnConfirmarSaidaDefinitiva.disabled = true;

                const resposta = await fetch(`/usuarios/gerar-saida/${usuarioId}/`, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken,
                        "Content-Type": "application/json"
                    }
                });

                const dados = await resposta.json();

                if (!resposta.ok || !dados.sucesso) {
                    if (typeof mostrarAlerta === "function") {
                        mostrarAlerta(dados.mensagem || "Erro ao gerar saída do usuário.", "erro");
                    } else {
                        alert(dados.mensagem || "Erro ao gerar saída do usuário.");
                    }
                    return;
                }

                if (modalSaida) modalSaida.hide();

                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(dados.mensagem, "sucesso");
                }

                // Remove a seleção atual
                linhaAtivaSelecionada = null;

                // Recarrega as duas tabelas automaticamente
                if (typeof atualizarTabela === "function") {
                    const btnAtivos = document.getElementById("btnAtualizarAtivos");
                    const btnInativos = document.getElementById("btnAtualizarInativos");
                    const tbodyInativos = document.getElementById("tbodyUsuariosInativos");

                    await atualizarTabela("ativos", btnAtivos, tbodyAtivos);
                    await atualizarTabela("inativos", btnInativos, tbodyInativos);
                }

            } catch (erro) {
                console.error("Erro na requisição de saída:", erro);
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Erro de comunicação ao processar saída.", "erro");
                }
            } finally {
                btnConfirmarSaidaDefinitiva.disabled = false;
            }
        });
    }

    // Função utilitária para limpar qualquer seleção ativa
    function desmarcarLinhaAtiva() {
        if (tbodyAtivos) {
            tbodyAtivos.querySelectorAll("tr").forEach(tr => tr.classList.remove("linha-selecionada"));
        }
        linhaAtivaSelecionada = null;
    }

    // 3. Clique fora da tabela -> Deseleciona
    document.addEventListener("click", function (e) {
        // Não desmarca se o clique foi dentro da tabela de ativos
        const clicouNaTabela = e.target.closest("#tbodyUsuariosAtivos");
        // Não desmarca se o clique foi no botão lateral "Gerar Saída" ou no modal de confirmação
        const clicouNoBotaoSaida = e.target.closest("#btnGerarSaida");
        const clicouNoModal = e.target.closest("#modalConfirmarSaida");

        if (!clicouNaTabela && !clicouNoBotaoSaida && !clicouNoModal) {
            desmarcarLinhaAtiva();
        }
    });

});
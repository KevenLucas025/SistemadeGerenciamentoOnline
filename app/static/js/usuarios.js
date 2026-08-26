document.addEventListener("DOMContentLoaded", function () {

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

});
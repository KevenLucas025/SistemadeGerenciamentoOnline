/* =========================================
   FUNÇÕES GENÉRICAS DE FORMATAÇÃO DE MÁSCARAS
   ========================================= */

function somenteNumeros(valor) {
    return valor ? valor.replace(/\D/g, "") : "";
}

function formatarCPF(valor) {
    valor = somenteNumeros(valor).substring(0, 11);
    if (valor.length > 9) return valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
    if (valor.length > 6) return valor.replace(/^(\d{3})(\d{3})(\d{1,3}).*/, "$1.$2.$3");
    if (valor.length > 3) return valor.replace(/^(\d{3})(\d{1,3}).*/, "$1.$2");
    return valor;
}

function formatarCNPJ(valor) {
    valor = somenteNumeros(valor).substring(0, 14);
    if (valor.length > 12) return valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2}).*/, "$1.$2.$3/$4-$5");
    if (valor.length > 8) return valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4}).*/, "$1.$2.$3/$4");
    if (valor.length > 5) return valor.replace(/^(\d{2})(\d{3})(\d{1,3}).*/, "$1.$2.$3");
    if (valor.length > 2) return valor.replace(/^(\d{2})(\d{1,3}).*/, "$1.$2");
    return valor;
}

function formatarRG(valor) {
    valor = somenteNumeros(valor).substring(0, 9);
    if (valor.length > 8) return valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{1}).*/, "$1.$2.$3-$4");
    if (valor.length > 5) return valor.replace(/^(\d{2})(\d{3})(\d{1,3}).*/, "$1.$2.$3");
    if (valor.length > 2) return valor.replace(/^(\d{2})(\d{1,3}).*/, "$1.$2");
    return valor;
}

function formatarCEP(valor) {
    valor = somenteNumeros(valor).substring(0, 8);
    if (valor.length > 5) return valor.replace(/^(\d{5})(\d{1,3}).*/, "$1-$2");
    return valor;
}

function formatarTelefone(valor) {
    valor = somenteNumeros(valor).substring(0, 11);
    if (valor.length > 10) return valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    if (valor.length > 6) return valor.replace(/^(\d{2})(\d{4})(\d{1,4}).*/, "($1) $2-$3");
    if (valor.length > 2) return valor.replace(/^(\d{2})(\d{1,5}).*/, "($1) $2");
    return valor;
}

function formatarCNH(valor) {
    return somenteNumeros(valor).substring(0, 11);
}

/* =========================================
   BUSCA AUTOMÁTICA DE CEP (ViaCEP) GLOBAL
   ========================================= */
function inicializarBuscaCEPGlobal(container = document) {
    const seletoresCep = "#usuarioCep, #clienteCep, #editarClienteCep, [name='cep']";
    const inputsCep = container.querySelectorAll(seletoresCep);

    inputsCep.forEach(campoCep => {
        campoCep.addEventListener("blur", async function () {
            const cepApenasNumeros = somenteNumeros(this.value);

            if (cepApenasNumeros.length !== 8) {
                return;
            }

            // Descobre em qual formulário ou modal o input está localizado
            const contexto = this.closest("form") || this.closest(".modal-body") || document;

            try {
                const resposta = await fetch(`https://viacep.com.br/ws/${cepApenasNumeros}/json/`);
                const dados = await resposta.json();

                if (dados.erro) {
                    if (typeof mostrarAlerta === "function") {
                        mostrarAlerta("CEP não encontrado.", "erro");
                    }
                    return;
                }

                // Localiza os campos dentro do mesmo formulário
                const campoEndereco = contexto.querySelector("#usuarioEndereco, #clienteEndereco, #editarClienteEndereco, [name='endereco']");
                const campoBairro = contexto.querySelector("#usuarioBairro, #clienteBairro, #editarClienteBairro, [name='bairro']");
                const campoCidade = contexto.querySelector("#usuarioCidade, #clienteCidade, #editarClienteCidade, [name='cidade']");
                const campoEstado = contexto.querySelector("#usuarioEstado, #clienteEstado, #editarClienteEstado, [name='estado']");
                const campoNumero = contexto.querySelector("#usuarioNumero, #clienteNumero, #editarClienteNumero, [name='numero']");

                if (campoEndereco) campoEndereco.value = dados.logradouro || "";
                if (campoBairro) campoBairro.value = dados.bairro || "";
                if (campoCidade) campoCidade.value = dados.localidade || "";
                if (campoEstado) campoEstado.value = (dados.uf || "").toUpperCase();

                if (campoNumero) campoNumero.focus();

            } catch (erro) {
                console.error("Erro ao buscar o CEP:", erro);
                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta("Não foi possível buscar os dados do CEP.", "erro");
                }
            }
        });
    });
}

/* =========================================
   INICIALIZADOR AUTOMÁTICO COMPLETO
   ========================================= */
function aplicarMascarasFormulario(container = document) {
    const mapeamento = [
        { selector: "#usuarioCpf, #clienteCpf, #editarClienteCpf, [name='cpf']", fn: formatarCPF },
        { selector: "#usuarioCnpj, #clienteCnpj, #editarClienteCnpj, [name='cnpj']", fn: formatarCNPJ },
        { selector: "#usuarioRg, #clienteRg, #editarClienteRg, [name='rg']", fn: formatarRG },
        { selector: "#usuarioCep, #clienteCep, #editarClienteCep, [name='cep']", fn: formatarCEP },
        { selector: "#usuarioTelefone, #clienteTelefone, #editarClienteTelefone, [name='telefone']", fn: formatarTelefone },
        { selector: "#clienteCnh, #editarClienteCnh, [name='cnh']", fn: formatarCNH }
    ];

    mapeamento.forEach(({ selector, fn }) => {
        const elementos = container.querySelectorAll(selector);
        elementos.forEach(el => {
            el.addEventListener("input", function () {
                this.value = fn(this.value);
            });
        });
    });

    // Inicializa a consulta do ViaCEP automaticamente
    inicializarBuscaCEPGlobal(container);
}
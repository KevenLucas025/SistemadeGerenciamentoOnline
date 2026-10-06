/* =========================================
   FUNÇÕES GENÉRICAS DE FORMATAÇÃO DE MÁSCARAS
   ========================================= */

function somenteNumeros(valor) {
    return valor ? String(valor).replace(/\D/g, "") : "";
}

/* =========================================
   FORMATAÇÃO DE MOEDA (BRL) DEFINITIVA
   ========================================= */
function formatarMoeda(valor) {
    if (valor === null || valor === undefined || valor === "") return "R$ 0,00";

    let str = String(valor).trim();

    // 1. Se for número direto (ex: 144522.21)
    if (typeof valor === "number") {
        return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    // 2. Remove qualquer "R$", espaços e pontos existentes para padronizar
    let limpo = str.replace(/^R\$\s?/, "").replace(/\s+/g, "");

    // Se já tiver vírgula decimal (ex: "144522,21" ou "144.522,21")
    if (limpo.includes(",")) {
        let partes = limpo.split(",");
        let inteira = partes[0].replace(/\D/g, ""); // Apenas dígitos da parte inteira
        let decimal = (partes[1] || "").replace(/\D/g, "").padEnd(2, "0").substring(0, 2); // 2 dígitos de centavos

        if (!inteira) inteira = "0";
        // Aplica os pontos de milhar
        inteira = inteira.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `R$ ${inteira},${decimal}`;
    }

    // 3. Se for string com ponto decimal do Django/DB (ex: "144522.21")
    if (/^\d+\.\d+$/.test(limpo)) {
        let numFloat = parseFloat(limpo);
        if (!isNaN(numFloat)) {
            return numFloat.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        }
    }

    // 4. Se for digitação contínua de centavos (ex: "14452221" -> R$ 144.522,21)
    let apenasDigitos = somenteNumeros(limpo);
    if (!apenasDigitos) return "R$ 0,00";

    let centavos = (parseFloat(apenasDigitos) / 100).toFixed(2);
    let partes = centavos.split(".");
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return `R$ ${partes[0]},${partes[1]}`;
}

function formatarDataHoraBR(dataISO) {
    if (!dataISO || dataISO === "-" || dataISO === "None") return "-";
    
    // Se já vier no padrão DD/MM/YYYY HH:MM
    if (/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/.test(dataISO)) return dataISO;
    
    const d = new Date(dataISO);
    if (isNaN(d.getTime())) return dataISO;
    
    return d.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
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
        { selector: "#clienteCnh, #editarClienteCnh, [name='cnh']", fn: formatarCNH },
        { 
            selector: "#editarClienteValorGasto, #clienteValorGasto, [name='valor_gasto']", 
            fn: (v) => {
                let digitos = somenteNumeros(v);
                if (!digitos) return "R$ 0,00";
                let centavos = (parseFloat(digitos) / 100).toFixed(2);
                let partes = centavos.split(".");
                partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                return `R$ ${partes[0]},${partes[1]}`;
            } 
        }
    ];

    mapeamento.forEach(({ selector, fn }) => {
        const elementos = container.querySelectorAll(selector);
        elementos.forEach(el => {
            el.addEventListener("input", function () {
                this.value = fn(this.value);
            });
        });
    });

    inicializarBuscaCEPGlobal(container);
}
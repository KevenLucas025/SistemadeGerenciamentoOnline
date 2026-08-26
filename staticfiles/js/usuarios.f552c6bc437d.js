document.addEventListener("DOMContentLoaded", function () {

    function somenteNumeros(valor) {
        return valor.replace(/\D/g, "");
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


    /*
    =========================================
    FORMATAÇÃO DA TABELA
    =========================================
    */

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

});
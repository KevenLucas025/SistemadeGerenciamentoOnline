document.addEventListener("DOMContentLoaded", function () {

    const botoesAbas = document.querySelectorAll(".btn-tab-relatorio");

    const paginas = {
        clientes: document.getElementById("abaRelatorioClientes"),
        usuarios: document.getElementById("abaRelatorioUsuarios"),
        bi: document.getElementById("abaRelatorioBI")
    };

    const titulos = {
        clientes: {
            titulo: "Relatórios de Clientes",
            descricao: "Gere relatórios personalizados dos clientes cadastrados."
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

            // Remove o estado ativo dos botões
            botoesAbas.forEach(btn => {
                btn.classList.remove("ativo");
            });

            // Esconde todas as páginas
            Object.values(paginas).forEach(pagina => {
                pagina.classList.remove("ativa");
            });

            // Ativa o botão selecionado
            this.classList.add("ativo");

            // Exibe a página selecionada
            paginas[abaSelecionada].classList.add("ativa");

            // Atualiza o título
            document.getElementById("tituloPaginaRelatorio").textContent =
                titulos[abaSelecionada].titulo;

            document.getElementById("descricaoPaginaRelatorio").textContent =
                titulos[abaSelecionada].descricao;

        });

    });

});
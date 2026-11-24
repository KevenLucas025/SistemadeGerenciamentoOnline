
(function () {

    const CHAVE_TEMA = "tema_usuario";

    const temasValidos = [
        "escuro",
        "claro",
        "automatico"
    ];

    const temaSalvo = localStorage.getItem(CHAVE_TEMA);

    const tema = temasValidos.includes(temaSalvo)
        ? temaSalvo
        : "escuro";

    document.documentElement.setAttribute(
        "data-theme",
        tema
    );

})();

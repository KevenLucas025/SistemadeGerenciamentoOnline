
function abrirMenuUsuario(){

    const menu = document.getElementById("menuUsuarioDropdown");

    menu.classList.toggle("ativo");

}

document.addEventListener("click", function(event){

    const usuario = document.querySelector(".sidebar-user");
    const menu = document.getElementById("menuUsuarioDropdown");


    if(
        !usuario.contains(event.target) &&
        !menu.contains(event.target)
    ){

        menu.classList.remove("ativo");

    }

});

const indicador = document.getElementById("statusUsuario");
const avatar = document.querySelector(".sidebar-user-avatar");

document.querySelectorAll(".status-opcao").forEach(opcao => {

    opcao.addEventListener("click", function() {

        document.querySelectorAll(".status-opcao").forEach(item => {
            item.classList.remove("ativo");
        });

        this.classList.add("ativo");

        const status = this.dataset.status;

        // Limpa classes anteriores
        indicador.classList.remove("online", "ausente", "offline");
        avatar.classList.remove("online", "ausente", "offline");

        // Adiciona novas classes
        indicador.classList.add(status);
        avatar.classList.add(status);

        // Altera o ícone interno da bolinha de status
        if (status === "offline") {
            indicador.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        } else {
            indicador.innerHTML = ''; // Limpa o ícone para os outros status
        }

    });

});
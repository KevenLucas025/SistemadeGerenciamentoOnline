
def preferencias_usuario(request):
    
    tema = "escuro"

    if request.user.is_authenticated:
        preferencias = getattr(request.user, "preferencias", None)

        if preferencias:
            tema = preferencias.tema

    return {
        "tema_usuario": tema,
    }

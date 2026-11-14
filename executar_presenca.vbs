
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Identifica automaticamente a pasta onde está o VBS
pastaProjeto = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Define o diretório de trabalho
objShell.CurrentDirectory = pastaProjeto

' Localiza o Python do ambiente virtual
python = objFSO.BuildPath(pastaProjeto, "venv\Scripts\python.exe")

' Executa o comando Django sem abrir janela
comando = """" & python & """ manage.py verificar_conexoes"

objShell.Run comando, 0, False

Set objFSO = Nothing
Set objShell = Nothing

@echo off
rem FreeMix Studio. Usa so esta pasta; nao le nem altera nenhum outro programa instalado.
setlocal
set "DIR=%~dp0"
set "BIN_DIR=%DIR%bin\64bit"

rem 1. Se a pasta foi movida ou copiada para outra maquina, ajusta os caminhos salvos.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%DIR%ferramentas\preparar.ps1"

rem 2. Tela de abertura (fecha sozinha quando a janela principal aparece).
start "" /b powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%DIR%ferramentas\splash.ps1"

rem 3. Ajudante local (Salvar como, Configurar). Fecha sozinho quando o programa fecha.
start "" /b powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%DIR%ferramentas\ajudante.ps1"

rem 4. Programa: FreeMix.exe compilado do codigo em freemix-app (nome, icone e titulo ja vem de dentro dele).
rem    --enable-media-stream libera camera e microfone para as paginas de dentro do programa: sem isso o
rem    retorno do FreeMix Call (pagina que envia o programa ao convidado) e recusado.
cd /d "%BIN_DIR%"
start "" "%BIN_DIR%\FreeMix.exe" --portable --multi --disable-updater --disable-missing-files-check --enable-media-stream
exit

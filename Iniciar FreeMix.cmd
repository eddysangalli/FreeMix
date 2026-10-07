@echo off
rem FreeMix: mesa de corte sobre o OBS portatil desta pasta. Nao le nem altera o OBS instalado na maquina.
rem Se a pasta foi movida ou copiada para outra maquina, preparar.ps1 ajusta os caminhos salvos antes de abrir.
start "" powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0ferramentas\splash.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ferramentas\preparar.ps1"
cd /d "%~dp0bin\64bit"
start "" powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0ferramentas\set-freemix-title.ps1"
start "" obs64.exe --portable --multi --disable-updater --disable-missing-files-check

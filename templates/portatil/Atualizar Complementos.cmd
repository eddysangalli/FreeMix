@echo off
rem Consulta fontes oficiais. A instalacao usa somente uma entrega FreeMix assinada.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ferramentas\verificar-atualizacoes.ps1" -CheckOnly
echo.
echo Para instalar: "Atualizar FreeMix.cmd" "PASTA DA VERSAO ASSINADA" apply
pause

@echo off
if "%~1"=="" (
 echo Uso: "Atualizar FreeMix.cmd" "PASTA DA VERSAO ASSINADA" [check ou apply ou rollback]
 echo Feche o FreeMix antes de aplicar. check apenas verifica assinatura e arquivos.
 pause
 exit /b 1
)
set "ACTION=%~2"
if "%ACTION%"=="" set "ACTION=check"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ferramentas\atualizar-freemix.ps1" -Action "%ACTION%" -Package "%~1"
exit /b %errorlevel%

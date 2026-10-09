@echo off
setlocal
if "%~1"=="" if not exist "%~dp0runtime\node.exe" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\installer-windows\abrir-instalador.ps1"
  exit /b
)
set "freemixInstallerRoot=%~dp0obs-vmix"
if exist "%~dp0runtime\node.exe" set "freemixInstallerRoot=%~dp0"
if not exist "%freemixInstallerRoot%\runtime\node.exe" (
  echo Runtime do instalador nao encontrado.
  exit /b 1
)
"%freemixInstallerRoot%\runtime\node.exe" "%freemixInstallerRoot%\ferramentas\instalar-portatil.mjs" %*
exit /b %errorlevel%

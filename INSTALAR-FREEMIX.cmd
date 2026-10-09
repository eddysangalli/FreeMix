@echo off
setlocal
set "freemixInstallerRoot=%~dp0obs-vmix"
if exist "%~dp0runtime\node.exe" set "freemixInstallerRoot=%~dp0"
if not exist "%freemixInstallerRoot%\runtime\node.exe" (
  echo Runtime do instalador nao encontrado.
  exit /b 1
)
"%freemixInstallerRoot%\runtime\node.exe" "%freemixInstallerRoot%\ferramentas\instalar-portatil.mjs" %*
exit /b %errorlevel%

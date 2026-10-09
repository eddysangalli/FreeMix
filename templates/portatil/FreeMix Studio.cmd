@echo off
setlocal
set "FREEMIX_ROOT=%~dp0"
"%~dp0runtime\node.exe" "%~dp0ferramentas\iniciar-freemix.mjs" %*
if errorlevel 1 pause
exit /b

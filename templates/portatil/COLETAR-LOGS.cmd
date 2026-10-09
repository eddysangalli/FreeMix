@echo off
setlocal
chcp 65001 >nul
"%~dp0runtime\node.exe" "%~dp0ferramentas\coletar-diagnostico.mjs" "%~dp0." --mostrar
pause

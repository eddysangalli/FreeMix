@echo off
cd /d "%~dp0..\.."
"%~dp0..\..\obs-vmix\runtime\node.exe" "%~dp0..\..\obs-vmix\ferramentas\preparar-kit-servidor.mjs"
if errorlevel 1 pause

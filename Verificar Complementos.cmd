@echo off
rem ==============================================================================
rem FreeMix Studio — Auditoria de Complementos e Motor Broadcast
rem ==============================================================================

title FreeMix Studio — Auditoria de Complementos
echo.
echo =================================================================
echo  FreeMix Studio - Verificando Status dos Complementos
echo =================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ferramentas\verificar-atualizacoes.ps1"

echo.
echo [CONCLUIDO] Pressione qualquer tecla para fechar esta janela...
pause >nul

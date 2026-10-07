@echo off
rem ==============================================================================
rem FreeMix Studio — Atualizador de Complementos e Motor Broadcast
rem Atualiza plugins e o motor libobs diretamente da nuvem sem malabarismos
rem ==============================================================================

title FreeMix Studio — Atualizador Oficial
echo.
echo =================================================================
echo  FreeMix Studio - Atualizacao de Complementos e Motor
echo =================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ferramentas\verificar-atualizacoes.ps1" -AtualizarTudo

echo.
echo [CONCLUIDO] Pressione qualquer tecla para fechar esta janela...
pause >nul

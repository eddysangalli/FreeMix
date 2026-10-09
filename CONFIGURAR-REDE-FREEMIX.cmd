@echo off
setlocal
echo FreeMix: configuracao de rede privada e firewall.
echo Sem argumentos, mostra o plano sem mudar o firewall.
echo Para a rede local: --control-lan --ndi --omt --apply --elevate
echo Escolha apenas os componentes que deseja utilizar. A elevacao pede confirmacao do Windows.
"%~dp0obs-vmix\runtime\freemix-network-setup.exe" --root "%~dp0obs-vmix" %*
pause

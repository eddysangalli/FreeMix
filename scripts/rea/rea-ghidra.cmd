@echo off
rem REA com Ghidra, rodando no Debian do WSL. Use caminhos Linux, ex.: /mnt/d/DRIVE/IA/antigravity/vmixtwste/vMix27-copia/x64/vMixNative.dll
wsl.exe -d Debian -- /home/eddy/rea-tools/rea %*

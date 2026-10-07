# O código do programa (FreeMix Studio)

O FreeMix Studio é o OBS Studio 32.2.2 (commit `ba2f32b`, GPL-2.0-or-later) mais as mudanças desta pasta, um arquivo `.patch` por commit, na ordem dos números. A pasta de trabalho de onde eles saem é `freemix-app`, ramo `freemix/broadcast-suite`; `sincronizar-github.ps1` gera estes arquivos de novo a cada publicação.

## Reconstruir do zero

```
git clone --recursive --branch 32.2.2 https://github.com/obsproject/obs-studio.git freemix-app
cd freemix-app
git checkout -b freemix/broadcast-suite
git am ..\FreeMix\fork\*.patch
```

Depois, na pasta de cima: `compilar-2026.ps1` (Visual Studio 2026 com "Desenvolvimento para desktop com C++" e "C++ ATL") e `obs-vmix\ferramentas\instalar-compilado.ps1`. O passo a passo completo e o estado de cada parte estão em `CONTINUAR.md`, na raiz.

## O que é nosso dentro do código

- `frontend/widgets/FreeMixSafeArea.cpp`: guias de Safe Area no título do Preview.
- `frontend/widgets/FreeMixMultistream.cpp`: destinos extras de transmissão; também os pedidos do fornecedor `freemix` do servidor de controle.
- `frontend/widgets/FreeMixPreset.cpp`: preset como documento (salvar, descartar ao sair).
- `plugins/downstream-keyer`: Downstream Keyer 0.4.4 de Exeldro (GPL-2.0), compilado junto, com duas mudanças descritas no `CMakeLists.txt` dele.
- Identidade (nome do executável, ícone, título), pergunta de saída e textos `FreeMix.*` nos arquivos de idioma.

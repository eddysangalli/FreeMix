# Proveniência da versão local

O executável é o fork compilado de `freemix-app`, ramo `freemix/broadcast-suite`, commit `a76f99a20ecae3ffcce10a20dd889d5bebc3bd51`, acrescido da alteração de busca de mídia em `shared/media-playback/media-playback/media.c`. O código correspondente está no workspace deste projeto, pasta `freemix-app`. A base upstream é https://github.com/obsproject/obs-studio ; não substituir este fork por um executável oficial avulso.

`obs-ffmpeg.dll` foi recompilado pelo alvo `obs-ffmpeg` de `compilar-2026.ps1` para descartar quadros anteriores ao instante solicitado e limpar os decodificadores em uma busca. `FreeMix.exe` foi recompilado pelo alvo `obs-studio`, incluindo `frontend/widgets/FreeMixMultistream.cpp`: diagnóstico dos próprios docks e watchdog de talkback privado. O watchdog também restaura o mic silenciado ao carregar uma produção que o identifica como privado. Os demais componentes mantêm a compilação anterior. Hashes e componentes constam em `componentes.json` e no manifesto assinado.

O código JavaScript/HTML/PowerShell operacional acompanha o pacote em `ferramentas/` e `painel/`. Bibliotecas npm, versões e integridade: `package-lock.json`. Node inclui sua licença em `runtime/LICENSE-Node.txt`; FFmpeg e FFprobe vêm da instalação local registrada em `componentes.json`, com termos de compilação/licença em `runtime/LICENSE-FFmpeg.txt`. Licenças do motor e componentes acompanham `data/`.

A chave privada de assinatura é material de autoria e permanece fora da distribuição. `update-public.pem` contém apenas a chave pública de verificação. Este pacote é para teste local, sem canal público de atualização configurado.

## Integrações 0.1.0-local.20261008155037

DistroAV 6.2.1 oficial: https://github.com/DistroAV/DistroAV/releases/tag/6.2.1 ; GPL-2.0-or-later, licenças/origem em licenses/distroav/. NDI Runtime 6.3.2.0 apenas local em runtime/ndi-v6/, não redistribuído.

OMT 1.0.0.19 oficial: https://github.com/openmediatransport/omtplugin ; MIT para plugin/libvmx, licenses/omtplugin/. Verificação de hashes e origem: qa-ndi/receipt.json.

Leitor de caminhos de processos freemix-process-info.exe compilado da fonte GPL-2.0-or-later ferramentas/src/FreeMixProcessInfo.cs; apenas leitura de PID/caminho, sem automação da interface ou elevação.

## Integrações 0.1.0-local.20261008160415

DistroAV 6.2.1 oficial: https://github.com/DistroAV/DistroAV/releases/tag/6.2.1 ; GPL-2.0-or-later, licenças/origem em licenses/distroav/. NDI Runtime 6.3.2.0 apenas local em runtime/ndi-v6/, não redistribuído.

OMT 1.0.0.19 oficial: https://github.com/openmediatransport/omtplugin ; MIT para plugin/libvmx, licenses/omtplugin/. Verificação de hashes e origem: qa-ndi/receipt.json.

Leitor de caminhos de processos freemix-process-info.exe compilado da fonte GPL-2.0-or-later ferramentas/src/FreeMixProcessInfo.cs; apenas leitura de PID/caminho, sem automação da interface ou elevação.

### Correção do crash de 08/10 às 13:11 — 0.1.0-local.20261008162932

O relatório/PDB localizou o acesso inválido em RequestGetInterface durante destruição de QDialog/CEF. A consulta passou a percorrer somente a mesa/docks persistentes; os popups são removidos do registro antes da destruição adiada, com proteção contra reentrada. 48 ciclos reais de abertura/reabertura/fechamento de seis telas, com 3294 consultas concorrentes, passaram sem novo crash. Geometria da mesa, janelas independentes e ausência de duplicatas conferidas. Evidência: qa-portatil/resultado-crash-janelas.json. Relatório e binários originais preservados em archived/diagnosticos/crash-20261008-131138/. Presets, config e gravações não são substituídos. Essa correção não equivale a recuperação automática após crash nem homologação de longa carga.

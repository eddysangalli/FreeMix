# Fontes da entrega atual 000500 — Native21

A entrega 0.1.0-local.20261010000500 corresponde ao Native 4793d1a40f56ea9b6e887eb49189d937758e3b7f e aos fontes operacionais do Git3737e790945962df9feff07287e4dda3e07c054d. fork/manifest.json contém21 patches completos e docs/native-source contém187 snapshots. Aplicação dos patches reconstruiu a árvore7604633e921339aa65f40015dcc3175e26accfc7, verificada em fork/source-verification.json. Veja docs/BUILD-FROM-SOURCE.md.

Native21 passou por build configurada, startup instalado e fechamento normal; Replay/PCM/Master digital e diagnóstico OAuth instalado têm provas distintas em qa-finalizacao e docs. Fontes posteriores em desenvolvimento não alteram o payload selado000500. QR GTZIP offline está ativo e ainda não integra esta versão. Limites atuais em docs/PENDENCIAS-REAIS.md.

NDI6.3.2 e demais runtimes têm licenças/proveniência no pacote. Fontes e patches dos plugins reconstruídos estão em licenses/freemix-localvocal e licenses/freemix-sceneswitcher. NDI HDR exige Advanced SDK/licença e implementação; não é ativado pelo runtime padrão. Chave Ed25519 privada não pertence ao Git nem ao pacote. Créditos/licenças upstream são preservados.

## Proveniência histórica de versões anteriores

# Fontes posteriores a 213415 — em conferência

A série em fork/manifest.json já contém as alterações posteriores de SDI HDR e seek/EOF de mídia. Sua árvore foi verificada contra o Native; isso não muda o instalador 213415 nem comprova a aprovação do novo replay multicâmera. Leia docs/PENDENCIAS-REAIS.md e fork/source-verification.json para separar fontes, builds e ensaios.

# Fontes da entrega completa 213415

Estado em 2026-10-09T22:14:45.649Z. Native99e5944cf61aacc4c07167ef867d4ce52a752ae6, EXE1c045e5d43bae20eca9b15df50d73d297b9d433e381027eb861f0ff21f014744. As fontes/painéis operacionais estão no repositório FreeMix, com 14 patches completos sobre a base OBS fixada em fork/manifest.json; reconstrução em docs/BUILD-FROM-SOURCE.md. O pacote guarda snapshot das fontes Native e as licenças correspondentes.

NDI6.3.2.0 está incluído no pacote completo, em runtime/ndi-v6, com hash pinado e licença/proveniência/termos em licenses/ndi-runtime. O ambiente é configurado somente no processo, sem instalador global de NDI. Registros antigos abaixo que dizem "não redistribuído" descrevem as entregas anteriores. NDI HDR não é ativado com o SDK padrão; contrato e fonte oficial em docs/NDI-HDR-CONTRATO.md.

Os três DLLs LocalVocal/SceneSwitcher reconstruídos incluem patches, fontes oficiais e receitas sob licenses/freemix-localvocal e licenses/freemix-sceneswitcher. Node/FFmpeg incluem seus termos em runtime. A chave Ed25519 privada não pertence ao pacote nem ao Git.

A ponte SRT→NDI alpha é beta separada, com fonte main.cpp, cabeçalhos, licenças, dependências e manifest assinado próprios; não pertence ao instalador completo.

## Registros históricos preservados

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

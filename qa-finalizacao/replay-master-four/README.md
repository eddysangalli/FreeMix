# Replay A/B/C/D — Master digital Native21

**PASS**, oito segmentos reais do mix digital final0/track1 (Master), estéreo48k, em Native21 congelado `4793d1a40f56ea9b6e887eb49189d937758e3b7f`. EXE e DLLs foram conferidos pelos pins do freeze antes de abrir o clone. Não houve alteração de produto.

Quatro câmeras sintéticas próprias trazem contador binário30fps e tons distintos440/660/880/1100Hz. O DiskReplay real carrega os clipes em A/B/C/D; uma view QA mantém os quatro players renderizados enquanto o Programa da raiz própria alterna entre REPLAY A/B/C/D. Os originais ficam mutados e monitoramento de hardware desligado. O controlador real `applyPlayerAudio` determina mute/volume; a prova não injeta uma simulação dessa política.

O módulo **privado QA** `qa-master-probe.cpp` captura com `audio_output_connect(obs_get_audio(),0,...)`, depois da mixagem/mute/volume dos sources, em float32 planar L/R. Não é callback pré-Master. Callback usa buffers prealocados de180s/16384pacotes; stop desconecta antes de ler/gravar. A DLL, import library, objetos e PCM ficam somente na QA/TEMP e **não pertencem ao produto, pacote ou allowlist de Git**. O módulo só carrega quando a variável própria `FREEMIX_QA_MASTER_DIRECTORY` existe no ambiente do filho. A biblioteca de importação foi copiada uma vez do build21 já encerrado e fixada por hash; runtime executado veio exclusivamente do freeze21.

## Medições

- PGM A/B/C/D: amplitude do tom escolhido≈0.12497 nos dois canais; demais bins≤0.00009041. A pequena componente na janela DFT não é evidência de outro input audível: janelas finitas de tom produzem leakage espectral. Todas passam o limite de outro bin≤1.5% do escolhido (observado máximo≈0.0724%).
- Audio-disabled, Programa fora de REPLAY e arquivo alterado: PCM exatamentezero nos dois canais.
- Ganho−6dB: razão medida0.5011919, esperado0.5011872.
- Critérios fixados no script:≥1.5s por segmento, settling650ms, tom escolhido>0.02, outros<1.5% e silêncio absoluto<1e−5; ganho tolerância±0.06. Os critérios não foram ampliados para obter PASS.
- View liberada, fontes/cenas próprias removidas, saídas ativas0, `shutdown_idle.success=true`, exit0/776ms. Log próprio: memory leaks0, crash markers0. PIDs115392(primeiro ensaio) e60308(PASS) confirmados ausentes após término.

`resultado-harness-scope-fail.json` preserva a tentativa inicial: save() foi chamado pelo harness antes de scopeState(), causando argumento de rename indefinido; nenhum segmento capturado. Native encerrou cooperativamente exit0/687ms. A inicialização do harness foi corrigida e uma nova raiz exclusiva foi preparada para o PASS. Não é falha de produto nem hang. A primeira raiz permaneceu preservada como evidência própria; nenhuma limpeza foi feita fora das raízes QA.

## Receita e limites

Na raiz do workspace, com SDK/VS/import library correspondentes ao Native21: executar `build-probe.cmd` para o módulo QA, `node prepare.mjs --prepare`, `node make-media.mjs`, `node test.mjs` e `node analyse.mjs` usando os caminhos completos relativos desta pasta. `prepare.mjs` fixa especificamente o freeze21; não lê um rundir mutável para executar Native. Prévia de credenciais nunca é impressa. FFmpeg gera apenas mídia sintética dentro da raiz TEMP selecionada.

Esta prova fecha a lacuna **áudio exclusivo no Master digital com quatroplayers**. Não valida saída ASIO/placa, audição humana, dispositivos físicos, quatro câmeras físicas, drift de imagem, transientes de troca rápida, rede, reconexão ou endurance longa. As provas anteriores dessas outras propriedades mantêm seus próprios escopos. Não há SourceRecord nos players nem gravação externa; a captura é um consumidor do mix digital, encerrado antes do shutdown.

Somente os scripts/fontes QA, metadados de fixtures e recibos sanitizados entram em `ALLOWLIST.json`; PCM/CSV bruto, mídia, capturas, DLL/LIB/OBJ/EXP e logs nativos brutos são excluídos. Nenhum operador, pacote selado, build Native compartilhado, Git ou serviço público foi alterado.

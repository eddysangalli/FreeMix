# LocalVocal: encerramento cooperativo validado em 09/10/2026

O bloqueio do LocalVocal foi reproduzido e corrigido em fonte oficial 0.6.2, GPLv2, sem alterar instalações/configurações do operador. A evidência original em `qa-finalizacao/shutdown-native-stacks.txt` mostra o destroy worker esperando `whisper_ctx_mutex` enquanto a inferência usa whisper/OpenBLAS. O código upstream liberava o contexto antes de dar join e mantinha o abort callback comentado.

O patch sinaliza cancelamento atômico antes de tentar esse mutex, acorda a thread, dá join e então libera o contexto. A inferência verifica o sinal, usa abort callback nativo e não emite callbacks de texto/áudio depois do cancelamento. Whisper fica limitado a quatro threads e OpenBLAS a uma thread, após carregar seus backends. Não muda variáveis de ambiente da máquina. Também elimina o ponteiro global de logger para o filtro destruído e o ponteiro de prompt para uma string já destruída. Nada libera memória de contexto ainda em execução.

Entrega congelada em `delivery/`:

- `obs-localvocal.dll`: SHA256 `93d62d37950ad18ca35abcb15ba659235557097e47480be9a9c3b9b38a50c3ab`.
- PDB próprio para diagnóstico, patch de dez arquivos, LICENSE, fonte oficial ZIP e manifest com hashes.
- Fonte: https://github.com/royshil/obs-localvocal/releases/tag/0.6.2, commit curto 9235c55; ZIP oficial SHA256 `9bf8ab8b3fa913718cff29147958d8a4ddc75adb4ef1a7b5811c3119180ad319`.
- Build isolado MSVC 19.44 /W3 /WX, C++17, RelWithDebInfo, Qt 6.11.1, imports de libobs do FreeMix; `ENABLE_WEBVTT=ON` preservado. `build-localvocal.ps1` contém a receita. `build.log` confirma link do módulo completo.

Dependências fixadas pelo CMake oficial: Whispercpp generic 0.0.13 (`8653395b0ec3c9d931cf0647391850d249a67196b4f78ccf4d8dbf98ae30ed82`), CTranslate2 CPU 4.1.1 pacote 1.2.0 (`30ff8b2499b8d3b5a6c4d6f7f8ddbc89e745ff06e0050b645e3b7c9b369451a3`), Sentencepiece 0.2.0 (`846699c7fa1e8918b71ed7f2bd5cd60e47e51105e1d84e3192919b4f0f10fdeb`), ONNX Runtime 1.20.1 (`78d447051e48bd2e1e778bba378bec4ece11191c9e538cf7b2c4a4565e8f5581`), libcurl 8.4.0-3 (`bf4d4cd7d741712a2913df0994258d11aabe22c9a305c9f336ed59e76f351adf`), ICU 76.1 (`bedba77dd1feca09e9ae9922109a285c0ecf46d09c80b65eae6eae63a4e155dc`). A variável do hash ONNX tinha erro de digitação upstream, corrigido no patch. Corrosion v0.5 usado por fonte ZIP com SHA256 `ad854fcc34c78dad5dbb53829b62685d7465ca915f56e09c2e84d7d8d4de005b`; fontes Rust e Cargo.lock estão no ZIP oficial do plugin. Runtime do teste usou as DLLs já distribuídas na instalação QA, não instalou drivers. Preservar também as licenças originais de `licenses/obs-localvocal` e `licenses/whisper` ao substituir apenas a DLL.

## Provas reais

`test-native.mjs` cria perfil/coleção vazios em raiz TEMP exclusiva, porta websocket efêmera autenticada, identifica executable/PID, verifica nenhum output ativo e nenhuma captura física. Fala sintética portuguesa já existente na QA, pistas de áudio e monitoramento desativados, sem envio externo.

| Recibo do mesmo binário final | Português | Cancelamento durante whisper_full | Fechamento normal |
| --- | --- | --- | --- |
| resultado-native-final.json, PID 171832 | 6/7 expressões, incluindo notícias, previsão, chuva, trânsito, escolas, companhia | observado, contexto liberado depois da thread | 798 ms, exit 0 |
| resultado-cancel-2.json, PID 15920 | não é teste de qualidade linguística | observado | 826 ms, exit 0 |
| resultado-cancel-3.json, PID 138580 | não é teste de qualidade linguística | observado | 713 ms, exit 0 |

Em todos: limite real 4 threads Whisper/1 OpenBLAS observado no log, nenhuma exception, nenhuma limpeza forçada no PASS. Logs individuais preservados. O teste reconhece que tiny pode errar ou alucinar sílabas; não promete qualidade de microfone, sotaques, ruído ou endurance. A primeira expressão foi perdida nessa fonte sintética, sem alterar texto esperado para fabricar PASS.

## Bloqueio de outra extensão reproduzido e corrigido

Na primeira execução com Advanced Scene Switcher 1.36.1, LocalVocal cancelou e a thread saiu em 19 ms; `All scene data cleared` apareceu. Depois, o SceneSwitcher iniciou/continuou seu loop, chamando `obs_frontend_get_current_scene` sem callbacks a cada 300 ms, e o processo não encerrou em 12 s. Log exato preservado em `suite-shutdown-blocked.log`. O QA precisou terminar somente seu próprio PID após esse FAIL.

Os três PASS focados acima desabilitam apenas DistroAV e Advanced Scene Switcher no clone mínimo; não foram usados como prova da suíte inteira. Depois da correção do SceneSwitcher, a suíte real preservou suas 22 DLLs de subplugins/dependências carregadas, zero falhas de carregamento, e passou Start/Stop/Start via websocket. `resultado-suite-final.json` preserva português 6/7 e fechamento em 802 ms. As duas provas seguintes reabilitam também DistroAV com runtime NDI 6.3.2: `resultado-full-suite-cancel-2.json` (PID 77420, 876 ms) e `resultado-full-suite-cancel-3.json` (PID 204488, 892 ms), ambas exit 0 e cancelamento real observado. Os logs mostram inicialização NDI 6.3.2.0 e parada do worker de automação antes da destruição do frontend. Não iniciam saída NDI nem capturam hardware.

O PID antigo 138940 foi encerrado somente após autorização do coordenador e conferência do ExecutablePath contra o recibo original, preservando stack/log/FAIL. `cleanup-old-qa.json` registra essa limpeza específica; nenhuma instância do operador foi encerrada.

## Receita portátil executada

`resultado-portable-recipe.json` e `portable-recipe-3.log` documentam extração oficial, hashes de fonte/Corrosion, aplicação do mesmo patch e compilação integral em SourceDir/BuildDir novos, WebVTT ON. A receita exige CMake explícito, aceita SDKs/imports como parâmetros, normaliza caminhos CMake e limita descoberta automática a deps x64. As duas primeiras tentativas falharam em configuração (escape de caminho Windows e descoberta de deps x86); foram corrigidas, sem alterar o candidato congelado. O build portátil concluído possui hash diferente porque os caminhos/build são diferentes; não substitui a DLL já testada nem promete compilação binária reproduzível.

Não há validação aqui de GPU Whisper, tradução CTranslate/cloud durante encerramento, uso prolongado ou mais de um filtro simultâneo. Não foi alterada a mesa, reiniciada API do operador, feita instalação de driver, transmissão, commit ou push.

# Source Record — áudio independente em ISO

Corrigida a captura silenciosa de barramentos independentes `freemix_audio_bus` com todas as trilhas globais desligadas. A versão instalada era Source Record 0.4.8. O fork local usa a fonte oficial no commit `9b5fe689e09d7ddce283ef66bec56a491956114c`, também 0.4.8, com identificação `0.4.8-freemix-private-bus1`.

O caminho original lê `obs_source_get_audio_mix(source).output[0]`; com mixers=0 esse buffer não contém o áudio. A correção registra `obs_source_add_audio_capture_callback` somente quando a fonte explicitamente selecionada é um barramento FreeMix independente, mantém PCM float estéreo em um buffer de 2 segundos e alimenta o `audio_output_t` privado já existente do plugin. Usa taxa do projeto e leitura com margem de 50 ms; respeita mute/volume e não altera nenhuma trilha pública. Fontes comuns e Master/A/B continuam no caminho original.

A capacidade `freemix_premix_bus_capture:true` vem dos defaults nativos do filtro, consultáveis por `GetSourceFilterDefaultSettings` ou `audio_capabilities`. Não é inferida de configurações enviadas pelo usuário. A seleção por UUID e resolução do nome atual no início do ISO pertencem ao módulo de ISO, com validação de mixers=0.

Os callbacks são removidos antes de liberar o contexto em filter_remove/destroy; a atualização de um contexto em fechamento não pode reanexar o tap. A primeira DLL experimental demonstrou PCM mas falhou ao remover a cena: um callback permanecia registrado após liberação do contexto. O relatório de crash está preservado em `source-record-private/crash-preserved.txt`. Essa DLL foi rejeitada. A DLL final inclui a correção de lifecycle e foi testada novamente.

## Evidência final

- `source-record-premix-nativo.json`: **7 verificações aprovadas**. Arquivo MPEG-TS com AAC, PCM decodificado RMS superior a 0,01 e pico superior a 0,03; barramento continua fora de todas as trilhas globais; remoção do filtro e da cena preserva o motor responsivo.
- `source-record-premix-qa-fechada.json`: encerramento normal pelo `shutdown_idle` com salvamento, PID 119616 terminado. Nenhuma instância do operador foi fechada.
- DLL final SHA256: `63e4f4c4fe77382b24eb03085a62e3da7ac8e77554be5f6f94dcf17c885987e8`.
- Motor do teste SHA256: `35678e1657509e2a5c1c1153b3e0f1915018668e161b44dc76c741388204298e`.
- `source-record-inventario-copia.json`: 9 arquivos com SHA256, `lifecycleVerified:true`. Contém DLL, código modificado completo, fonte upstream completa fixada por commit, GPL-2.0, proveniência e instruções de reprodução. Não inclui PDB.
- `iso-audio-source-nativo.json` e `iso-audio-bus-final-qa-fechada.json`: **4 verificações integradas aprovadas** pela frente Calls/áudio usando a DLL final; UUID → renomear → iniciar ISO → PCM real, cleanup direto sem workaround e fechamento normal.

O plugin principal em `obs-vmix/obs-plugins/64bit/source-record.dll` permanece sem alteração enquanto o operador está aberto. A nova DLL deve entrar somente na entrega versionada e ser aplicada com o motor correspondente fechado.

Não foi feita homologação longa de sincronismo audiovisual, formatos surround, hardware externo ou dispositivo físico. A captura foi exercitada em estéreo 48 kHz com sinal sintético local. Referência oficial: https://github.com/exeldro/obs-source-record .

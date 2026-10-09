# ISO com fonte de áudio por UUID

Implementado em `obs-vmix/ferramentas/replay-disco.mjs` e na tela ISO (`controle.js`, `iso.html`, `iso-avancado.js`). A seleção global e por entrada persiste UUID, resolve o nome atual somente na criação do filtro SourceRecord e preserva os modos Entrada, Master, A, B e todas as trilhas.

Fontes privadas são excluídas por UUID do microfone do diretor e tipo nativo dos retornos, inclusive após renomear. Fontes públicas comuns exigem trilha 1 disponível porque o SourceRecord original lê essa saída. A disponibilidade é revalidada antes de iniciar e durante o estado; uma mudança que torne a fonte inválida interrompe o ISO, com diagnóstico explícito.

Barramentos independentes só são oferecidos quando o motor confirma `source_record_bus_capture`, consultado nos defaults do plugin instalado (`freemix_premix_bus_capture`). Além disso, as seis trilhas globais precisam estar desligadas. O fork pequeno SourceRecord com callback PCM premix é responsabilidade da frente Outputs; a opção não altera as rotas do Master.

## Evidência

- `iso-audio-source-logica.json`: 4 verificações de UUID, compatibilidade e exclusão privada.
- `iso-audio-source-folha-nativo.json`: 5 verificações de fonte pública real, nome atualizado e interrupção quando a trilha 1 deixa de estar disponível. PCM RMS 0,032 e pico 0,131.
- `iso-audio-source-nativo.json`: 4 verificações integradas do bus independente com DLL final corrigida; PCM RMS 0,0323, pico 0,069 e 238592 amostras, mantendo trilhas globais desligadas.
- `iso-audio-bus-integrado-ui.json` e PNG: seletor global e por entrada exibem o bus por UUID e capacidade real.
- `iso-audio-bus-integrado-build.json`: hashes do EXE e DLL privados usados nessa prova.

A primeira DLL provou captura, mas apresentou falha de teardown na QA paralela da frente Outputs. Foi desanexada com contexto ainda válido antes da limpeza da nossa QA (`iso-audio-bus-antigo-desanexado.json`), que fechou normalmente. A frente Outputs corrigiu a remoção de callback em `filter_remove` e `destroy` e bloqueou reassociação durante o fechamento.

A DLL final SHA256 `63e4f4c4fe77382b24eb03085a62e3da7ac8e77554be5f6f94dcf17c885987e8` passou novamente a prova integrada do ISO. A limpeza seguinte removeu diretamente a cena, filtro e bus, sem o workaround manual; `get_interface` e `GetOutputList` responderam e o fechamento normal levou 1,8 s. `iso-audio-bus-final-qa-fechada.json` confirma Native PID117872 e API121096 encerrados, saídas ociosas e operador preservado. `iso-audio-bus-primeira-dll.json` preserva a evidência da versão anterior sem confundi-la com a final.

## Limites

- Esta extensão é do ISO. Destinos nativos de transmissão, NDI e OMT ainda escolhem trilhas M/A/B; uma seleção direta de bus UUID nesses destinos exige contrato nativo adicional. Não foi criado seletor silencioso.
- A fonte pública comum pode perder trilha 1 por roteamento automático; nesse caso o sistema interrompe e orienta usar Entrada/Master/A/B ou um bus independente comprovado.
- A medição PCM sintética comprova arquivo e isolamento de trilhas, sem equivaler à homologação de escuta, ASIO físico, Direct Out físico ou internet.
- Nenhuma instância, configuração ou porta do operador foi alterada. QA exclusiva WS14476/API18098.

`asio-inventario-copia.json` contém três arquivos do ASIO oficial com destino, SHA e licença para o pacote; a presença de drivers não comprova captura física.

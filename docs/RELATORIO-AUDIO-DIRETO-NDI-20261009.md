# Áudio direto por UUID e runtime NDI — 2026-10-09

## Implementado e demonstrado

`FreeMixSourceAudio` cria um contexto PCM estéreo próprio a partir de um `freemix_audio_bus` público por UUID. O bus precisa estar habilitado e com todas as trilhas globais desligadas. O tap possui buffer próprio, lease de atividade, silêncio imediato para mute/privacidade, remoção sincronizada do callback e encerramento da thread antes de liberar contexto. Nenhuma rota Master/A/B é alterada. Fontes folha, mic de diretor e retorno não são seleções diretas desse caminho. O próprio bus continua validando os membros e rejeita fontes privadas/cíclicas.

Destinos Native independentes (gravação/transmissão e Mix com Stinger) e senders NDI/OMT recebem `audioSourceUuid`; vazio mantém as trilhas Master/A/B anteriores. Encoder compartilhado recusa UUID de bus porque não pode alterar seu áudio de forma independente. UUID persiste no perfil e não depende do nome. A remoção/invalidação da fonte silencia o tap e interrompe a saída; não troca silenciosamente para Master. Seletores usam apenas buses enumerados pelo Native com `audioSourceSelectable` real.

`audio-direto-nativo.json`: **9 PASS** em QA exclusiva WS14476/API18098, EXE `ef523cbb598b138044aa7b9960ee06efdd1beb510cbb7df8fdbb9bff87b2aa64`. Inclui UUID salvo/renomeado, AAC real (RMS >0,025), SRT loopback AAC dominante 440 Hz, NDI e OMT com vídeo verde e PCM dominante 440 Hz, seis trilhas globais desligadas, rejeição de UUID folha/mic, Stop e remoção de bus sem perda de resposta. Receivers oficiais registraram NDI 121 frames vídeo/188 áudio (RMS 0,045824), OMT 111/174 (RMS 0,045893). `audio-direto-logica.json`: **4 PASS** de contrato/guardas Node. A mídia sintética usa explicitamente `restart_on_activate:false` e mute desligado; o primeiro fixture parado não foi apresentado como falha do transporte. A frequência final usa FFT, adequada ao AAC, em vez de contagem de cruzamentos de zero.

## NDI 401 / runtime 6.3

A imagem enviada mostra ausência da biblioteca no processo, sem identificar de forma suficiente sua raiz/PID. A fonte oficial DistroAV 6.2.1 `src/plugin-main.cpp`, `load_ndilib()`, confirma que no Windows procura somente `NDI_RUNTIME_DIR_V6`. Não se afirmou que o operador abriu um executável específico. Logs da instalação anteriores e da QA demonstram NDI SDK 6.3.2.0 compatível; isso não corrige retroativamente uma janela já aberta sem a biblioteca.

Novo `ferramentas/ndi-runtime.mjs` valida PE x64, versão ≥6.3, API v6, SHA256 pinado do SDK oficial e presença de licença/proveniência. O launcher recusa abertura incompleta antes do spawn, configura o caminho somente no ambiente do processo e, após conectar, exige a fonte NDI realmente registrada. Uma janela existente sem NDI recebe uma mensagem clara; nenhuma janela é reiniciada. O instalador exige os arquivos assinados da dependência, valida antes da cópia e grava o recibo da preparação. Não instala SDK/Tools globalmente nem modifica permanentemente variáveis Windows.

O pacote anterior excluía a DLL baixada sob licença genérica de runtime, marcada `LOCAL-ONLY.json`; esse marcador foi preservado. A nova origem é **SDK6 oficial**, baixado e extraído sem executar instalador. Seu `Bin/x64` contém a mesma DLL 6.3.2.0, SHA `2b6602075868ba4401f82f417d72424805d69b11ca86078023d0d489ff45dd84`. A licença SDK e Documentation4.2 permitem distribuir o binário do SDK no produto conforme suas condições. `ndi-runtime-inventario-copia.json` limita a cópia à DLL, contrato SDK, licenças de terceiros, proveniência e termos. Nenhum SDK inteiro/Tools/utilitário acompanha a entrega. Links NDI e atribuição de marca/contrato foram incluídos na entrada NDI da Mesa, Saídas e About/Settings.

Fontes primárias: https://github.com/DistroAV/DistroAV/blob/6.2.1/src/plugin-main.cpp ; https://docs.ndi.video/all/developing-with-ndi/sdk/software-distribution ; https://downloads.ndi.tv/SDK/NDI_SDK/NDI%20SDK%20License%20Agreement.pdf .

## Conferência final curta

`ndi-runtime-logica.json`: **6 PASS** (SDK real pinado, PE truncado/x86/6.2/ausente recusados, ambiente herdado substituído somente na abertura). `ndi-runtime-integrado.json`: launcher confirmou NDI carregado e 6.3.2.0. `resultado-final-candidato-integrado.json` foi atualizado com **4 PASS**: identidade/hashes atuais, fontes reais ASIO/NDI/OMT/bus e SourceRecord premix, motor/API/barramentos com outputs ociosos e nove rotas incluindo diagnóstico HTTP200. Native final `ef523cbb…`, obs-ffmpeg `2376ee21…`, SourceRecord `63e4f4c4…`, NDI `2b660207…`. Não se repetiu a bateria de áudio na conferência.

QA foi fechada normalmente; recibo `ndi-runtime-qa-fechada.json`. Instância/preset/configuração do operador e pacotes já selados permaneceram intactos.

## Limites reais

- Prova de transmissão usa SRT loopback e receivers locais dos SDKs NDI/OMT, não servidores da internet, rede WAN ou placas físicas.
- Buffer software do bus mais tap acrescenta aproximadamente duas etapas de 50 ms; não representa latência completa medida de ponta a ponta nem sincronismo/genlock homologado.
- AAC e SDKs entregaram PCM real dominante 440 Hz; carga longa, múltiplos dispositivos físicos, Direct Out/ASIO audível e drift sob carga não foram homologados nesta prova.
- Fontes folha não são oferecidas diretamente nestes destinos; primeiro compõem um bus independente público validado. ISO já possui contrato separado comprovado anteriormente e não foi retestado aqui.
- A nova entrega deve ser aplicada e a próxima abertura ocorrer pelo atalho integrado. Nenhum runtime foi injetado numa janela já aberta, e o operador não foi reiniciado.

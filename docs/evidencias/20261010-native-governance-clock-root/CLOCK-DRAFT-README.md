Diagnóstico de relógio da mídia — draft offside r2
================================================

Não aplicado, não compilado e sem execução Native. O Gate6 permanece FAIL, com seus limites originais. A análise offline demonstra uma sequência admissível 2702 → 33 → 0 dentro de um único reset; não determina a causa das três amostras reais.

Integração proposta: os cinco arquivos e hashes de `INTEGRATION.json`, sem CMake ou novos arquivos de produto. `GetMediaInputStatus` mantém seus campos antigos e adiciona opcionalmente `mediaClock` para `ffmpeg_source`. Native antigo continua respondendo sem esse campo. Não há comando, seek, restart, mudança de tolerância ou ativação de recurso novo neste contrato.

Contrato `mediaClock.contractVersion = 1`:

- `sourceUuid`: identidade real da fonte adquirida pelo request; não usar nome para correlacionar uma fonte recriada.
- `supported`: só true depois de uma publicação do decoder normal. Full decode/cache retorna false: seu decoder antecipado não representa o cursor de reprodução.
- `generation`: identidade local da instância do decoder; muda ao abrir/inutilizar um decoder. Não é um contador global nem uma assinatura persistente.
- `revision`: ordem monotônica de snapshots na mesma geração; callbacks reordenados/antigos são descartados.
- `epoch`: incrementa no início de cada `mp_media_reset`, inclusive inicialização e loop. Não significa necessariamente um comando de restart do operador.
- `requestedResets` e `completedResets`: pedidos da API interna play/stop e pedidos capturados no último reset concluído. Pedidos podem coalescer. São observação, sem ID/ACK de operação.
- `presentedValid`, `timestampSource`: distinguem `submitted-source-pts`, `decoder-base-fallback` e `unavailable`. O campo `submittedCursorMs` deve ser ignorado quando `presentedValid` for false ou `supported` for false.
- `resetInProgress`, `resetPending`, `resetReady`: ready exige PTS válido, nenhum reset pendente/em andamento e pedidos completados. Não exige PGM ativo nem confirma transporte, exibição de um quadro, áudio, seek ou duração.
- `timestampDomain = submitted-source-pts-before-wall-conversion`: PTS submetido à etapa de callback da fonte, antes de converter para relógio de parede. A publicação ocorre antes do callback; não é confirmação de quadro exibido.

Concorrência e lifecycle
----------------------

O decoder forma o snapshot sob seu mutex existente e libera esse mutex antes de chamar o observer. O observer só copia para o mutex próprio da fonte; não aloca, não chama Qt/GUI, não acessa a WS e não espera um join. O getter lê exclusivamente essa cópia, sem tocar `s->media`, buffers de FFmpeg ou o mutex de reconnect. Antes de cada destruição do decoder, a geração é invalidada e o mutex próprio é liberado; o join existente termina antes de destruir o mutex da fonte. O WS mantém a referência AutoRelease da fonte durante a proc, copia o JSON antes de liberar calldata, restringe a proc a ffmpeg_source e ignora JSON inválido/versão não inteira.

O diagnóstico e os campos legados cursor/state/duration não são uma transação atômica conjunta. Um consumidor deve correlacionar UUID + geração + epoch + revision do diagnóstico, sem concluir que o cursor legado lido separadamente pertence ao mesmo instante. Um erro de preparação deixa resetInProgress=true e ready=false até outro decoder/reset válido. O contrato não altera o comportamento existente ao parar/pausar/seek.

Custo e limites de verificação
-----------------------------

Há dois trechos curtos adicionais de mutex por publicação (decoder/source), sem alocação por quadro. JSON aloca apenas ao consultar a proc. O custo real e a ausência de deadlocks precisam de build e QA Native próprios pelo Root; não há benchmark ou ThreadSanitizer neste draft. Os 32 checks são modelos puros com os predicados reais extraídos do C e verificações de contrato/source/lifecycle. Não homologam decoder, GUI, libobs, SDK ou GPU. O cursor e a função de seek antigos foram comparados byte a byte.

Revisão r1 preservada na pasta pai. O r2 corrige a falsa disponibilidade em cache/full_decode e a consulta WS de proc/JSON em outros tipos de fonte. `gate6-cursor-offline-preparation-fail.json` preserva um primeiro erro de locator de QA; nenhuma execução de mídia ocorreu.

Próximo gate de integração: Root revisa/aplica os cinco patches após fechar App30; build coerente do motor/obs-ffmpeg/obs-websocket; observação de um restart real, fallback→submitted e generation ao substituir/remover fonte; shutdown cooperativo e full post-pins. Só depois pode-se propor um novo contrato de barreira. Não executar o Gate6 novamente nem afrouxar seu critério histórico.

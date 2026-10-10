# Meter30: regressão real passou

Duas conexões InputVolumeMeters65536 e três fontes próprias PCM440/660/880Hz. Foram observados39/39 eventos na janela2s. Pausa, retomada, unsubscribe/resubscribe, troca de coleção e recriação de UUIDs passaram sem evento rejeitado/valor inválido: níveis0..0,25. Dois clientes permaneceram inscritos durante o fechamento cooperativo.

Native138012 fechou, avisosMeter0/alocações0/objetosrestantes0/doubledestroy0/crash0; full2085 origem/destino pós-close conferido, helperspendentes0. Fonte do operador preservada. FAIL29 permanece, não é reclassificado. Os dois erros de schema no preflightRoot aconteceram antes de abrirNative e foram preservados; a correção do harness lê teardown por caso/exit.code.

Esta execução finita comprova os cenários descritos. Não reproduz todos os crashes antigos nem garante callback-in-flight determinístico, hardware, N-1 ou qualquer mesa. NenhumAPI/CEF/Calls/FTB/instalador foi reensaiado aqui.600 continua selecionado; próximo pacote ainda pendente.

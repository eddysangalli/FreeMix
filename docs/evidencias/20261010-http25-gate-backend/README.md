# HTTP real e controle final de vídeo

Native25/30fps em raiz própria: Cut100,38ms, Preview37,41ms e exclusão fora do ar93,63ms. Corte terminou enquanto duas consultas periódicas HTTP de4s permaneciam pendentes. ID duplicado não enviou chamadas Native; ID conflitante e exclusão no ar foram recusados. Conferência somente GetSceneList/GetSceneCollectionList/GetCurrentSceneTransitionCursor preservou Programa/Preview. Não é benchmark de GPU/carga/WAN.

Editor Properties observado pela API Qt com UUID correto, visible/activeWindow/focusWithin. Isso não comprova ordem real das janelas no Windows. IAB não foi observado durante o hold; minimizar/restaurar e aceitação visual continuam pendentes. API encerrou por sinal emitido dentro do próprio subprocesso; Native shutdown_idle aceito, contador0/Meter0/crash0.

Controle do gate final integrado com qualificação startupfalse, consulta GET local, ID/dedup, prazo5s e consulta sem reenviar.36 casos:30 de helper/controle/rota reais extraídos com fixtures e6 de UI opcional mock não instalada.17 regressões de Programa/PCM sintético e closure81 ferramentas/2 browser passaram. Não há UI beta montada nem qualificação do FTB geral. Pixels/saídas/audio reais do Native26 continuam pendentes; nenhuma mudança no operador ou instalador600.

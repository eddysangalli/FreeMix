# Mesa R4: ausência de ISO confirmada, erro preservado

Único alvo offside: `FreeMix/painel/mesa.html`. Baseline canônica `29d158e2...` preservada. R2 e R3 permanecem byteidênticas e seus recibos são históricos, não alterados.

A R3 tratava `GetSourceFilter` opcional por `tryReq`: filtro ausente e timeout viravam `null`, podendo pintar uma cena ainda gravando como parada. A R4 substitui esse pedido por **um** `GetSourceFilterList` obrigatório por cena quando a capability ISO está disponível. `filters: []` confirma ausência. Timeout, resposta incompleta ou entrada malformada não confirmam ausência: a leitura falha e preserva todo o snapshot anterior. O filtro encontrado mantém exatamente `filterEnabled && record_mode === 1`. A capability `hasIso` também é capturada e validada antes/depois de cada GET e antes do commit.

Contrato confirmado no Native local: `RequestHandler_Filters.cpp:59` retorna `filters`; `Obs_ArrayHelper.cpp:334` produz `filterName`, `filterEnabled` e `filterSettings` para cada entrada. Ambos são pins somente leitura na integração. Não foi adicionado um segundo GET de settings por filtro, nem alterado comando/ação de MultiCorder.

54 testes de funções reais VM passaram: os 39 casos anteriores permanecem, e há reprodução da falha R3, sete respostas de filtros desconhecidas/malformadas preservando gravação e snapshot, lista vazia, quatro modos/enabled de ISO, mudança de capability durante await e identidade dos helpers restantes. Sintaxe do HTML inline completo e do teste é verificada com Node600 pinado; diff roundtrip e todos os pins anteriores também são conferidos.

`mesa.patch` é baseline→R4; `r3-to-r4.patch` é apenas o delta de revisão. Não houve alteração canônica, Native/API/browser/build nem medição de latência ou z-order. Uma leitura desconhecida mantém o último estado confirmado; isso não prova que o motor continua gravando. O problema do editor atrás permanece pendente de reprodução real.

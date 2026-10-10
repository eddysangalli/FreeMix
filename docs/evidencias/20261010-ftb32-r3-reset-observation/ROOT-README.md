# FTB32 R3: observação concluída; reinício continua FAIL

Root executou uma raiz própria e uma única açãoRESTART. A cena Programa distinta confirmou UUID original ativo/visível antes da medição.32 modelosRoot passaram. Native84792 fechou cooperativamente exit0/alloc0/crash0; CIM ausente e2085origem+2085destino/27textos/49externos/3extras matched.

Critério original permanece FAIL: antes1601, depois1634→33→0. A amostra33 usa decoder-base-fallback, presentedValidfalse/resetReadyfalse, epoch2; amostra0 usa submitted-source-pts válido/resetReadytrue, mesma epoch2. Houve uma epoch e um reset observado; não repetir/omitir a amostra para passar. Isso fornece diagnóstico atual, não atribui automaticamente toda falha histórica.

Root inspecionou e rehashou quatro capturas fonte: barcodes43/10/40/115. Áudio digital Master estéreo440/880Hz e avanço no interior do arquivo passaram. Captura fonte e submittedPTS antes do callback não são reconhecimento da tela física, PTS de áudio da fonte nem sincronismo AV/WAN. OBSERVATION_COMPLETE refere-se somente à coleta; fullFTBPass=false e legacyResetPass=false continuam explícitos. Gate final ficou desligado, sem ativar SRT/FTB/equipamentos.

Próximo: corrigir/qualificar a barreira de readiness no reset e o uso do fallback em cópia de fonte isolada; compilar novo Native somente após revisãoRoot e manter o mesmo critério de reinício.

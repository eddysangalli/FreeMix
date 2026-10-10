# Meter finite/mutex — revisão2 offside

Preserva a AL16 anterior; parte somente das cópias baseline congeladas, sem ler/escrever SDK/canônicos durante o build Root. As mesmas duas fontes recebem oito mudanças mínimas: histórico inicializado/resetado, guards Peak/RMS0frames, `_muted=false`, `_magnitude={}`, `_peak={}`, leitura do mute/volume depois de adquirir o mutex compartilhado com o callback.

GetMeterData promove a weak source como antes; níveis e volume passam a ser observados sob o mesmo lock. Não muda ownership, callbacks, subscription/shutdown, não clampa entrada inválida nem relaxa oracle. CRLF preservado. O FAIL29 ainda não tem os valores rejeitados, portanto não se afirma causalidade única.

Modelo CPU extrai GetMeterData e os quatro métodos aritméticos/reset/canais de baseline e draft. Fronteiras weak-source/time/name/UUID/logger são stubs explícitos; arrays e mute da baseline do modelo são inicializados deliberadamente para nunca executar leitura indeterminada. Concorrência executada só no modelo fixado, com writer sob o mesmo mutex; baseline corrida não é executada. Testa leitura antes de callback, mute/níveis coerentes, decay/reset e guards RMS/peak. Não afirma callback timing real ou ThreadSanitizer.

MSVC normal/AddressSanitizer ficam em model-build próprio, sem TU/plugin/Native nem áudio/GPU. ASan não detecta race de dados ou uninitialized reads; essas partes têm evidência de estrutura/ordem e modelos, aguardando Root integrar e congelar Native30.

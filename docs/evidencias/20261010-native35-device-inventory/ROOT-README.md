# Native35 — menus sem descoberta automática de dispositivos


## Native35 — inventários explícitos de áudio e SDI; compilado, teste real pendente

Root integrou onze arquivos de produto (seis Native/cinco painel) após repetir25modelos áudio e13SDI e verificar as revisões independentes. Leituras de áudio usam inventários cacheados sem criar sessão/timer ASIO nem enumerador WASAPI. Atualizar dispositivos consulta explicitamente. SDI/destinos leem cache; Consultar placas e modos faz refresh explícito e configure/start revalidam. IDs salvos ausentes permanecem indisponíveis, sem escolher outro driver automaticamente. Parar Direct Out existente continua possível sem inventário e sem criar filtro. Configure ASIO registra imediatamente invalidação de perfil/coleção; watchdog permanece.

Native35 5b680a17a1db65c66ce6a696f1da8ca69d29f49e ALL_BUILD/2085arquivos rehash/35patches/3submódulos/231snapshots/reconstrução--checkPASS. Fonte 0.1.0-local.20261010175421 somenteDEV. Nenhum Native35 iniciado. App34 bloqueado original preservado; App35 precisa snapshot/classificação atual e QA real com zero comandos/mutações ao abrir menus. Dirty-form DirectOut está em revisão separada: polling ainda pode sobrescrever uma escolha pendente até essa correção. Não há prova física de ASIO/SDI/HDR, hotplug ou latência/watchdog. Flags de inventário não certificam hardware.

Gemini foi priorizado: áudio recebeu resposta vazia/exit0 e SDI timeout vazio; fallback operacional documentado, sem alegar cota. Revisão compacta de áudio retornou2334bytes/31,9s e recebeu crítica independente. Setup600 permanece selecionado e imutável. [Fontes, pinos e limites](evidencias/20261010-native35-device-inventory/ROOT-README.md).

Este checkpoint é de fonte/build. Testes CPU não comprovam desempenho visual, áudio físico ou segurança universal.

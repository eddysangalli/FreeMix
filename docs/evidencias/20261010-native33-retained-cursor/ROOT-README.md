# Native33: cursor submetido retido durante reset

HEAD c990c4a39c445542d363f6950fb8f7f70811034a, árvore 0e75a5cebabd8587940a8f48829b2e24d60e362c. Root integrou somente três fontes retained-r2, repetiu19 modelos e preservou as195 amostras/FAIL Native32. O getter consulta o último PTS válido sob mutex; deixou de consultar o próximo PTS do decoder durante reset. Isso elimina aquela leitura concorrente e evita expor33ms futuros antes do primeiro frame0. Não confirma callback, tela ou áudio físico.

Configuração e ALL_BUILD passaram; runtime completo2085 arquivos foi congelado e rehashado independentemente. Exportação33 patches/3 submódulos/231 snapshots e reconstrução --check PASS. Fonte 0.1.0-local.20261010161000 é desenvolvimento. Nenhum Native foi iniciado nesta rodada. Setup600 e freezeNative32 permanecem imutáveis.

Timestamp inválido agora é rotulado invalid-submitted-source-pts e inclui legacyCursorPolicy explícita; o antigo observador estrito requer nova versão de diagnóstico. Os critérios originais de reset continuam iguais, todas as amostras serão preservadas. O modelo prevê PASS do oracle legado, mas FTB permanece sem qualificação até prova Native33 real. Cache full-decode, seek/pausa/VFR/audio-only e endurance conservam seus gates reais.

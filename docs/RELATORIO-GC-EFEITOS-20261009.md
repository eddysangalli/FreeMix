# GC, sincronização H/V, transformação 3D e tracking PTZ

Implementação concluída nesta frente em 09/10/2026. A instalação do operador, a API 8088 e seus presets não foram usados. Ensaios locais na raiz privada `FreeMix-QA-GC-Efeitos-20261009`, API 18230, WebSocket 14530. Nenhum serviço externo recebeu mídia ou dados.

## Funcionalidades entregues

- Conversor GTZIP amplia formas vetoriais para Ellipse, Polygon e Path válidos, com preenchimento sólido, contorno e opacidade. XML com atributos em aspas simples/duplas e entidades básicas é interpretado. Zoom e Rotate geram transformação real; durations/delays/easing possuem limites. Nós, brushes e animações não suportados geram diagnóstico explícito. DOCTYPE/ENTITY são rejeitados.
- Biblioteca própria: variantes horizontal/vertical compartilham estilo e parâmetros de animação none/fade/slide/zoom/rotate. Relógio e início de animação usam epoch comum; editar texto mantém o relógio. Ação explícita `gc_library_clock_restart` reinicia o grupo vinculado. Saída respeita a duração configurada.
- HTML local compatível: `/gc-html` vincula duas fontes browser por UUID. Manifesto FreeMix GC v1, campos e estilos declarados são obrigatórios. Atualização, play/stop e restart são enviados por eventos OBS Browser aos dois nomes distintos com o mesmo epoch. Persistência por projeto; falha de transmissão reverte o estado salvo. Operar a página não muda Programa.
- Shader original `transform3d.shader`: rotação XYZ, posição XYZ, escala/pivô XY, perspectiva/FOV e projeção ortográfica de um plano com a imagem da entrada. Integração ao editor existente, sem instalar StreamFX. A prova nativa preservou a fonte compartilhada sem filtros diretos.
- Face Tracker PTZ: integração real do filtro `face_tracker_ptz`, VISCA-over-TCP, alvo facial XYZ e ganhos limitados. Verifica capability e fonte de vídeo pública/visível. Mic privado e fontes de retorno/barramento não são alvos. Não chama presets nem faz zoom-out automático ao perder o rosto. Parar remove o filtro e encerra o transporte do plugin.

## Evidência

| Recibo | Resultado |
|---|---|
| `resultado-gc-efeitos-nativo-rodada.json` | 3 PASS: imagem transformada no shader, pan/tilt VISCA TCP efetivo para receptor loopback, teardown responsivo |
| `resultado-gc-gtzip-rodada.json` | 5 PASS: conversão/diagnósticos, parâmetros, biblioteca H/V, protocolo HTML e browser real H/V; fase de animação com diferença de 6 ms |
| `resultado-gc-efeitos-ui-rodada.json` | 3 PASS: vínculo UUID e dados/estilo/clock pela API real, controles 3D/PTZ visíveis, Programa preservado e zero erros JS |
| `gc-efeitos-qa-fechada.json` | PASS: `shutdown_idle` com `qaClose:true`, motor fechado normalmente e API própria encerrada |

Capturas: `transform3d-nativo.png`, `ptz-native-before-filter.png`, `ptz-tracking-nativo.png`, `gc-timeline-horizontal.png`, `gc-timeline-vertical.png`, `gc-html-ui-rodada.png`, `efeitos-xyz-ptz-ui-rodada.png`.

## Arquivos do produto

Novos: `ferramentas/gc-html-producao.mjs`, `ferramentas/efeitos-ptz.mjs`, `painel/efeitos/transform3d.shader`, `painel/remoto/gc-html.html`, `painel/remoto/gc-html.js`, `painel/gc/COMPATIBILIDADE-HTML.md` e 22 sidecars `painel/gc/biblioteca/*.html.freemix.json`.

Alterados: `ferramentas/gtzip_converter.mjs`, `gt_utils.mjs`, `gc-biblioteca-producao.mjs`, `gerar-biblioteca-gc.mjs`, `efeitos-producao.mjs`; `painel/gc/gc.js`; fontes `biblioteca/modelos.mjs` e `player.mjs`, seus arquivos gerados e páginas/metadados da biblioteca; `painel/remoto/gc.html`, `gc.js`, `efeitos.html`, `efeitos.js`. O gerador preservou os cinco modelos originais/importados e os 22 próprios. Root integrou exclusivamente `controle-producao.mjs` e `servidor-api.mjs`.

## Contratos de integração

- `GCCompatibleEngine(p)` em `gc-html-producao.mjs`: `setScope(scope)`, `summary()` assíncrono apenas sob GET, `execute(action,d)`; produção mantém `.last` após execução. Página e GET `/api/gc-compatible` locais. Ações `gc_html_link/update/play/stop/clock_restart/unlink` locais.
- `gc_library_clock_restart {id}` deve continuar local; não colocar sua ação em macros remotas permissivas.
- `effects_filter` novo tipo `transform3d`; `effects_ptz {key, enabled, settings}` passa pela Engine existente. Capability `transform3d` depende de shader_filter; `ptz` de face_tracker_ptz. O contrato PTZ não declara movimento físico confirmado.
- Documento do autor HTML: `painel/gc/COMPATIBILIDADE-HTML.md`. Novos arquivos de shader/JS são necessários nos incrementos e pacote completo.

## Limites reais

- GTZIP proprietário universal continua fora do conversor: grupos/meshes/partículas/shaders/vídeos/sequências e efeitos complexos não foram reproduzidos. Shapes com brush não sólido são diagnosticadas. Este avanço não equivale ao motor GT nativo do vMix.
- HTML arbitrário não é sincronizado automaticamente. Seu autor precisa declarar e implementar o protocolo; o recebimento de eventos não comprova implementação correta por terceiros. O conversor declara somente suas funcionalidades, sem prometer relógio/estilo de templates desconhecidos.
- 3D é transformação de plano texturizado; não importa malhas, objetos ou ambientes 3D. Escala Z de plano não foi inventada como opção.
- PTZ tem prova real de protocolo e detector em loopback, mas câmera física, mecânica, rede da câmera e calibração continuam dependentes de hardware. IPv4 é restrito a redes privadas/loopback; nenhum destino externo implícito.
- Relógios dependem do relógio do mesmo host. Sincronização foi provada em browser H/V local, sem prometer sincronização entre máquinas com clocks distintos.

Referência técnica primária Face Tracker 0.9.1: https://github.com/norihiro/obs-face-tracker/tree/0.9.1 e `src/face-tracker-ptz.cpp`, `src/libvisca-thread.cpp`, `doc/properties-ptz.md` da mesma versão. Não foi redistribuído plugin comercial nesta frente.

Fontes congeladas após os recibos. Nenhuma alteração Native ou compilação nesta frente.

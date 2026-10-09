# Nove janelas CEF reais — Native 19

Resultado: **PASS de carregamento e fechamento das nove janelas**, com API real na instalação QA própria. Não equivale a aprovação visual ou teste das funções acionadas pelos controles.

## Instalação e isolamento

Base selada `0.1.0-local.20261009213415`, instalada em raiz TEMP própria, sobreposta com o conjunto completo congelado `qa-finalizacao/native-build-frozen-fb98b14`. Native HEAD `fb98b14c071fa89146f74dc8c26157c2ce9026ee`; EXE SHA256 `9f2c9f897a68a6c8eef84b74659306396a14f901e9fb9c31765105ef189e1991`. Os cinco pins de EXE/core/frontend/DeckLink/FFmpeg constam do recibo e foram verificados no clone. A conferência posterior também confirmou os hashes dos 2085 arquivos do conjunto congelado.

API e WebSocket reais em portas TCP próprias, autenticação WS habilitada com segredo gerado para esta instalação, sem publicar o segredo. `painel/local.js` e configurações do operador não foram copiados. Foram copiados 309 arquivos atuais de `ferramentas` e `painel/remoto`; o recibo registra SHA256/bytes de cada original. A verificação posterior confirmou os 309 arquivos, descontando somente a instrumentação declarada nos oito HTML próprios.

O projeto QA contém apenas `color_source`, `mix-track-to-source` e cenas; não contém fonte de câmera, placa ou microfone. O nome CAM 1 corresponde a uma cena. Nenhum hardware, REC, transmissão ou botão funcional foi acionado.

## Prova CEF

Cada janela foi criada pelo vendor `open_panel`, reportou DOM completo/UA Chrome 127/controles visíveis por JavaScript executado no próprio CEF, apareceu em `get_interface` como janela independente visível e foi fechada por `close_panel`, antes de abrir a próxima. Viewport real: 1200 × 850.

| Janela | Controles visíveis / total | Conexão reportada pela página | Erros JS/recursos/promessas | Overflow horizontal | Fechamento |
|---|---:|---|---:|---:|---:|
| Configurações | 30 / 31 | true | 0 | 0 | 146 ms |
| Replay | 53 / 54 | true | 0 | 0 | 1073 ms |
| Externo | 13 / 137 | true | 0 | 0 | 1046 ms |
| MultiStream | 53 / 137 | true | 0 | 0 | 1041 ms |
| GC | 61 / 64 | true | 0 | 0 | 1067 ms |
| Macros | 25 / 32 | true | 0 | 0 | 125 ms |
| Atalhos | 16 / 32 | true | 0 | 0 | 1054 ms |
| Diagnósticos | 3 / 3 | n/a — script próprio | 0 | 0 | 127 ms |
| Recuperação | 23 / 25 | true | 0 | 0 | 1050 ms |

Externo abre a página de monitores e atualiza o endereço para `?context=external&transport=monitors`. MultiStream conserva `?context=streaming`. Os controles ocultos pertencem a abas/áreas não selecionadas; não foram abertos para acionar operações. Diagnósticos usa `diagnosticos.js`, não exporta `FreeMixRemote`; seu campo connected é null, não uma falsa confirmação WS. A API global real estava conectada e sua identidade/PID/raiz foram verificados.

As configurações de destino são idênticas antes e depois das nove janelas. Saídas ativas, REC e transmissão: zero no início, em cada janela e no final. Native fechou cooperativamente com exit 0 e nenhum novo crash. A API própria foi encerrada pelo processo do harness.

## Instrumentação e evidência

Somente os HTML copiados para QA receberam listeners iniciais de erro/recurso/unhandledrejection e relatórios após load. Os scripts de produto, requisições, autenticação e backend real permaneceram intactos. O coletor local de prova exige Origin da própria API. Não captura valores de campos, estado de autenticação, segredo, PIN nem resposta bruta da API. Os HTML instrumentados exatos acompanham a prova, com hashes originais e instrumentados no recibo.

O vendor screenshot só captura o QWidget principal. `main-window-only.png` foi conferido visualmente e não contém segredo; **não é captura dos diálogos CEF**. Nenhuma screenshot dessas janelas foi inventada.

Evidências: `qa-finalizacao/cef-nine-native19-final/resultado.json`, `verificacao.json`, oito HTML em `instrumented-html/`, PNG principal e os harnesses `test-cef-nine-native19.mjs` / `verify-cef-nine-native19.mjs`.

## Falhas anteriores do harness preservadas

1. `cef-nine-native19/resultado.json`: guard exigia autoStart=false em slots desabilitados, vazios e inativos. O default autoStart=true não causou início de saída; outputs/REC/stream estavam zero. A preparação QA seguinte desabilitou explicitamente esses defaults apenas no clone próprio.
2. `cef-nine-native19-retry/resultado.json`: comparação de query exata rejeitou o callback de Externo porque a própria página acrescenta `transport=monitors`. Configurações e Replay já haviam passado. Corrigido o matching para conservar todos os parâmetros requisitados e aceitar os adicionais, registrando a query efetiva. Ambos os ensaios fecharam Native com exit 0, sem novo crash. Não são falhas confirmadas do produto.

## Limites

Este ensaio cobre abertura real, DOM/controles, conexão reportada, overflow na largura disponível, invariância dos destinos e fechamento. Não cobre design visual dos diálogos, telas menores, resize, clique nas ações, transmissões, áudio/vídeo, hardware, WAN ou endurance. O candidato selado não foi alterado nem promovido por este teste.

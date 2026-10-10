# Atualização do FreeMix —10/10/2026

## Selecionado035000;fonte posterior 050500

entregas/INSTALADOR-ATUAL.json VERIFIED: **0.1.0-local.20261010035000**, Native23/709f101, Setup SHA **155aa53e12ae4431f66d85fee7785ee158b343ffcda8ae41550025bab7a22c10**. QA final: instalação própria e duas aberturas/fechamentos contador 0 / crash 0,Meter 3/0,API reconectada,diagnóstico sanitizado/uninstall reais;operador não ativado. Provas qa-finalizacao/setup-035000-qa-retry2/report.json,installer-selected-035000.json,candidate-release-035000.json. A antiga nota QA pendente do candidate-release é cronológica e foi supersedida pelo report final.

FAILs035000 preservados: pin de error.html antes da transformação branding assinada; depois guard do nome da pasta QA incompatível com shutdown_idle, sem provar hang Native. Retry2 usa nova instalação FreeMix-QA-,não renomeia/reutiliza JR. EOL no primeirotickerNative23 é FAIL separado de preparação;normalização só na QA própria. Não apagar/mesclar essas provas.

Fonte **0.1.0-local.20261010050500**,Native24 **a04786090fcbe7ede495f18e5ad38ccaa9793478**: FreeMix/fork/manifest.json24 patches;source-verification.jsonPASS/192 snapshots/tree **e67ece9930c4cea0548afa9f3d4f658e0f7814b7**. Export/build não é instalação;050500 ainda sem pacote/Setup aprovado neste registro.

### Integrações posteriores ao035000

- NAV: Externo/câmera virtual/Calls por ação própria, duplicações retiradas. qa-finalizacao/mesa-navigation-cleanup-20261010/receipt.json.
- Áudio/Replay/Settings55 checks,config distinta de operar,links legíveis/NO AR vazio desabilitado: menus-restantes-root-integration-20261010/receipt.json e ux-menus-restantes-20261010/ALLOWLIST.json;IAB próprio revisado.
- Input44 checks,básico/fontes/avançado mantendoUUID/ações/guards:input-menu-root-integration-20261010/receipt.json e ux-input-menu-20261010/ALLOWLIST.json;capturas 17/18 revisadas,clipping 15/16 do harness preservadoFAIL.
- Ticker textual Add/Replace, fila de 32 itens, direções e Speed×FPS racional,Update separado de Save; ACK fora da fila operacional: ticker-root-integration-2026-10-10T04-47-31-404Z/receipt.json. gtzip-ticker-native23-20261010/ALLOWLIST.json separa CEF/runtime exato da instrumentação;ACK/movimento/Cut antes do callback tardio. Não é suporte universalGTZIP / 3D / templates / feeds.
- Operações atuais70PASS:mesa-operations-native24-final-retry1-20261010/CANONICAL-COMBINED-PASS.json;guard de ações byte a byte antigo falhouNAV intencional,FAILpreservado e baseline revisado. Native23 operacional: 12prova separada,não performance completa instalada24.

### SRT HDR opaco real

srt-hdr-native24-real-20261010/{README.md,ALLOWLIST.json,retry1-receipt.json,lifecycle-receipt.json}:Native24TEMP,obs_nvenc_hevc_tex; HEVC Main10/P010/PQ/BT.2020 limited e AAC48k estéreo;4 slots1024×240/30fps,863 níveis decodificados e bandas 300/1000 nits distintas,VUI 9/16/9, PTS/PCM, reconnect/stop/contexto. Precisão além de 8 bits nesta rota,sem relabel SDR/alpha. Três execuçõescontador 0 / crash 0,Meter 4/1/4preservados. FAIL maxBuffer de trace_headers preservado;retry filtra VPS/SPS/PPS reais sem alterar encoder.

srt-hdr-api-ux-native24-20261010/http-receipt.json:7 HTTP PASS,GET sem escritas/início,configure/preflight do slot escolhido,start aceito → live confirmado,stop → pendingfalse confirmado;Native/API cooperativo contador 0 / crash 0/Meter 1. Não repete decode. Dois últimos guards UI áudio salvo indisponível/mudança de sender PASS em VM, pin642b6a542e148d80fa86314135aa250ccfcc48bf940df3948cdacdf405c34efc. Freeze de 25 arquivos ALLOWLISTSHA **a18968e931b97588373ae083419474658dd635774a9884d98c2f00fba0fc7af3**. IAB/HTTP usaramUI anterior aos2 guards;proveniência explícita, não nova aprovação visual. Pacote/receptor HDR / WAN / UHD/60fps/outrosencoders/endurance pendentes. Áudio Master é escolha explícita, não segue UUID de vídeo automaticamente.

### Gates preservados

HTTPS local50 PASS/TLS 1.3/52 requests:qa-finalizacao/update-https-local/{README.md,resultado.json,ALLOWLIST.json};CA apenas no subprocesso QA,assinatura/hash/download/redirect/negativas,sem desativar SSL do produto. Domínio/feed público/TURN/WAN externos.

Properties/Filters handoff queued,sem evidência visible/focus/z-order. native-editor-observability-20261010 draft34source/model,**não aplicado/compilado/não recurso entregue**. Hardware ASIO/SDI/PTZ/controladores, NDI HDR Advanced SDK/licença+implementação,Calls externas/câmeras/endurance/Windows limpo conforme PENDENCIAS-REAIS.md. Sem Authenticode/coleta automática/homologação geral. Alpha WebBrowser abortado; ponte alpha beta separada;operador preservado.

---

## Histórico preservado — estados anteriores, não instruções atuais

Registros abaixo mantêm textos/limites originais. Referências antigas a atual, pendente ou próximo valem para sua data; o estado vigente é o descrito acima.

# Atualização do FreeMix — 10/10/2026

## Estado atual — instalador031500 aprovado; revisão operacional em andamento

Atualizado em 2026-10-10T04:22:12.902Z. O instalador aprovado e selecionado é **0.1.0-local.20261010031500**. Duas instalações reais, migração opt-in, diagnóstico sanitizado, credenciais novas e desinstalação conservadora passaram. QR/ticker/recuperação passaram em ensaio instalado composto; as falhas anteriores estão preservadas. Setup SHA256616a475d8baa9d317eaf68d7f7acade93bc3d308aa1c8830dd3bc09cc10f520f; ZIP2179ea72ef21bf0eab76423c578761e4b34a7c76311dac15840c6fbd7730a511. Contém Native22/500ced5. Nenhuma mesa do operador foi substituída.

**Alterações posteriores ainda fora desse instalador:** fluxo SRT/MultiStream em três etapas (Destino → Conteúdo e áudio → Conferir e iniciar), Calls com escolha explícita de destinatários do talkback e resumo do retorno, e handoff das propriedades/filtros da entrada para o Native23/709f101. Nas fontes canônicas, saídas passaram22 contratos; Calls passaram21 backend/PCM e34 UI/VM, mais interação de navegador com backend próprio. Native23 inteiro compilado/congelado2085 arquivos; ciclo CEF/handoff/fechamento passou em instalação própria (queued não prova aparência/z-order). Zero crashes/alocações no ensaio próprio não é garantia universal. O helper SDI HDR anterior estava numa pasta não servida: referência e arquivo corrigidos em painel/remoto; hardware continua pendente.

**Prioridade nova do operador:** GO/Cut, exclusão, minimizar e demais ações lentas. A revisão já foi integrada nas fontes canônicas: Preview capturado por UUID e confirmado antes do Trigger, gate e recibo correlacionado, deduplicação, recusa de exclusão de Programa/overlays ativos, teclas repetidas bloqueadas, ACK independente da pintura e cartões atualizados no lugar. Passaram70 verificações combinadas das fontes atuais (31 operações,9 Preview,3 UUID,19 WS/render,8 API pública). O ensaio Native real passou12 verificações: Cut/Fade/transição, Preview antes do Trigger, dedupID, exclusão de Programa/keyer recusada, remoção off-air e escopo alterado. IAB próprio confirmou minimizar/restaurar e Cut, foco preservado e alvo no ar. Fechamento cooperativo:contador0/crash0;3 avisos Meter preservados. Amostras HTTP603/758/463ms não medem CEF/GPU/PCM nem endurance. Root integra evidências, Git e novo pacote somente após os checks. Auditor segue SRT HDR e Transportes segue fila de ticker; Installer concluiu o contrato operacional real isolado; aguardará pacote novo. SRT HDR Main10/P010 e TypeAdd/fila de ticker permanecem drafts a integrar, compilar e testar depois da estabilidade operacional.

Não retomar receptor alpha WebBrowser abortado. Ponte nativa alpha é beta separada. Sem publicação de serviço, envio de dados externos ou interferência em processos/configurações/mídia do operador. Homologação física ASIO/SDI/PTZ/controladores, NDI HDR Advanced SDK/licença, WAN/VPS/duas conexões, TURN/convidados externos e Windows limpo são gates reais distintos de código implementável. Ver ATUALIZACAO-20261010.md e recibos datados; trabalho até13/10 permanece ativo.


| Frente | Confirmado | Próximo trabalho real |
|---|---|---|
| Instalador e logs |031500 selecionado; duas instalações, migração, ZIP sanitizado e desinstalação testados; preset com QR/ticker/mídia recuperado em coleção nova. | Novo pacote com alterações de UX/Native23 após regressão. Windows limpo e produção prolongada; sem Authenticode. Logs enviados manualmente pelo beta. |
| Menus | SRT e MultiStream em três passos; campos avançados recolhidos; Calls escolhe quem recebe talkback e explica retorno. Entrada removida não troca silenciosamente de câmera; salvar/iniciar conserva destino mesmo com resposta atrasada. | Ensaiar interfaces atuais com capacidades Native reais, DPI e operador; revisar demais menus. Não equivale a aceite de toda a interface. |
| Botões/mesa | Revisão integrada;70 verificações combinadas do código canônico passaram. Preview/UUID, confirmação, exclusão protegida, deduplicação, teclado e pintura foram cobertos. | Native23 passou12 verificações reais mais interação IAB. Fechamento cooperativo sem crash/alocação,3 avisos Meter registrados. Medir CEF e operação longa; tick já em curso pode atrasar. FTB e concorrência de clientes Native externos são limites explícitos. |
| Replay | Timeline de vídeo contínuo durante REC, IN/OUT, quatro players, autoplay no ar e áudio exclusivo; matrizes de seek/VFR/NTSC/EOF/PCM e sincronismo até um quadro em ensaios locais. | Câmeras com referência comum, SSD/GPU de destino e sessão longa; software não cria genlock. |
| Áudio/Calls | Oito buses estéreo/16 canais ASIO, callbacks sem alocação e rotas PCM; N-1/talkback fora do Master; destinatários explícitos persistem. | Interface ASIO/DirectOut física, audição, transientes rápidos, convidados externos/TURN. |
| Saídas/HDR | SDR alpha SRT/NDI/OMT e ponte nativa separada ensaiados. SDI P416/RGBX10LE/metadados compilados/guards; OMT P216 opaco/PQ-HLG manual. | SRT HDR Main10/P010 draft precisa integração/build/runtime. NDI HDR requer Advanced SDK/licença. SDI exige placa/driver/receptor. |
| GC/composições | QR offline editável, ticker finito e dependências recuperados; H/V preserva UUID/geometria. | TypeAdd/fila e contrato Speed=pixels/quadro estão em draft; contratos GTZIP desconhecidos exigem exemplos. |
| Rede/distribuição | FMXB AES/FEC/NACK com mídia local, HTTPS local TLS1.3/assinatura/download e negativos. | WAN com VPS/duas conexões/receptor remoto, domínio/TURN. FMXB não é BELABOX/srtla. |
| Macros/efeitos | MIDI/OSC/feedback de software, blur/máscaras/XYZ de plano, VISCA/FaceTracker/Whisper locais. | Controladores/PTZ reais, ruído/locutores e carga longa. Não há meshes3D universais. |

As fontes Native23 foram exportadas como23 patches/3 submódulos; reconstrução de contrato --check passou sem rede. O instalador031500 fica imutável e continua separado dessas fontes novas até uma entrega posterior passar. Referências: qa-finalizacao/distribution-031500/report.json; package-native-startup-031500-composite.json; native23-input-handoff-retry1/ALLOWLIST.json; ux-operacao-20261010/test/ALLOWLIST.json; ux-calls-simplificado/ALLOWLIST-APPLIED.json.

Empacotamento novo recebe fontes canônicas pinadas no commit, incluindo dependências transitivas. O builder legado lia painel/ferramentas de obs-vmix; a aplicação explícita de fontes no payload NOVO corrige essa proveniência. Cinco ensaios em Git/payload próprios passaram (cópia/hash/dependência, segunda aplicação, pacote selado, alteração não commitada e dependência não rastreada). O pacote real ainda não foi gerado por essa etapa.

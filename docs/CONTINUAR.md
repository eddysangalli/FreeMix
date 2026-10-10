# Continuidade do FreeMix

Atualizado em 2026-10-10T00:31:16.414Z. Trabalho autorizado até terça-feira, 13/10/2026. Preservar mesa, vMix, Calls, REC e saídas do operador; ensaios somente em raízes/portas próprias. Esta entrega verificada não equivale à homologação de toda a lista.

## Entrega atual

Instalador atual: **0.1.0-local.20261010000500**, selecionado em entregas/INSTALADOR-ATUAL.json. Use **INSTALAR-FREEMIX.cmd**, escolha uma pasta nova/vazia e depois abra pelo atalho FreeMix Studio. Duas instalações/importações/diagnósticos/desinstalações reais e startup passaram. Native **4793d1a40f56ea9b6e887eb49189d937758e3b7f**, 21 patches/187 snapshots com reconstrução de árvore verificada. Fechamento cooperativo em 773 ms, contador de alocações zero e nenhum crash novo no ensaio instalado.

A instalação do operador não foi substituída. ABRIR-FREEMIX.cmd mantém a mesa legada e seu atualizador incremental; não aplicar pacote completo por esse atualizador. Créditos/licenças OBS permanecem. Diagnósticos são ZIP local sanitizado, enviado manualmente. Nenhum upload ou serviço externo foi publicado.

Fontes do payload correspondem ao Git **3737e790945962df9feff07287e4dda3e07c054d**, branch feat/native-menus-config-screens. Provas posteriores e documentação recebem commits separados. O EXE contém assinatura interna Ed25519, sem certificado Authenticode.

## Evidência confirmada

- Replay: histórico contínuo durante REC, vídeo/áudio, busca e IN/OUT, players e autoplay no ar. Native19/JS: 30 comparações pós-seek com diferença zero e 81 comparações em 90 s até um quadro, sem pausas/correções periódicas; seis PCM em 30/50/100%, VFR/NTSC/EOF. Shutdown normal, outputs zero.
- Master digital Native21: oito segmentos A/B/C/D, mute, off-air, ganho −6 dB e troca de arquivo; tons exclusivos dentro do critério, PCM zero nos estados silenciosos, ganho 0.5011919/esperado 0.5011872. View liberada, outputs zero, exit zero/776 ms. Não mede transientes rápidos nem audição física.
- MultiGravação em composição contendo replay: três TS finalizados e decodificados em 30/50/100%, Stop retorna com outputs zero; seek/off-air/EOF passaram. Não usar SourceRecord diretamente nos players.
- SRT/SDI: onze capturas packed420/444/Fill/Key/alpha/chroma/áudio/reconexão e seis guards SDI; DLLs de mídia permanecem idênticas entre Native20 e21. NDI/OMT SDR alpha local e quatro emissores OMT P216 com contrato HDR manual foram ensaiados.
- Interface: nove janelas CEF reais em1200×850 com DOM/API/fechamento; títulos em Edge isolado600×600/1920×1080 sem overflow,27/27 prévias. Não é aprovação visual universal.
- GTZIP: Polygon/Path diretos corrigidos,33 casos PASS, perda silenciosa original reproduzida. QR offline está em implementação/QA pelo agente; ainda não integra o instalador000500.
- Marca/OAuth: doze fontes Native compiladas;149 verificações do coletor e dois ZIPs produzidos na instalação real redigem OAuth code/state e conservam estado comum do produto. Nenhum login externo. Bandeja REC/pausada e Sobre têm build/prova estrutural, sem aprovação visual ao vivo.
- Distribuição: 9563 arquivos assinados/hashes; ZIP/Setup verificados,15 verificações de distribuição PASS,26 baselines e13 metadados233334 preservados. Ponte nativa SRT→NDI alpha beta separada220522,20 min/35.711 quadros/áudio/reconexões. WebBrowser alpha permanece abortado.

## Trabalho ativo e recursos necessários

Auditoria implementa QR GTZIP offline com validação de edição e decodificação independente. Root integra fontes/QA/Git e criará novo candidato somente após freeze;000500 permanece fallback verificado. Installer/transportes encerraram suas matrizes locais.

NDI HDR ainda precisa de Advanced SDK/licença e implementação correspondente. Contratos GTZIP desconhecidos não podem ser presumidos. ASIO/SDI/controladores/PTZ requerem equipamentos; bonding WAN requer VPS e duas conexões; HTTPS/TURN requer domínio/servidor; Calls externas e Windows limpo requerem ambientes reais. Ver PENDENCIAS-REAIS.md para passos e estimativas.

## Referências

ENTREGA-ATUAL.md, INSTALACAO.md, PENDENCIAS-REAIS.md, PLANO-CONCLUSAO-20261013.md; RELATORIO-INSTALADOR-REAL-000500-NATIVE21-20261010.md; qa-finalizacao/package-native-startup-000500-native21.json; replay-master-four/ALLOWLIST.json; fork/source-verification.json. Recibos e auditorias datados registram o estado daquele momento; não sobrescrever para fingir aceite posterior.

## QR GTZIP implementado depois da entrega000500

Seis fontes congelados: QR direto/grupos/aninhado, texto UTF-8 editável até512bytes, quadrado16–2048px, ECC M/quiet-zone4. Encoder offline qrcode1.5.4/dijkstrajs1.0.3 MIT, sem CDN/rede/node_modules em execução do título. Save/prepare recusam valores inválidos antes de persistir ou solicitar mudança Native.46 checks de navegador/decoder independente e28 de backend PASS; regressão Polygon/Path33PASS.4/4 QR presentes no inventário foram reconhecidos;743 hashes preservados e nenhum asset/texto proprietário copiado. CEF ainda aguarda ensaio instalado; não afirmar compatibilidade universal de atributos/transformações QR.

Candidato0.1.0-local.20261010004000 será empacotado com mesma build Native21;000500 permanece o instalador selecionado até terminar assinatura/ZIP/Setup e QA própria. QR não está no payload000500 imutável. Provas: qa-finalizacao/gtzip-qr/ALLOWLIST.json e gtzip-direct-shapes-qr-regression/ALLOWLIST.json.

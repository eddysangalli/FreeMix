# Continuidade do FreeMix

## Estado atual — candidato031500 em QA instalada

O instalador aprovado/selecionado continua **000500**. O candidato **031500** foi gerado e selado, com assinatura Ed25519 e todos os9565 arquivos verificados. QA instalada de QR/ticker/recuperação está em execução numa raiz TEMP própria; ainda não é aprovação de entrega. QR45 permanece rejeitado e arquivado: backup com mídia falhou no scanner de dependências, que confundiu o encoder QR autocontido com arquivos externos. Recibos/FAILs e pacote selado foram preservados.

O scanner foi corrigido no Git2a58feb com33 checks locais. Primeira ativação/recarga/ON/OFF passou em CEF real com QR decodificado. Native500ced5 e plugin dd26fda foram compilados/freeze2085 arquivos;22 patches do pai, patch/objeto do plugin e188 snapshots foram exportados. Reconstrução real por árvore passou em clone próprio usando bases oficiais locais, sem buscar o commit local do plugin no upstream. Fontes publicadas no GitHubb078553; publicação externa de serviços/logs não ocorreu. HTTPS local passou50 checks de TLS/assinatura/download, produto intacto.

Ticker2D finito e QR estão nas fontes e no candidato novo; API/CEF/recuperação instalada aguardam o ensaio atual. TypeAdd/fila texto-only está em draft separado; Speed=pixels/quadro foi confirmado na documentação oficial, ainda sem integração entregue desse contrato. Sequências/contratos proprietários desconhecidos continuam limitados. Três frentes: Installer testa instalação/CEF/.fmx; Auditoria implementa draft SRT HDR opaco; Transportes prepara TypeAdd. Root integra em série. Nenhuma mesa foi substituída, nenhum receptor alpha web abortado foi retomado. Atualização geral em ATUALIZACAO-20261010.md.

---

Registros anteriores, com seus limites e datas:


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

## Candidato QR corrigido

040000 foi rejeitado: preparação documental falhou e a assinatura avançou indevidamente. Payload imutável arquivado, sem instalação/ZIP/EXE/mesa. Novo candidato0.1.0-local.20261010004500 exige recibo presealPASS anterior à assinatura.000500 continua selecionado. Auditoria prepara ticker2D em rascunho isolado, sem alterar os seis fontes QR congelados desta versão.

## Ticker2D integrado nas fontes posteriores ao QR45

Três fontes aplicados por cópia byteidêntica ao draft verificado: template finito com dois textos e uma imagem, campos editáveis,geometria2D preservada e Shrink limitado a10passos.30checks Edge/parser/conversão/edição PASS,46regressões QR e33formas PASS; sem cópia de modelo proprietário. TypeAdd/fila e unidadeSpeed exata continuam avisos explícitos; movimento local aproximado de um item. Sequências examinadas não possuem alvo/frames/tempo utilizáveis e não foram inventadas.

Root prepara candidato0.1.0-local.20261010010000 com mesmoNative21; ticker ainda não recebeu QAAPI/CEF/recuperação instalada.000500 segue selecionado enquanto QR45 terminaQA. Provas em qa-finalizacao/gtzip-ticker-template/ALLOWLIST-APPLIED.json; não transferir PASS do draft para CEF.

## Correção de recuperação QR integrada, aguardando pacote novo

O scanner agora reconhece o encoder autocontido somente quando conteúdo/tamanho/manifesto GTZIP/campo QR/licença MIT correspondem exatamente ao helper local aprovado. Não interpreta os requires internos como arquivos externos. Scripts arbitrários, traversal e adulterações continuam recusados.33 verificações locais passaram, incluindo backup .fmx real, restauração sem originais e QR decodificado em Edge/ZXing. Native/API eram mocks neste teste; recuperação pela API/CEF instalada ainda precisa do candidato seguinte. Nenhum pacote selado foi alterado. A primeira ativação está em QA separada no obs-browser.

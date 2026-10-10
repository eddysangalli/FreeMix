# Pendências reais e critérios de conclusão

Estado em 2026-10-10T00:31:16.414Z.

Instalador atual: **0.1.0-local.20261010000500**, selecionado em entregas/INSTALADOR-ATUAL.json. Use **INSTALAR-FREEMIX.cmd**, escolha uma pasta nova/vazia e depois abra pelo atalho FreeMix Studio. Duas instalações/importações/diagnósticos/desinstalações reais e startup passaram. Native **4793d1a40f56ea9b6e887eb49189d937758e3b7f**, 21 patches/187 snapshots com reconstrução de árvore verificada. Fechamento cooperativo em 773 ms, contador de alocações zero e nenhum crash novo no ensaio instalado.

A instalação do operador não foi substituída. ABRIR-FREEMIX.cmd mantém a mesa legada e seu atualizador incremental; não aplicar pacote completo por esse atualizador. Créditos/licenças OBS permanecem. Diagnósticos são ZIP local sanitizado, enviado manualmente. Nenhum upload ou serviço externo foi publicado.

Fontes do payload correspondem ao Git **3737e790945962df9feff07287e4dda3e07c054d**, branch feat/native-menus-config-screens. Provas posteriores e documentação recebem commits separados. O EXE contém assinatura interna Ed25519, sem certificado Authenticode.

## Implementação e verificação

| Frente | Resultado local confirmado | O que falta e como encerrar |
|---|---|---|
| Recuperação | Snapshots/eventos, títulos, composições, mídia e saídas restaurados em perfil/coleção novos. Importação instalada conserva origem, cria credenciais e não inicia saídas. | Drivers/dependências externas precisam existir no destino. Alteração ainda não persistida no debounce não pode ser recuperada. Ensaiar instalação limpa com mídia/driver de destino. |
| Áudio | Host ASIO próprio,8 buses estéreo/16 canais,16 formatos e10 mil callbacks sem alocação RT; quatro drivers enumerados sem abrir. N-1/talkback PCM local separados do Master. Replay Master final: oito segmentos A/B/C/D/mute/off-air/ganho/troca PASS. | Interface/driver e loopback por canal para ASIO/Direct Out; audição humana e Calls externas. Master medido em segmentos estáveis, sem aceite de transientes rápidos. |
| NDI/OMT/SDI | Múltiplos emissores independentes; SDR alpha/Fill+Key, Key silenciosa e reconexão locais. OMT PA16 alpha e P216 opaque10bit com PQ/HLG manual. SDI P416/RGBX10LE/metadados compilados e seis guards negativos. | SDI físico precisa de placa/driver/keyer/receptor; NDI HDR ainda requer licença Advanced SDK, integração da API e renderer HDR. Não é só um teste adiado. OMT não promete metadados HDR automáticos. |
| Interface/configurações | Transmitir→MultiStream; Externo→SRT/NDI/OMT/SDI; ajustes operacionais nas engrenagens próprias. Nove CEF1200×850 reais; títulos Edge600×600/1920×1080,27 prévias e footer acessível. Marca pública Native21 compilada. | Conferir monitores/DPI/plugins e bandeja REC/pausada/Sobre visualmente. Matriz local não equivale a identidade pixel a pixel em todas as telas. |
| Composições/GC | H/V vincula conteúdo por UUID preservando geometrias, com undo. GTZIP grupos,transformações/animações reconhecidas,assets/fontes livres; Polygon/Path diretos33 casos PASS. | QR offline/editável em implementação/QA, fora do instalador000500. Sequências sem frames/tempo, ticker complexo e contratos proprietários exigem exemplos finitos; não inventar comportamento nem afirmar743 títulos aprovados. |
| Replay | Timeline contínua/MSE durante REC, seeks/IN/OUT, quatro players, áudio opt-in e autoplay no ar.30 pós-seek/81 em90s até1quadro sem correções periódicas; VFR/NTSC/EOF/30-50-100% PCM. MultiGravação em composição gerou três TS estáveis/decodificados; saídas zero e fechamento normal. | Câmeras/disco/GPU de destino e sessão longa; sincronismo software não cria genlock. Não usar SourceRecord diretamente nos players. |
| Macros/controladores | Eventos,feedback de software,reconexão/dedup; OSC UDP real e matrizes de navegador passaram. | MIDI/StreamDeck/XKeys/Companion físicos para comandos,feedback e reconexão. |
| Efeitos/legendas | Blur/máscaras/XYZ de plano,FaceTracker/VISCA e LocalVocal/Whisper locais; cancelamento/shutdown corrigidos. Português sintético6/7 palavras-chave. | Corpus real/ruído/locutores e carga longa para qualidade; câmera VISCA/tracking real. Não inclui meshes3D nem licença StreamFX. |
| Bonding/rede | FMXB UDP AES,FEC/NACK,caminhos medidos e mídia decodificada em loopback. Kit VPS/feedHTTPS/TURN e assinaturas preparado. | WAN com VPS e duas operadoras/interface, medir perdas/jitter/falha/reconexão. FMXB não é protocolo BELABOX/srtla. Domínio/DNS/acesso são necessários para publicar HTTPS/TURN; Drive não substitui UDP/TURN. |
| Instalador/diagnóstico |000500: duas instalações/importações/desinstalações,credenciais novas,15 checks de distribuição,ZIP diagnóstico dos dois coletores com OAuth redigido. Startup773ms,contador zero/crashes zero.9563 arquivos assinados; fontes21patches/187snapshots. | Windows limpo e sessão de produção; certificado Authenticode se desejar editor verificado no Windows. ZIP local é enviado manualmente; não há coleta remota automática. |
| Alpha vMix | Packed cor/máscara conserva mesmo quadro; OBS e operador no vMix recompuseram. Ponte SRT→NDI separada20min/35.711quadros,áudio/reconexões/fechamento normal,49 arquivos assinados. | vMix/receptor remoto e Windows limpo. WebBrowser foi rejeitado por desempenho e segue abortado. SRT independente HDR10/P010 não implementado, expansão separada do SDR alpha. |

## Recursos e estimativas após disponibilidade

| Pendência | Recurso/ação necessária | Estimativa inicial |
|---|---|---|
| QR GTZIP | Implementação offline,decodificador independente,edição inválida sem persistir,fixtures finitos,freeze/regressão/novo candidato. |4–8h de desenvolvimento/QA; estimativa sujeita às falhas encontradas. |
| GTZIP complexo | Exemplos com frames/tempo e contrato de ticker/3D explícito. | Orçar por contrato; não há prazo honesto para formatos desconhecidos. |
| NDI HDR | Advanced SDK/licença,receptor HDR,integração e renderer adequado. | Sem prazo fechado antes de conhecer API/licença. |
| SRT HDR independente | Definir codec10bit/P010,receptor,metadados e matriz de cor. |2–5dias após contrato; expansão ainda não implementada. |
| Bonding WAN | VPS Linux UDP,duas conexões reais,receptor remoto; cortar caminho e medir mídia. |4–8h para matriz inicial,correções conforme resultado. |
| HTTPS/TURN | Domínio/DNS/VPS/permissões,portas e convidados externos. |2–4h de configuração e sessão. |
| ASIO/Direct Out | Interface/driver e loopback físico em cada canal. |2–4h para matriz básica. |
| SDI/HDR | DeckLink/driver,keyer,modos e captura/receptor HDR. |4–8h SDR/Fill+Key; HDR conforme equipamento. |
| Calls | Dois convidados em redes distintas,celular/fones e TURN se necessário. |1–2h de sessão/reconexão. |
| Replay produção | Câmeras reais,SSD/GPU de destino,referência comum e gravação longa. |2–4h por matriz; genlock depende da cadeia física. |
| Controles/PTZ | Dispositivos e câmera VISCA configurados. |2–4h por conjunto. |
| Windows limpo | Máquina/VM sem ambiente de desenvolvimento,monitores/drivers/rede. |2–4h mais sessão operacional combinada. |

Os prazos acima são estimativas de trabalho ou ensaio, sem garantia de correção de falha ainda desconhecida. Provas datadas/FAILs ficam preservados. Auditoria anterior à QA do Master e à seleção000500 não substitui este estado atualizado. Nenhum login externo,upload de logs ou homologação física/WAN foi realizado.

## QR GTZIP implementado depois da entrega000500

Seis fontes congelados: QR direto/grupos/aninhado, texto UTF-8 editável até512bytes, quadrado16–2048px, ECC M/quiet-zone4. Encoder offline qrcode1.5.4/dijkstrajs1.0.3 MIT, sem CDN/rede/node_modules em execução do título. Save/prepare recusam valores inválidos antes de persistir ou solicitar mudança Native.46 checks de navegador/decoder independente e28 de backend PASS; regressão Polygon/Path33PASS.4/4 QR presentes no inventário foram reconhecidos;743 hashes preservados e nenhum asset/texto proprietário copiado. CEF ainda aguarda ensaio instalado; não afirmar compatibilidade universal de atributos/transformações QR.

Candidato0.1.0-local.20261010004000 será empacotado com mesma build Native21;000500 permanece o instalador selecionado até terminar assinatura/ZIP/Setup e QA própria. QR não está no payload000500 imutável. Provas: qa-finalizacao/gtzip-qr/ALLOWLIST.json e gtzip-direct-shapes-qr-regression/ALLOWLIST.json.

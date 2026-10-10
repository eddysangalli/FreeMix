# Atualização do FreeMix — 10/10/2026

Estado confirmado nesta rodada. A entrega inteira continua em andamento. O instalador aprovado e selecionado é **000500**; o novo candidato **031500** foi gerado, assinado e teve todos os 9565 arquivos verificados, mas ainda aguarda aprovação instalada de QR, ticker e recuperação. A mesa do operador não foi substituída.

| Frente | Feito e evidência local | Falta real |
|---|---|---|
| Instalação e organização | EXE instalável, inicializadores, migração opt-in, desinstalação preservando dados; duas instalações reais do selecionado. Candidatos rejeitados e antigos arquivados com hashes. | Instalação/QA do candidato novo, Windows limpo e sessão de produção. Sem Authenticode. |
| Logs beta | Botão/coletor/CMD gera ZIP local sanitizado com versão, identificação da máquina, logs, crashes e dependências. Testados os dois coletores, inclusive remoção de OAuth. | O beta envia o ZIP manualmente por WhatsApp/e-mail. Não há upload remoto automático. |
| Replay | Vídeo contínuo do histórico durante REC, timeline, seek, IN/OUT, quatro players, autoplay no ar, áudio opt-in/exclusivo; matrizes de quadros, VFR, velocidades, EOF e PCM. | Sessão longa com câmeras, SSD/GPU de destino e referência comum; software não cria genlock físico. |
| Áudio | Oito buses estéreo/16 canais ASIO; callbacks/formatos e enumeração local; N-1/talkback fora do Master. Master final medido em oito segmentos estáveis. | ASIO/Direct Out com interface e loopback físico; audição, transientes rápidos e Calls externas. |
| Saídas e alpha | Múltiplos envios independentes, SRT SDR 4:4:4/packed alpha/Fill+Key, NDI/OMT alpha SDR e reconexão. Ponte nativa SRT→NDI separada com ensaio de20min. | Receptor/vMix remoto e Windows limpo. Receptor WebBrowser alpha permanece abortado. |
| HDR | OMT P216 opaco10bit/PQ-HLG manual medido; SDI P416/RGBX10LE/metadados compilados e guards negativos. | SRT HDR independente ainda em implementação draft. NDI HDR exige Advanced SDK/licença e integração. SDI precisa de placa/driver/keyer/receptor físico. |
| Interface | Transmitir→MultiStream; Externo→SRT/NDI/OMT/SDI; engrenagens operacionais próprias, descrições e responsividade. Nove telas CEF e matriz de títulos verificadas. | Revisão nos monitores/DPI/plugins de destino, bandeja e estados REC/pausado/Sobre; não é aprovação visual de toda superfície. |
| Composições e GC | H/V vincula conteúdo por UUID, preserva geometria e permite desfazer. GTZIP ampliado, imagens/fontes e formas. QR editável/offline e ticker2D nas fontes. | API/CEF/recuperação instalada do novo candidato. TypeAdd/fila de ticker e sequências/contratos complexos ainda faltam. Unidade Speed foi confirmada em fonte oficial; integração desse contrato ainda não está entregue. |
| Recuperação | Snapshots/eventos, composições/títulos/mídia/saídas restaurados em coleção nova sem autostart; scanner QR corrigido com33 verificações locais. | Prova instalada QR/ticker sem originais em andamento. Dependências externas devem existir no destino; alterações ainda não persistidas não podem ser recuperadas. |
| Macros e controles | Ações/eventos, feedback de software, dedup/reconexão, OSC UDP e matrizes de navegador. | Dispositivos MIDI/StreamDeck/XKeys/Companion reais. Adaptador HTTP genérico não é plugin oficial de cada fabricante. |
| Efeitos e legendas | Blur/máscaras/XYZ de plano, FaceTracker/VISCA e LocalVocal/Whisper locais; cancelamento e fechamento corrigidos. | Fala real com ruído/locutores, tracking/PTZ físico e carga longa; sem suporte universal a meshes3D. |
| Rede e distribuição | Bonding FMXB com AES/FEC/NACK e mídia em loopback; kit VPS/TURN/feed. HTTPS local real passou50 checks TLS/assinatura/hash/download e negativos. | WAN com VPS, duas conexões/interfaces e receptor remoto; configuração/publicação real HTTPS/TURN. FMXB não é BELABOX/srtla. |
| Estabilidade e fontes | Ensaios de fechamento cooperativo com contador zero e nenhum crash novo; Native22 compilado e congelado2085 arquivos.22 patches do pai e plugin completo exportados/reconstruídos por árvore. | Regressão integrada do candidato novo e uso prolongado; contador zero em QA não garante ausência universal de crash. |

O candidato QR45 foi rejeitado por falha real de recuperação e arquivado. Seu teste parcial de QR/distribuição não foi usado como aprovação. O candidato031500 inclui a correção do scanner e da primeira ativação; a primeira ativação/recarga/ON/OFF já passou em CEF real com DLL própria de QA, e o novo teste usa o motor completo instalado, sem overlay.

Três frentes continuam em paralelo: QA instalada de QR/ticker/.fmx; SRT HDR opaco HEVC Main10/P010/PQ/BT2020 em draft; contrato/draft texto-only de TypeAdd. Root integra, compila, registra e empacota. Nenhuma publicação externa ou envio de logs foi feito. Commit/push das fontes no GitHub autorizado e executado.

Contrato de ticker confirmado: Speed representa pixels por quadro; Add acrescenta texto e Replace reinicia ao alterar. Esse contrato ainda está em draft de implementação, separado do ticker finito do candidato. [Documentação oficial do GT Designer](https://help.vmix.com/graphics/6/Format.html).

Provas e critérios detalhados: [PENDENCIAS-REAIS.md](PENDENCIAS-REAIS.md), [CONTINUAR.md](CONTINUAR.md) e diretórios próprios em qa-finalizacao. Recursos de hardware, licença e WAN são gates distintos de código ainda ausente.

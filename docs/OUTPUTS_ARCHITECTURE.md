# FreeMix — Central de Saídas, Roteamento e Vídeo Profissional

## 1. Visão Geral da Arquitetura

A Central de Saídas do FreeMix opera como uma matriz de roteamento independente que desacopla rigorosamente a **Origem de Conteúdo** do **Meio de Transporte (Destino)**.

Em produções ao vivo profissionais (padrão broadcast/vMix), a mesa de corte não deve limitar o envio de sinais apenas ao sinal de Programa principal. A Central de Saídas gerencia múltiplos feeds simultâneos com canais de áudio, resoluções, taxas de quadros e opções de canal alfa (Fill + Key) específicos por destino.

---

## 2. Matriz de Roteamento: Conteúdo vs Transporte

### 2.1 Origens de Vídeo Suportadas
| Origem | Comportamento e Roteamento | Canal Alfa | Tratamento de Áudio |
|---|---|---|---|
| **Program** | Sinal final no ar incluindo cortes, transições e sobreposições ativas de Downstream Keyer (DSK). | Opcional | Master Bus |
| **Preview** | Próxima entrada preparada para entrar no ar. | Não | Mute (padrão) |
| **Clean Feed** | Sinal do Programa limpo, contendo os mesmos cortes de câmeras e mídias, porém **sem logotipos, placares ou lower-thirds do DSK**. Mapeado para a cena base ativa sem as sobreposições de overlay. | Sim (se cena permitir) | Master Bus |
| **Multiview** | Mosaico composto de câmeras, preview, programa e medidores de áudio para direção de TV. | Não | Mute |
| **Entrada / Cena Específica** | Feed isolado (ISO) de uma câmera, convidado remoto (FreeMix Call) ou vídeo dedicado. | Depende da fonte | Canal isolado da entrada |

### 2.2 Destinos de Transporte e Mapeamento de APIs

| Destino | Mecanismo OBS / API | Capacidade Real | Limitação Técnica / Nota de Engenharia |
|---|---|---|---|
| **Monitores e Projetores** | `OpenVideoMixProjector`<br>`OpenSourceProjector`<br>`GetMonitorList` | Fullscreen em monitores reais (0..N) ou Janela Flutuante (-1). Suporta Program, Preview, Multiview e Fontes/Cenas. | OBS WebSocket v5 **não** possui chamada para fechar projetores abertos. O ciclo de vida fechamento/reposicionamento avançado requer gestão pelo plugin nativo FreeMix. |
| **Câmera Virtual** | `StartVirtualCam`<br>`StopVirtualCam`<br>`GetVirtualCamStatus` | DirectShow Virtual Device para Teams, Zoom, vMix e navegadores web (1080p, sem áudio). | 1 saída global por instância OBS. |
| **Transmissão (RTMP / SRT)** | `StartStream`<br>`StopStream`<br>`GetStreamStatus` | Transmissão primária com codificação por hardware (NVENC/QSV/x264). Métricas reais: bitrate, timecode, drops, congestionamento. | Configurada no perfil de streaming ativo. |
| **Multistream** | OBS `adv_stream` / `obs-multi-rtmp` / Aitum Stream Suite | Envio simultâneo para YouTube, Twitch, Facebook ou servidores privados RTMP/SRT. | Falhas e quedas de rede são tratadas individualmente por endpoint, sem derrubar as demais transmissões. |
| **DeckLink / SDI** | `decklink.dll` / `decklink-output-ui.dll` | Saída SDI/HDMI em placas Blackmagic Design. Suporta vídeo normal, Fill + Key Externo (2 canais SDI síncronos) e Keyer Interno. | **Requer hardware físico e drivers Blackmagic Desktop Video**. Quando ausente, a Central reporta estado `indisponível` com diagnóstico explícito. |
| **NDI (DistroAV)** | `distroav.dll` / NDI Runtime 5.x+ | Saída de rede Gigabit NDI com baixa latência e suporte a canal alfa completo (RGBA 32-bit para GC externo). | Requer NDI Runtime instalado no Windows. O Preview NDI por design OBS não transporta áudio. |
| **OMT (Open Media Transport)** | `omtplugin.dll` | Transporte IP ultrarrápido aberto com áudio multicanal e suporte a transparência. | Requer módulo compilado do OMT no diretório de plugins. |

---

## 3. Estados Operacionais Padronizados

Cada saída possui uma máquina de estados rigorosa:
- **`indisponível`**: Hardware ausente (ex: DeckLink sem placa instalada) ou plugin/runtime não carregado. A interface impede comandos inválidos e explica a limitação.
- **`parada`**: Saída configurada e pronta, mas atualmente inativa.
- **`iniciando`**: Comando aceito pelo FreeMix; aguardando confirmação empírica de início do transporte.
- **`ativa`**: Transporte confirmado como transmitindo ativamente (com métricas reais quando fornecidas pelo backend).
- **`reconectando`**: Queda temporária de link de rede ou buffer esgotado (ex: RTMP stream congestionado).
- **`falha`**: Erro fatal de inicialização, conflito de dispositivo ou rejeição pelo hardware.

---

## 4. Fill + Key para Caracteres (GC) Externos

Quando operando com DeckLink ou NDI para geradores de caracteres externos:
1. **Composição com Alpha**: A cena/fonte de GC contém elementos com transparência nativa (PNG com alfa, HTML/Browser com background transparente).
2. **Fill + Key Externo**: 
   - Canal SDI A (Fill): Imagem RGB com corte e cores pré-multiplicadas.
   - Canal SDI B (Key): Canal alfa extraído em escala de cinza de alta precisão (0..255).
   - O sincronismo entre Fill e Key é travado quadro a quadro pelo hardware da placa DeckLink.

# 🎬 FreeMix Studio

> **Aplicativo Próprio de Produção e Transmissão de Vídeo ao Vivo (Broadcast)**  
> *Suíte de switcher profissional estilo vMix com executável, interface e distribuição próprios, utilizando a biblioteca `libobs` como motor interno.*

[![License: GPL-2.0](https://img.shields.io/badge/License-GPL--2.0-blue.svg)](LICENSE)
[![Engine: libobs](https://img.shields.io/badge/Engine-libobs%20Core-black.svg)](https://obsproject.com)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011%20x64-0078d4.svg)]()
[![FreeMix Call: WebRTC](https://img.shields.io/badge/FreeMix%20Call-WebRTC%20P2P-brightgreen.svg)]()

---

## 🌟 O que é o FreeMix?

O **FreeMix** é um aplicativo Windows completo e independente (`FreeMix.exe`) desenvolvido para fornecer a operadores, diretores e técnicos de TV uma mesa de corte de produção ao vivo ágil e integrada (estilo vMix, TriCaster e consoles de vídeo broadcast), combinando a interface operacional e recursos proprietários com a performance imbatível da biblioteca de mídia **`libobs`** como motor interno.

### 📐 Definição de Arquitetura do Produto
* **Aplicativo Próprio**: O FreeMix é entregue como um executável compilado (`FreeMix.exe`), com identidade visual, janelas, menus, configurações e distribuição próprias.
* **libobs como Motor Interno**: O aplicativo inicializa e comanda diretamente os subsistemas de captura de vídeo, composição Direct3D 11, processamento de áudio, encoders de hardware (NVENC, QuickSync, AMF, x264) e protocolos de saída (RTMP, SRT, NDI, OMT, DeckLink SDI).
* **Operação Integrada em Tela Única**: O operador abre o FreeMix e controla toda a transmissão dentro dele — visualizando monitores de Preview e Program, barra central de transições (Cut, Fade, T-Bar), painel de entradas com abas de categoria, mixer de áudio com faders Master/Fones e central unificada de saídas.

---

## ✨ Módulos e Recursos Integrados

### 🎛️ Mesa de Corte & Switcher Broadcast
* **Telas de Vídeo Integradas**: Preview (cor Laranja broadcast) e Program (cor Verde no ar) com vúmetros de áudio Master e medidores de pico integrados.
* **Barra Central de Transições**: Botões rápidos de corte (`Cut`, `Fade`, `Zoom`, `Wipe`, `Slide`, `Merge`, `FTB`) e **T-Bar horizontal** com resposta analógica fluida.
* **Bandeja de Entradas Dinâmica**: Câmeras, placas de captura, vídeos, vinhetas, GC, apresentações e chamadas remotas organizadas por abas coloridas.
* **Tally & Identificação Automática**: Indicadores visuais imediatos de estado em ar e pré-visualização.

### 🎧 Gerenciador de Áudio & Barramentos (Mix-Minus)
* **Faixas Dedicadas**: Fader Master (dB) e Fader Fones (Headphones) fixos e independentes.
* **Configurações Avançadas por Canal (`⚙`)**:
  - Monitoração de áudio: Nenhuma / Fones Apenas / Fones + Transmissão (`SetInputAudioMonitorType`).
  - Sincronização & Atraso (Lipsync Delay): Ajuste fino em milissegundos com atalhos rápidos (+50 ms, +100 ms, -50 ms, 0 ms).
  - Balanço Estéreo (Pan L/R).
  - Efeitos & Plugins: Compressor, Limiter dinâmico, Redução de Ruído e suporte a plugins VST2.x.
* **Submixes e Mix-Minus**: Barramento Master (`M`), Aux A (`A` - retorno sem eco para convidados) e Aux B (`B` - escuta da direção).

### 🌐 Central de Saídas & MultiStream
* **MultiStream Integrado**: Transmissão para múltiplos destinos simultâneos (YouTube, Twitch, SRT, Kick, Facebook) compartilhando o encoder NVENC/QuickSync sem duplicar consumo de GPU.
* **Saídas Físicas e IP**:
  - **Fullscreen**: Projeção direta de PGM ou Preview em monitor ou telão secundário.
  - **Multiview**: Mosaico broadcast de câmeras e mídias em tela cheia ou janela.
  - **NDI & OMT**: Feeds de vídeo sobre IP com suporte a canal Alfa (Fill + Key).
  - **DeckLink SDI**: Saídas para placas Blackmagic com detecção de hardware.
  - **Câmera Virtual**: Envio de PGM para Zoom, Meet e Teams.
* **MultiCorder (Gravação ISO)**: Gravação isolada de câmeras individuais em paralelo com o programa gravado.

### 📡 Transmissão Multi-WAN & Bonding (Estilo LiveU / RIST Multi-Link)
* **Três Modos de Proteção**:
  - **Principal + Reserva**: Comutação automática instantânea (Failover) para conexão reserva caso o link cabeado oscile.
  - **Redundância Simultânea (Hitless)**: Duplicação de pacotes em tempo real por caminhos físicos distintos (ex: Ethernet + 5G), garantindo zero quedas no destino.
  - **Agregação de Capacidade**: Soma da banda de múltiplos links via RIST/SRT.
* **Telemetria Completa**: Medição de taxa (Mbps), RTT (ms) e perda de pacotes por adaptador de rede físico.
* **Receptor Integrado (`freemix-bonding-relay`)**: Recomposição e deduplicação de pacotes antes do envio para YouTube ou Twitch.

### 🎨 Módulo de Gráficos (GCs) & Fontes de Dados
* **Catálogo de Coleções**: Jornalismo (Lower Thirds, Plantão Urgente, Ticker), Esportes (Placares com cronômetro dinâmico), Marca (Bugs de canto com relógio ao vivo).
* **3 Camadas Independentes (Layers)**: Sobreposição de tarjas sem conflito com placares permanentes ou marcas de canal.
* **Fontes de Dados (DataSources)**: Importação de planilhas CSV, tabelas manuais e feeds JSON locais ou HTTP com preenchimento em 1 clique.
* **Operação On-Air de Dois Estágios**: Preparação no monitor de preview antes do disparo ao vivo (Take In, Update sem corte, Take Out suave e Clear All).

---

## 🏗️ Estrutura de Código e Compilação

O FreeMix é organizado nas seguintes camadas:
1. **`src/app/`**: Executável principal (`FreeMix.exe`), inicialização do ciclo de vida Qt6 e inicialização dos subsistemas da `libobs`.
2. **`src/ui/`**: Interface do usuário, janela principal (`FreeMixMainWindow`), monitores de vídeo, switcher de corte, mixer de áudio e caixas de diálogo.
3. **`src/services/`**: Serviços internos gerenciadores:
   - `OutputManager`: Saídas físicas, gravação, streaming e MultiStream.
   - `AudioBusManager`: Barramentos Master, Aux A (Mix-Minus), Aux B (Fones).
   - `CanvasMixManager`: Gerenciamento de múltiplos renders e resoluções.
   - `MultiviewManager`: Geração da grade multiview.
4. **`libobs`**: Motor de captura, renderização gráfica DirectX 11 e encoding.

### 🔨 Como Compilar

Requisitos:
- **CMake** 3.16+
- **Visual Studio 2022** (MSVC C++ 17 ou 20)
- **Qt 6** (Core, Gui, Widgets)
- **libobs SDK**

```powershell
# Gerar arquivos de projeto com CMake
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release

# Compilar o executável FreeMix.exe
cmake --build build --config Release
```

---

## 📜 Licença & Conformidade Legal

Este projeto é software livre distribuído sob a licença **GNU General Public License v2.0 (GPL-2.0)**.  
O FreeMix utiliza a biblioteca `libobs` e componentes de código aberto mantendo estrita conformidade com seus termos de licenciamento original, preservando avisos de copyright e disponibilizando o código-fonte correspondente.

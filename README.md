# FreeMix Studio — Suite Profissional de Produção Broadcast

O **FreeMix Studio** é uma plataforma de produção ao vivo de alta performance inspirada na ergonomia e no fluxo operacional do **vMix** e **TriCaster**, utilizando a biblioteca `libobs` como motor de captura, renderização gráfica, processamento de áudio e transmissão.

> **Estado real do projeto (07/10/2026): leia [`CONTINUAR.md`](CONTINUAR.md).** Ele diz o que existe, o que foi testado e o que falta. O restante deste README e a pasta `docs` descrevem a intenção do produto e, em vários pontos, dão como pronto o que ainda não foi feito. O programa de verdade é o OBS Studio 32.2.2 mais os patches da pasta [`fork`](fork/LEIAME.md); as pastas `src` e `plugins/obs-freemix` são um rascunho anterior que nunca compilou.

---

## 🎯 Arquitetura de Produto

1. **Executável Nativo Oficial**:
   - Binário compilado `FreeMix.exe` (.NET 7 x64 / WinExe nativo) localizado em `bin/64bit/FreeMix.exe`.
   - Ícone oficial PE Win32 de alta resolução (`freemix.ico`).
   - Identificador explícito no Windows Shell (`AppUserModelID: FreeMix.Studio.BroadcastSuite.1.0`), isolando o aplicativo na Barra de Tarefas sem exibir cara ou janelas do OBS.

2. **Barra Superior de Presets e Menus Broadcast (Acima de Tudo)**:
   - Posicionada no topo do estúdio, acima dos monitores de Preview e Program:
     - `[Novo]`: Inicia um preset de estúdio limpo.
     - `[Abrir]`: Carrega projetos de produção (`*.fmx` ou coleções de cenas).
     - `[Salvar]`: Salva instantaneamente todas as entradas, filtros e rotas.
     - `[Salvar Como]`: Cria cópias e versões do preset.
     - `[Último]`: Recarrega o último estado de estúdio utilizado.
     - `[📺 Monitores: ON/OFF]`: Alterna entre visão completa de estúdio e mesa compacta.
     - `[⚙ Configurações]`: Central de preferências com 7 abas organizadas e modais centralizados com backdrop blur.

3. **Monitores de Estúdio Integrados**:
   - **Monitor de Preview (Prévia)**: Borda verde/laranja, tally visual, resolução `1080p60`, guias de Safe Area (80%/90%) e botão Quick Play.
   - **Central de Transições & T-Bar**:
     - Corte seco `CUT` em verde vivo.
     - Transições suaves: `FADE` (250/500/1000ms), `ZOOM`, `WIPE`, `STINGER 1..4`.
     - `T-Bar Broadcast Interativo`: alavanca deslizante proporcional de 0% a 100%.
     - `FTB (Fade to Black)`: botão de segurança de emergência com LED pulsante.
   - **Monitor de Program (PGM / No Ar)**: Borda vermelha forte, tally `● ON AIR` piscante, relógio com timecode em tempo real e atalhos de Overlays rápidos.

4. **Entradas & Overlays Estilo vMix**:
   - Grade dinâmica de entradas (Tiles com miniaturas vivas, áudio meters e tally de estado).
   - **8 Canais de Overlays Independentes** (DSK 1 a 8) acionáveis diretamente em cada entrada.
   - **Central de Replay Multi-Cam**: até 4 câmeras ISO simultâneas, marcação de In/Out e velocidades de 10% a 100%.
   - **DataSources**: integração de dados dinâmicos com Excel, Google Sheets, CSV e JSON.
   - **Transmissão Multi-WAN / Bonding LiveU**: agregação de interfaces (Ethernet + Wi-Fi + 5G) e failover hitless via RIST.

---

## 🛠 Gerenciamento e Atualização de Complementos (Sem Malabarismos)

Todos os plugins de terceiros essenciais foram auditados e integrados com paridade estrutural completa:
- `downstream-keyer.dll` (Overlays 1 a 8)
- `replay-source.dll` (Instant Replay)
- `source-record.dll` (MultiCorder ISO)
- `source-dock.dll` (Monitores de Fontes)
- `move-transition.dll` (DVE Dinâmico)
- `obs-websocket.dll` (IPC Broadcast v5)
- `obs-browser.dll` (Chromium CEF)

### Como Atualizar o Sistema e Plugins

Para atualizar plugins e o motor de vídeo sem perder configurações nem fazer malabarismos:

1. **Auditoria de Versões**:
   - Dê 2 cliques em `Verificar Complementos.cmd` ou execute:
     ```powershell
     powershell -File ferramentas/verificar-atualizacoes.ps1
     ```
   - O sistema consulta a API oficial do GitHub Releases e gera um diagnóstico comparativo de versões.

2. **Atualização Automática em 1 Clique**:
   - Dê 2 cliques em `Atualizar Complementos.cmd` ou execute:
     ```powershell
     powershell -File ferramentas/verificar-atualizacoes.ps1 -AtualizarTudo
     ```
   - O atualizador cria um backup preventivo em `backup-plugins/YYYY-MM-DD/`, baixa os pacotes mais recentes e extrai transacionalmente para as pastas portáteis do FreeMix.

---

## 🚀 Como Executar

- **Modo Estúdio Oficial**: Dê 2 cliques em `Iniciar FreeMix.cmd` ou no atalho da Área de Trabalho `FreeMix Studio.lnk`.
- **Mesa Portátil Direta**: Dê 2 cliques em `Iniciar Mesa.cmd`.
- **Empacotamento de Distribuição**: Dê 2 cliques em `Empacotar.cmd` para gerar um ZIP limpo e otimizado.
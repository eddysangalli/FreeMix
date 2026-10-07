# FreeMix Roadmap · Transição para Aplicativo Próprio

Este roadmap documenta o plano de execução e o status atual da transição arquitetural do FreeMix para um aplicativo autônomo baseado na biblioteca `libobs`.

---

## 📌 Etapa 1: Base do Aplicativo Compilado & Ciclo de Vida da `libobs` (Em Execução)
* [x] **Redefinição Arquitetural**: Documentação formal do escopo e arquitetura do aplicativo próprio (`FreeMix.exe`) com `libobs`.
* [x] **Serviços de Integração em C++**:
  - `OutputManager`: Saídas unificadas e suporte a MultiStream com encoder NVENC compartilhado.
  - `AudioBusManager`: Barramentos Master, Aux A Mix-Minus e Aux B Fones via `libobs-audio`.
  - `CanvasMixManager` & `MultiviewManager`: Múltiplos renders e composição da grade multiview.
* [ ] **Compilação do Executável Windows (`FreeMix.exe`)**:
  - Estrutura de compilação CMake (`src/app/CMakeLists.txt`).
  - Recursos Win32 compilados (`freemix.rc`, `freemix.ico`, manifesto DPI-Aware).
  - Ponto de entrada (`main.cpp` / `FreeMixApp`): Inicialização da `libobs` (`obs_startup`), detecção de GPU e criação do loop de eventos Qt.
* [ ] **Janela Principal Nativa (`FreeMixMainWindow`)**:
  - Contêiner de vídeo com os dois viewports DirectX 11 (`obs_display_create`): Preview e Program.
  - Barra central de transições (Cut, Fade, T-Bar).
  - Ancoragem integrada da Mesa de Produção do FreeMix.

---

## 📌 Etapa 2: Central de Configurações & Diálogos Operacionais Próprios
* [ ] **Central de Configurações FreeMix**:
  - Painel de Projeto e Vídeo (resoluções base/saída, FPS num/den).
  - Painel de Áudio e Barramentos (roteamento de dispositivos, níveis de monitoração).
  - Painel de Transmissão & MultiStream (adicionar/editar destinos RTMP/SRT).
* [ ] **Editor de Propriedades de Entradas**:
  - Janela própria de propriedades para câmeras DirectShow, placas DeckLink, mídias e navegadores.
  - Consulta direta às propriedades do motor (`obs_source_properties`).
* [ ] **Diálogo de Filtros e Efeitos**:
  - Ajuste de Compressor, Limiter, Redutor de Ruído e plugins VST na interface FreeMix.

---

## 📌 Etapa 3: Empacotamento Autônomo & Distribuição
* [ ] **Distribuição Portátil e Instalador**:
  - Pacote completo com `FreeMix.exe`, `libobs.dll`, plugins essenciais e redistribuíveis do Visual C++.
  - Armazenamento de dados do usuário em diretório próprio (`FreeMix/config/` ou `%APPDATA%\FreeMix`), sem dependência de instalações ou perfis do OBS.
* [ ] **Validação e Testes Automatizados**:
  - Testes de inicialização em ambiente limpo sem OBS pré-instalado.
  - Persistência e restauração de projetos FreeMix (.fmx).

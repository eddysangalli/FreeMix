# FreeMix

**Open-source live video production & switcher suite** — mesa de corte broadcast com motor OBS (libobs/FFmpeg), lógica operacional própria, não clone do OBS nem skin do vMix.

---

## O que é

FreeMix une em uma única interface: **Preview • Program • T-Bar • Bandeja de Inputs • Mixer de Áudio • Overlays/DSK • Replay A/B • Playlist • Calls N-1 • DataSources • Multistream/SRT/NDI/SDI**.

A unidade principal é o **INPUT** (câmera, VT, GC, Call, Replay, Composição), não Scene/Source. O operador pensa em produção, não em configuração de engine.

---

## Telas Principais

### Mesa Master (Switcher)
![Mesa Master](screenshots/01_mesa_master.png)

### Hub Remoto / Corte Remoto
| Hub Remoto | Corte Remoto |
|---|---|
| ![Hub Remoto](screenshots/02_hub_remoto.png) | ![Corte Remoto](screenshots/03_corte_remoto.png) |

### Mixer de Áudio
![Audio Mixer](screenshots/04_audio_mixer.png)

### Playout Engine & Monitor
| Playout Engine | Playout Monitor |
|---|---|
| ![Playout Engine](screenshots/05_playout_engine.png) | ![Playout Monitor](screenshots/06_playout_monitor.png) |

### Overlays / DSK
![Overlays DSK](screenshots/07_overlays_dsk.png)

### Composição Multibox (2/3/4 box, PiP, Slides)
![Composição Multibox](screenshots/08_composicao_multibox.png)

### Efeitos IA / PTZ / DVE 3D
![Efeitos IA PTZ](screenshots/09_efeitos_ia_ptz.png)

### Replay Multicam
![Replay Multicam](screenshots/10_replay_multicam.png)

### Calls N-1 (Retorno automático, Publisher, Sala)
| Calls N-1 | Call Publisher | FreeMix Call Sala |
|---|---|---|
| ![Calls N-1](screenshots/12_calls_n1.png) | ![Call Publisher](screenshots/seq08_call_publisher.png) | ![Call Sala](screenshots/seq09_freemix_call_sala.png) |

### DataSources (Excel/CSV, Google Sheets, JSON)
![DataSources](screenshots/13_datasources_dados.png)

### Saídas (Output Engine, SRT, NDI, SDI, Multi-stream, VirtualCam, ISO Rec)
![Saídas](screenshots/14_saidas_output.png)

### GC / Títulos (Esportes, Jornalismo, Lower Thirds, Scoreboard, Countdown, etc.)
| GC Central | Esportes Placar | Jornalismo Lower | Breaking News |
|---|---|---|---|
| ![GC Central](screenshots/seq18_gc_central.png) | ![Esportes](screenshots/20_gc_esportes_placar.png) | ![Jornalismo](screenshots/21_gc_jornalismo_lower.png) | ![Breaking](screenshots/46_gc_breaking_news_h.png) |

### Macros, Atalhos, Sinais, Configurações
| Macros | Atalhos MIDI | Sinais Diagnóstico | Configurações Gerais |
|---|---|---|---|
| ![Macros](screenshots/15_macros_automacao.png) | ![Atalhos](screenshots/16_atalhos_teclado.png) | ![Sinais](screenshots/17_sinais_diagnostico.png) | ![Config](screenshots/18_configuracoes_gerais.png) |

---

## Início Rápido

```cmd
# Abrir a mesa (prepara motor + API + janelas extras)
ABRIR-FREEMIX.cmd

# Instalar em outra máquina/pasta
INSTALAR-FREEMIX.cmd
```

> **Não execute** `obs-vmix/bin/64bit/FreeMix.exe` direto — use o inicializador para subir os serviços das janelas extras.

---

## Estrutura do Repositório

| Pasta | Função |
|---|---|
| `FreeMix/` | Repositório privado: painel, ferramentas, patches (não usar como instalação) |
| `obs-vmix/` | Instalação do operador (atualização nativa exige fechar a mesa) |
| `freemix-app/` | Código-fonte nativo e build do fork |
| `entregas/` | Instalador e pacotes assinados da versão atual |
| `docs/`, `scripts/` | Guias e scripts organizados por função |
| `qa-*/` | Testes isolados e evidências |
| `downloads/` | Dependências verificadas |
| `archived/` | Documentos/scripts antigos com recibos |
| `screenshots/` | Telas do sistema (este README) |
| `release-keys/` | Chaves privadas de assinatura (local only) |

---

## Documentação

- [Documentação completa](docs/README.md)
- [Organização de pastas](docs/ORGANIZACAO.md)
- [Entrega atual](docs/ENTREGA-ATUAL.md)
- [Pendências reais](docs/PENDENCIAS-REAIS.md)
- [Preparar servidor/VPS](scripts/manutencao/PREPARAR-SERVIDOR.cmd)
- [Coletar logs (ZIP diagnóstico)](COLETAR-LOGS.cmd)

---

## Princípios de Produto

- **Não é clone do OBS** — usa libobs/FFmpeg como base, mas a lógica é de mesa broadcast
- **INPUT-first** — câmera, VT, GC, Call, Replay, Composição em um card integrado
- **Reduzir passos** — Call N-1 automático, Replay A/B, DataSources, multisserviços integrados
- **Resolver defeitos históricos do vMix** — não apenas imitá-lo
- **Zero interfaces originais** — tudo operado pela UI própria do FreeMix

> Ver visão completa em [`FreeMix/docs/PRODUCT-VISION.md`](FreeMix/docs/PRODUCT-VISION.md)

---

## Licença

Código-fonte: licença proprietária / source-available. Binários em `entregas/` assinados Ed25519 (sem Authenticode).
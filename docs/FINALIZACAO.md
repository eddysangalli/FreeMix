# Finalização autorizada em 07/10/2026

Trabalhar na instalação portátil `obs-vmix`, espelhar arquivos de entrega em `FreeMix`. Preservar configurações e instâncias do operador; validar numa raiz e portas de QA. Cada item só fecha com evidência funcional.

Atualização de 08/10: limpeza autorizada concluída, 14,27 GiB recuperados no D:, pasta medida em 13,25 GiB. Lista em `qa-finalizacao/limpeza-2026-10-08.json`. Runtimes de QA antigos foram retirados; resultados históricos preservados. Incremento de Calls e interface está em fonte/QA separado, ainda fora do ZIP anterior; detalhes atuais no início de `CONTINUAR.md`.

- [x] API: erros reais, Cut/Fade/duração, volume zero, metadados reais e confirmação no motor.
- [x] Consoles: VT, GC/placar, mixer e T-bar operacionais, reconexão e estado compartilhado.
- [x] Rede: pareamento, bloqueio de arquivos de configuração e QR Code.
- [x] ISO: gravação e confirmação de arquivos, controle remoto e UI.
- [x] Replay: retenção de disco e players vinculados com limites de sincronismo explícitos.
- [x] Dependências: Node, ws, FFmpeg/FFprobe e ExcelJS incluídos no portátil.
- [x] Pacote limpo: dados pessoais/configurações removidos do artefato, hashes e execução numa pasta independente.
- [x] Atualizador: manifesto assinado, verificação, backup e restauração.
- [x] Reconciliar CONTINUAR e roadmap com código/evidência atuais.
- [x] Fontes de dados CSV/JSON/XLSX, arquivo/HTTP e vínculo à Tarja/Placar.
- [x] Teclado Cut/Fade real; cópia dos metadados de preset; conversão GTZIP básica.
- [x] Câmera física: vídeo e ISO reais; 720p nativo redimensionado para 1080p, 10 s.
- [ ] Integrações do escopo completo: NDI/OMT/SDI, MIDI físico, bonding e interfaces nativas completas; distinguir implementação de dependências físicas/externas.
- [ ] Homologação externa: câmeras físicas, Full HD prolongado, dispositivos e serviços reais.

- [x] Composições rápidas e slots persistentes; 17 verificações e 2 falhas injetadas no motor real.
- [x] Configurações próprias do fluxo principal; 9 verificações.
- [x] Mic privado e watchdog nativo; 13 verificações locais.
- [x] Conferência, N-1 individual e talkback seletivo implementados; 17 verificações locais de PCM real.
- [ ] Escuta externa dos Calls e entrega assinada desse incremento.
- [ ] Mix vertical simultâneo, snapshots/recovery versionado, .fmx completo e macros/triggers completos.

Resultados não equivalem a declarar o produto amplo terminado.

Entrega local verificada: `entregas/FreeMix-Studio-0.1.0-local.20261008032818.zip`, 428.947.415 bytes, SHA-256 `e1fc1f9295de96abb5968e79adc2d04a967b4202aafa3bbae18360982a56957e`. Assinatura dos 8.482 arquivos do manifesto e conteúdo dos 8.492 arquivos do ZIP conferidos. Registro final: `qa-finalizacao/entrega-final.json`.


## Incremento de 08/10/2026 — limites verificados

- Lista de execução completa: `docs/PENDENCIAS.md` (cópia da lista do workspace).
- ISO configurável TS/MKV: 18 verificações, arquivos H.264+áudio decodificáveis e MKV em quatro segmentos. Salvar opções pela nova janela confirmado. MP4 ISO retirado por falhar durante REC; áudio Master oferecido mas escuta/seleção de trilha ainda exige teste específico.
- N-1, conferência e talkback seletivo: 17 verificações locais com PCM real repetidas no novo executável. Calls pela internet e audição humana pendentes. Botão rápido usa o mesmo mecanismo; validar gesto completo com convidado/publicador preparado.
- Barramentos: automático e reparo de Bus A, 4 verificações. Menu/Mesa: cabeçalhos nativos de altura zero. Preview: fundo #1e2328 igual à mesa, coluna/faixa limitada e seis slots persistidos.
- Barras de mídia: sem faixa escura/divisor, câmera/cor sem controles/zeros, pausa e seek a 15 s de vídeo real confirmados. Captura do navegador não substitui a aprovação visual da mesa nativa.
- Configurações completas do OBS: clique na central abre o diálogo nativo e visibilidade Qt confirmada. Reorganização integral segue CF-01.
- DistroAV 6.2.1 oficial em staging; runtime 6.3+ não confirmado. NDI não instalado/homologado. Multistream ainda compartilha conteúdo/encoders; seleção independente segue ST-01.
- Incremento assinado por lista explícita; sem copiar config, gravações, local.js ou chave privada. Arquivos nativos alterados e novos incluídos como fonte e patch para proveniência GPL.

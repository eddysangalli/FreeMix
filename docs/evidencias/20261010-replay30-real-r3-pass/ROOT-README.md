# Replay Native30 — ensaio real próprio R3

18 capturas compostas A/B com diferença de zero quadros, em pausa/partida/seek/frame-step, velocidades30/50/100%, NTSC e VFR (frame-step VFR recusado). 14 segmentos estéreo do Master digital confirmaram áudio da câmera selecionada e silêncio fora do ar/desabilitado. Cadência integral:900 quadros NTSC,540 VFR,885 VFR tardio.

Fechamento cooperativo automático exit0, zero avisos/alocações/crash, pins de Native fonte/destino2085+2085, QA65, runtime29 e2 snapshots intactos. Root inspecionou visualmente as duas capturas incluídas. O FAIL anterior de harness foi preservado; seu QA antigo foi fechado pelo usuário e conferido separadamente. Novas raízes já usam FreeMix-QA- e fecham sem operador.

Mídia sintética própria e áudio digital: não homologa SSD longo, genlock físico, hardware de áudio, projeto do operador, Calls nem o novo Native32.

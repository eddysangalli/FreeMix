# Recepção SRT 4:4:4 e alpha packed — 2026-10-09

Ensaio local dirigido, instalação privada `C:/Users/eddyr/AppData/Local/Temp/FreeMix-QA-SRT444-20261009`, API18312/WS14612 e receptor SRT127.0.0.1:18360. Operador e QA-Menus18310 preservados. Imagem analítica320×180 com alpha0/128/255, rampa e padrões RGB de1pixel. Fonte image_source criada por OBSWS na própria QA; destinos iniciados/parados somente nesta QA.

## Primeira execução

Build SHA256 `addc250a7215d04baa8b0b3de58517db1cefcdc5046873f6ca2342d4ee623f02`. Recibo `resultado-srt444-20261009.json`.

| Caso | Fluxo efetivamente recebido | Resultado |
|---|---|---|
|444none|H264 High4:4:4Predictive, yuvj444p fullrange,320×180,30fps,10.021333s|PASS do formato recebido|
|444packed|Mesmo codec,640×180,30fps,10.021333s; RGB Fill MAE0.202083|FAIL da Key: alphaMAE128.002778,max255 e amostras0/0/0|

Ambos produziram7.646.524bytes MPEGTS,6.104197Mbps de mídia+TS. Esta medição não inclui cabeçalhos/retransmissões SRT nem prova WAN. `yuvj444p` identifica formato8bit4:4:4 em faixa completa, não subamostragem4:2:0.

O quadro recebido mostrou Fill à esquerda e região Key totalmente preta. Causa encontrada em fonte: `gs_technique_end` em libobs/graphics/effect.c127–131 limpa os valores atuais dos parâmetros do efeito. FreeMixSrtAlpha.hpp configurava `image` antes da técnica Fill, mas iniciava Key sem reconfigurar a textura após o término do loop Fill. A correção proposta ao root é repetir `gs_effect_set_texture(...image,...)` imediatamente antes do loop Key. Nenhuma alteração Native feita por este agente.

NativePID201216 fechou por shutdown_idle com exit0, sem crash novo; API própriaPID13972 encerrada após conferir caminho. O FAIL permanece preservado, incluindo TS/quadro/análise originais em `srt444-alpha-20261009/first-failure`.

## Correção e única prova adicional

Root repetiu a configuração da textura `image` imediatamente antes do loop Key e compilou com sucesso. Build corrigida SHA256 `82b743e26ba4c592d76df5dcde827a0bf95f3025e101736a28ca7f0edaf76621`. Executado somente `--packed-only`,10s, sem repetir caso444none.

Recibo `resultado-srt444-keyfix-20261009.json`: **PASS** do fluxo efetivamente recebido, H264 High4:4:4Predictive, yuvj444p/fullrange,640×180,30fps,10.021333s. Após decodificação, a Key apresentou MAE0,max0 e erro de borda0 em57.600pixels; amostras alpha0/128/255 iguais à referência. FillRGBMAE0.202083 em pixels com alpha≥64. As duas metades pertencem ao mesmo quadro codificado. Crop/extração da Key e alphamerge produziram `444-packed-recomposed.png`. A própria PNG RGBA recomposta foi decodificada novamente e seu canal alpha também apresentou MAE0/max0, amostras0/128/255; isso foi verificado sobre o TS existente, sem iniciar outra transmissão.

NativePID22192 fechou por shutdown_idle com exit0; nenhum crash novo. API própriaPID73352 encerrada após conferir caminho. Receptor FFmpeg terminou0. Operador8088/4466 e QA-Menus18310 preservados.

O resultado valida a implementação nesta amostra curta CPUx264/loopback. Não estabelece desempenho1080p/4K, comportamentoWAN, interoperabilidade de todos os receptores nem operação contínua.

## Arquivos de evidência

- `srt444-alpha-20261009/analytic-rgba.png`, `.raw` e fixture.json: referência e hashes.
- `srt444-alpha-20261009/444-none.ts` e `444-packed.ts`: fluxos reais recebidos.
- `srt444-alpha-20261009/444-packed-decoded.png` e `444-packed-recomposed.png`: quadros decodificados.
- `preparar-qa-srt444-20261009.mjs`, `srt444-fixture-20261009.mjs`, `srt444-receptor-20261009.mjs`, `test-srt444-20261009.mjs`: preparação, recepção, análise e prova reproduzível.

Limites: amostra curta CPUx264320×180 em loopback, sem equipamentos externos, sem teste de carga/longa duração. H264 packed exige receptor consciente do layout Fillleft/Keyright; receptor comum não restitui alpha automaticamente.

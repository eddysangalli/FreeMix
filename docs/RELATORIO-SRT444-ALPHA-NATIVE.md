# Rota SRT 4:4:4 e alpha empacotado

Fonte nativa preparada em 2026-10-09, compilada e recebida em loopback pela raiz. Evidência final: `resultado-srt444-keyfix-20261009.json`, EXE SHA-256 `82b743e26ba4c592d76df5dcde827a0bf95f3025e101736a28ca7f0edaf76621`.

`FreeMixMultistream.cpp` persiste e lê `chroma: '420'|'444'` e `alphaMode: 'none'|'packed'`. Valores ausentes conservam 420/none. As configurações ativas não podem ser alteradas sem parar a saída. 4:4:4/packed exigem SRT (incluindo auto com URL srt), encoder obs_x264 e H.264. Packed exige chroma444 e largura lógica até1920, porque o quadro codificado tem largura dobrada.

O caminho 444 usa view privado I444/BT709/fullrange, preferred I444 e perfil x264 high444. Quando shared é selecionado com essa rota, Programa é renderizado por encoders privados. Não reutiliza o encoder principal. A seleção de áudio/barramento UUID e a proteção do diretor privado permanecem.

`freemix_srt_alpha::Create` é um helper da raiz: renderiza uma cena transparente em um único quadro, com Fill RGB straight opaco à esquerda e Key alpha em cinza opaco à direita. A cena privada usa o tamanho lógico W×H. Overlays selecionados são incorporados à cena antes do empacotamento. Atualizações de Programa substituem apenas o item de conteúdo nessa rota, preservando os overlays. A destruição segue view, wrapper, items/frames de overlays, cena.

Readback adicional: encodedWidth, encodedHeight e alphaLayout. Capabilities: srtChroma444Supported, srtPackedAlphaSupported, srtPackedAlphaMaxWidth1920, srt444Encoder obs_x264, srtAlphaLayout fill-left-key-right.

Alpha empacotado não é um canal alpha padronizado do SRT/MPEGTS. O receptor precisa dividir as metades e usar o Key como máscara (crop+alphamerge). Compressão H.264 pode introduzir pequenas diferenças na máscara; não há promessa de lossless, HDR ou HEVC auxiliar.

Nenhuma instância QA Menus ou do operador foi alterada pelo trabalho nativo. A demonstração/receptor local utilizou QA-SRT444 isolada da raiz. A primeira prova conserva o PASS de 444 sem alpha e o FAIL do Key preto; o helper da raiz corrigiu o vínculo da textura antes de renderizar Key. A repetição dirigida passou: H.264 High 4:4:4 Predictive/yuvj444p, 640×180 transmitido (320×180 lógico), 30 fps, 10,021333 s, alpha 0/128/255 com MAE 0 e RGB MAE 0,202083. Receptor e motor encerraram com código 0, sem crash novo. Os 6,104197 Mbps medidos no MPEG-TS não incluem overhead SRT. O ensaio não comprova Full HD, WAN ou HDR.

# Testar SRT 4:4:4 e cor + máscara

Na Mesa, abra **Externo → SRT / RIST**. Selecione um destino SRT existente ou clique em uma saída livre para configurá-la. O botão Transmitir abre MultiStream para RTMP/RTMPS/HLS; SRT fica no Externo. Abrir a tela e preparar o perfil só alteram o rascunho; confira e salve antes de transmitir.

## 1. Conferir a conexão sem alpha

No computador receptor, abra primeiro um receptor SRT em modo **listener**, porta UDP **18360**. No remetente FreeMix, escolha SRT, modo caller, 1280×720, 30 fps, 6000 kbps e 4:2:0 sem alpha. URL:

```text
srt://IP_DO_RECEPTOR:18360?mode=caller&latency=500000
```

`latency=500000` corresponde a 500 ms nessa URL. No teste no mesmo computador, use `127.0.0.1`. Em rede local, use o IP privado do receptor. Pela internet, o receptor precisa de encaminhamento UDP e firewall para essa porta, ou conexão por VPN; CGNAT pode impedir recebimento direto. Não envie senhas ou chaves nos prints.

OBS pode receber essa URL por uma Fonte de mídia com arquivo local desmarcado, usando `mode=listener`. Primeiro confirme vídeo e áudio no formato comum. Se houver bloqueio de codec, use decodificação por software.

## 2. Preparar o perfil com transparência

Escolha uma entrada ou composição com transparência real (GC/PNG com alpha). Na tela de destinos, clique **Preparar SRT 4:4:4 + máscara** e confira:

- Protocolo SRT, H.264 e encoder x264.
- Amostragem 4:4:4 e alpha **Cor + máscara lado a lado**.
- Quadro lógico 1280×720; quadro transmitido **2560×720**.
- Conteúdo, áudio e URL do receptor. Salve e inicie somente depois de abrir o listener.

O transporte contém cor à esquerda e alpha em cinza à direita, no mesmo quadro: preto é transparente e branco é opaco. O receptor comum mostra as duas metades; **SRT não entrega alpha nativo automaticamente ao OBS/vMix**. O receptor precisa separar e recompor. A cor enviada já é RGB direto, sem premultiplicação, adequado ao `alphamerge` abaixo.

## 3. Recompor diretamente no OBS

No receptor, use o plugin oficial [obs-shaderfilter](https://github.com/exeldro/obs-shaderfilter) compatível com seu OBS. A instalação FreeMix acompanha o shader em `painel/efeitos/srt-packed-alpha.shader`.

1. Na Fonte de mídia, desmarque **Arquivo local** e use `srt://0.0.0.0:18360?mode=listener&latency=500000`. Comece com decodificação por hardware desativada; o decodificador deve aceitar H.264 High 4:4:4.
2. Em Filtros, adicione **User-defined shader**, ative carregar shader de arquivo e escolha `srt-packed-alpha.shader`. Deixe **Override entire effect** desativado e expansão em zero.
3. **Depois do shader**, adicione **Crop/Pad** em modo relativo e corte a metade direita: **1280 px** para transporte 2560×720. Deixe os demais cortes em zero. Não corte antes do shader: ele precisa ler a máscara.
4. Coloque um fundo abaixo da fonte para conferir a transparência. Para comparar com uma imagem PNG de referência no OBS, ative **Alpha linear** nessa imagem.

O shader recompõe o quadro recebido; não gera transparência para conteúdo originalmente opaco. A prova local do filtro e Crop usa um quadro decodificado de SRT recebido. Recepção contínua no OBS externo e carga 720p/1080p devem ser conferidas no computador receptor.

## 4. Capturar no receptor com FFmpeg

Abra um terminal na pasta `obs-vmix` do FreeMix. Os exemplos usam CMD e o FFmpeg distribuído em `runtime`. Crie uma pasta para o teste:

```bat
mkdir gravacoes
runtime\ffmpeg.exe -hide_banner -i "srt://0.0.0.0:18360?mode=listener&latency=500000" -t 10 -map 0:v:0 -map 0:a? -c copy "gravacoes\srt-packed-recebido.mkv"
```

Deixe o comando aguardando e inicie o remetente. Ele grava dez segundos após receber mídia. Pare a saída no FreeMix ao terminar. Para conferir as dimensões e o formato de cor:

```bat
runtime\ffprobe.exe -v error -select_streams v:0 -show_entries stream=width,height,pix_fmt,profile -of default=noprint_wrappers=1 "gravacoes\srt-packed-recebido.mkv"
```

Para o exemplo packed, espere 2560×720 e formato 4:4:4 (`yuv444p`), perfil High 4:4:4. O teste sem máscara deve ter largura 1280.

## 5. Gerar um PNG com alpha recomposto

O comando recorta as metades, converte a metade direita em máscara e combina os dois canais. Não redimensione o quadro recebido antes dos recortes.

```bat
runtime\ffmpeg.exe -hide_banner -i "gravacoes\srt-packed-recebido.mkv" -filter_complex "[0:v]split=2[fill][key];[fill]crop=iw/2:ih:0:0,format=rgba[cor];[key]crop=iw/2:ih:iw/2:0,format=gray[mascara];[cor][mascara]alphamerge[rgba]" -map "[rgba]" -frames:v 1 -update 1 "gravacoes\srt-alpha-recomposto.png"
```

O PNG deve ter 1280×720 e transparência fora do conteúdo. Abra sobre um fundo quadriculado e confira bordas e áreas semitransparentes. Para salvar vídeo com alpha e o áudio recebido em um intermediário FFV1:

```bat
runtime\ffmpeg.exe -hide_banner -i "gravacoes\srt-packed-recebido.mkv" -filter_complex "[0:v]split=2[fill][key];[fill]crop=iw/2:ih:0:0,format=rgba[cor];[key]crop=iw/2:ih:iw/2:0,format=gray[mascara];[cor][mascara]alphamerge[rgba]" -map "[rgba]" -map 0:a? -c:v ffv1 -pix_fmt bgra -c:a copy "gravacoes\srt-alpha-recomposto.mkv"
```

FFV1 é um intermediário; confirme suporte no programa onde será usado. OBS/vMix recebendo o SRT bruto precisam de um filtro de unpack compatível ou outro receptor que faça essa recomposição. Recortar só a metade esquerda remove a máscara, mas não recria transparência.

## Entre computadores usando ZeroTier

Instale ZeroTier nos dois computadores, entre na mesma rede privada e autorize os dois dispositivos no painel da rede. Use o **Managed IP do receptor** no caller FreeMix. O receptor mantém a URL listener acima; permita a porta UDP18360 no firewall dessa conexão. O procedimento de entrar/autorizar consta no [guia oficial ZeroTier](https://docs.zerotier.com/quickstart/).

Não use o endereço público quando a intenção é trafegar pela VPN. A rede virtual pode contornar a necessidade de encaminhar a porta SRT no roteador, mas conexão e desempenho ainda precisam ser testados. Mantenha o controle FreeMix/API e WebSocket locais; não abra 8088, a porta alternativa da API ou 4466 para a internet.

## Limites

Esta rota usa x264/H.264 High 4:4:4, SDR 8 bits. O quadro lógico tem largura máxima de 1920 px; packed transmite largura dupla, até 3840 px. Encoders GPU, HEVC e AV1 não são opções desta rota. Nem todo decodificador H.264 suporta 4:4:4; verifique no receptor escolhido. A compressão de vídeo pode alterar detalhes da máscara e suas bordas; 4:4:4 não significa alpha sem perdas. Não equivale a HDR, genlock ou alpha universal de SRT. O funcionamento WAN depende da conexão e do receptor; os testes locais não homologam a rede externa.

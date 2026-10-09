# SRT: teste simples e alpha

Primeiro salve e feche o FreeMix desta instalação e abra **ABRIR-FREEMIX.cmd**. A versão anterior `20261009045022` não oferece o 4:4:4/alpha novo; por isso os controles aparecem bloqueados nela. Transmitir abre MultiStream. SRT, NDI e OMT ficam em **Externo**.

## Mesmo computador, recebendo no vMix

1. No vMix, adicione uma entrada Stream / SRT em **Listener**, porta **18360**, latência **120 ms**.
2. No FreeMix, abra **Externo → SRT / RIST** e clique numa saída livre à esquerda.
3. Deixe **Conteúdo: Programa**, **Caller**, IP **127.0.0.1**, porta **18360**, latência **120 ms**. Clique **Transmitir esta saída**. A URL é montada automaticamente.
4. Comece sem alpha e em 4:2:0. O decoder do vMix precisa aceitar o perfil escolhido para testar 4:4:4. Alpha empacotado não é recomposto automaticamente no vMix.

Salvar configuração apenas guarda os dados; Transmitir esta saída guarda o rascunho e inicia o envio. Pare a saída antes de alterar seus parâmetros.

## Outro computador, pela rede ZeroTier

Ambos precisam entrar na mesma rede privada e ser autorizados no ZeroTier Central. Pegue o **Managed IP do receptor**. No receptor, prepare SRT Listener na porta **18360**. No FreeMix, use Caller, aquele IP e latência inicial de **500 ms**. Os IPs listados na tela são desta máquina; eles não substituem o IP do receptor. Se o Windows bloquear o programa receptor, autorize o tráfego nessa rede.

## Alpha, recebendo no OBS

1. No OBS receptor, adicione uma Fonte de mídia, desmarque Arquivo local e informe `srt://0.0.0.0:18360?mode=listener&latency=500000`. Comece com decodificação por hardware desligada.
2. No FreeMix, escolha **Conteúdo: Entrada / composição própria** e selecione um PNG, GC ou composição que realmente tenha transparência. Configure Caller/IP do OBS/porta18360/500ms.
3. Clique **Preparar SRT · 4:4:4 + alpha**, confira os dados e clique **Transmitir esta saída**.
4. No OBS, use o plugin **obs-shaderfilter**, filtro **User-defined shader**, com o arquivo `obs-vmix/painel/efeitos/srt-packed-alpha.shader` fornecido. Depois desse filtro, aplique Crop/Pad e recorte à direita a largura lógica enviada. Exemplo: 1280×720 lógico chega em 2560×720; recorte 1280 à direita.

O quadro traz a cor à esquerda e a máscara cinza à direita. O filtro recompõe a transparência. Uma câmera ou Programa opaco continua opaco mesmo com alpha habilitado.

Prova local executada: dez segundos em 320×180 lógico, H.264 4:4:4 e reconstrução da máscara; o filtro OBS também foi conferido com um quadro recebido. Internet, carga em Full HD e compatibilidade entre máquinas continuam pendentes da rodada externa. Guia detalhado na tela: **Como testar SRT local, ZeroTier e alpha no OBS**.

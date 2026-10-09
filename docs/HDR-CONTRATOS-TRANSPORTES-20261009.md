# HDR nas saídas — contrato verificado em 09/10/2026

O código integrado desta entrega produz SDR BT.709. OMT PA16 preserva precisão de render e alpha16; isso não muda a transferência para PQ/HLG. Solicitações de HDR feitas à central agora recebem erro explícito antes de configurar ou ligar saídas, em vez de perder silenciosamente a opção no despacho.

## NDI

A documentação NDI6 distingue recepção e envio: o SDK padrão recebe HDR, enquanto envio com metadados exige Advanced SDK licenciado. A versão trial interrompe envio HDR após30min. O contrato existe, portanto não é correto dizer que “NDI não suporta metadados HDR”. Nossa integração usa o SDK padrão e render SDR8. [Fonte oficial](https://docs.ndi.video/all/developing-with-ndi/sdk/hdr).

Uma implementação futura licenciada deve produzir P216/PA16 com PQ/HLG, faixa limitada e primárias/matriz BT.2020, além de preencher `p_metadata` com `ndi_color_info`. Apenas anexar esse XML ao PA16 SDR existente produziria um sinal incorreto. Precisa verificar também o receptor NDI6 e níveis de luminância; não disponibilizar o trial como saída permanente. [Contrato de HDR](https://docs.ndi.video/all/developing-with-ndi/sdk/hdr).

## OMT

O plugin oficial suporta workflows HDR quando a saída OBS está em P010/P216 e o receptor escolhe o espaço de cor apropriado. Portanto, é possível transportar valores HDR no OMT atual com interpretação combinada entre as pontas. A rota integrada FreeMix atual não implementa isso: sua composição PA16 é SDR. [Plugin oficial](https://github.com/openmediatransport/omtplugin/blob/master/README.md).

O protocolo1.0 anuncia somente601/709/undefined no campo `ColorSpace`. A recomendação oficial de metadata1.0 define controle/PTZ/ancillary/grouping, sem elemento padronizado de transferência PQ/HLG. Não inventamos enum2020 nem XML privado fingindo reconhecimento automático. [Protocolo oficial](https://raw.githubusercontent.com/openmediatransport/libomtnet/master/PROTOCOL.md), [metadata oficial](https://github.com/openmediatransport/Metadata).

Um caminho viável é saída independente P216 PQ/HLG, declarada como **interpretação manual no receptor**, com escolha correspondente no plugin OMT. Exige um render HDR real e comparação de níveis no receptor16bits; alphaHDR é uma extensão adicional. Para compatibilidade vMix, é necessário verificar o comportamento da versão/receptor instalado, sem deduzir suporte pela existência do codec16bits.

## SRT e SDI

SRT transporta o vídeo codificado; PQ/HLG depende do pixel format10bits e dos metadados do codec. O fonte OBS existente suporta PQ/HLG em NVENCHEVC/AV1 e no muxerFFmpeg, mas a saída independente FreeMix desta entrega fixaNV12/I4448bits. Ela não implementa uma opçãoHDR. Uma nova rota precisa selecionar P010, encoder10bits, primárias/matrizBT2020 e transferência correta, e comprovar o bitstream com receptor/ffprobe. Não habilitamos um controle que apenas marcaHDR no formulário.

O plugin DeckLink original contém caminho PQ e metadados HDR condicionado ao dispositivo/driver. A central FreeMix usa `force_sdr:true` e a view própria BGRA8BT709. A central precisa de implementação e ensaio físico adicional, além de uma placa compatível; conectar hardware não torna HDR esta rota.

Referências locais verificadas: `plugins/obs-nvenc/nvenc.c`, `plugins/obs-ffmpeg/obs-ffmpeg-mpegts.c`, `plugins/decklink/decklink-output.cpp`, `plugins/decklink/decklink-device-instance.cpp` e `plugins/decklink/OBSVideoFrame.cpp`, sob `freemix-app/`. Não foi alterado nem reconstruído nenhum desses plugins nesta investigação.

## Evidência de recusa correta

`qa-finalizacao/resultado-hdr-output-contracts-20261009.json`: PASS, solicitações HDR/transferPQ/HLG/BT2020 recusadas pela central e por startNDI/OMT antes de qualquer requestNative. SDR normal continua aceito; capability/razão distinguem SDKNDIlicenciado e workflowOMTmanual. O recibo inclui hashes e parseNode dos seis arquivos executáveis. Isso é prova de contrato, não recepção físicaHDR.

Novos arquivos: `obs-vmix/ferramentas/saidas-hdr.mjs`, este documento e teste/recibo acima. Alterados: `saidas-producao.mjs`, `saidas-srt.mjs`, `ndi-producao.mjs`, `omt-producao.mjs`, `painel/remoto/saidas-external-ui.js` e o textoRGBdireto em `painel/remoto/saidas.html`. Nenhuma fonte Native congelada foi alterada nesta etapa.

# Diagnóstico AV silencioso: sincronismo ainda inconclusivo

Uma execução local sintética de20s, sem Native/CEF/VDO/microfone/WAN. Antes do Generator e após AudioData:400 blocos/960000 frames,145920 samples nonzero e peak0.35 idênticos, sem erro. Worklet receptor executou7651 vezes, recebeu2 canais/979328 frames e103 heartbeats, mas todas as amostras eram zero; não houve processorerror nem entrada vazia. Portanto Gain0 não impediu o processamento nesse ensaio.

RTP recebeu1000 pacotes/14941 bytes, sem perda, mas totalSamplesReceived e jitterBufferEmittedCount continuaram0. Há silêncio entre a fonte gerada e o áudio reproduzido; esses dados ainda não distinguem Generator, codec/RTC e receptor. Nenhum par áudio/vídeo suficiente: aceite AV original continua inconclusivo, avSyncProven=false. Recursos, contexto de áudio, tracks, RTC e HTTP encerrados;28 textos+2 helpers pós-hash iguais. Próxima intervenção separada: tap local na fonte, sem alterar timestamps, ganho ou limiares.

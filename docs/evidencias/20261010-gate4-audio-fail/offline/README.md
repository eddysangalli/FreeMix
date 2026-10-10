# Gate4 — diagnóstico offline, sem nova execução

O resultado original continua **FAIL** (recibo SHA `f1efd69866cef088aadae9ddd38d63ca5ce1f88da0f51bbe19d1a4641b4d414f`). Nenhum limiar do runner, arquivo TS/MP4, critério `.6`, receptor ou fonte Native foi alterado. Nenhum Native/API/replay foi executado. Decodificação CPU de três arquivos já gravados, com ffmpeg/ffprobe da própria instalação QA, para PCM em pasta própria `private` (fora do export).

Program e Source têm PCM byte idêntico durante 24 s: SHA `b2fcdca61b382fef8e1a7c05c79772d835c94cb6a9753cb86ce13b8b71d9ef2c`. Os dois canais têm RMS ~.106 e frequência correta. A projeção coerente GLOBAL falha `.171/.046`; janelas de 1 s cruzando 9 e 21 s também falham `.478/.323` e `.465/.305`. Não são todas as janelas PASS. Fora das junções a energia do tom é próxima de 1; PTS dos pacotes AAC é monotônico com passos 21.333/21.334 ms.

Os saltos repetem com 12 s de intervalo. A fixture declara áudio de 12 s e decodifica 12.010667 s, ou 512 amostras adicionais. O deslocamento previsto `wrap(-2π*f*512/48000)` coincide com as fases dos dois saltos nos dois canais, erro abaixo de .01 rad. Essa correspondência sustenta a hipótese de descontinuidade na repetição/padding AAC; não prova qual componente do player/timestamps realizou o reset. Como a rota Source excluída tem o MESMO PCM, os dados não sustentam atribuir a perda de coerência ao Gate final. Também não equivalem a reprodução sem descontinuidade ou homologação A/V.

`RESULT.json`: projeção GLOBAL original intacta, janelas absolutas de 1 s e 250 ms, fases, RMS, PTS e seis modelos: contínuo PASS; mudo/swap/mix incorreto/meia captura muda recusados; fase de loop constante em energia mas global incoerente. `SUMMARY.json`: comparação quantitativa de padding e duas descontinuidades, limites e proposta de contrato futuro. Os seis modelos são evidência de método, não Native.

Próximo contrato deve ser definido ANTES de qualquer nova execução: fixture longa sem repetição e reinício explícito antes da captura (duração cobrindo todo o intervalo), ou limites/padding de loop contratados com diagnóstico de continuidade. Preservar a exigência global atual; não promover esta rodada a PASS retrospectivo nem apenas trocar `.6` por energia por janela. NTSC/reconnect/context reset ainda não foram executados nesta rodada. `audioPolicy=unchanged` não homologa uma política geral de mute/segurança de FTB.

Inputs e recibo foram re-hasheados após a leitura; arquivos privados PCM, executáveis, TS, MP4 e raw logs não pertencem à allowlist. Root decide nova qualificação/ensaio.

# SRT HDR Native24 — prova real local

Estado: PASS_NATIVE24_SRT_HDR_LOOPBACK e PASS_NATIVE24_SRT_HDR_CONTEXT_GUARDS. Executado em instalação TEMP própria: base assinada031500 e todos os2.085 arquivos da árvore congelada a047860. Não alteramos produto, Native, pacotes selados, Git, processos/configurações/portas do operador. Nenhum envio WAN, REC, transmissão principal ou dispositivo de captura foi iniciado. SRT dos testes foi explicitamente iniciado para listeners loopback próprios.

## Mídia medida

Encoder realmente usado: obs_nvenc_hevc_tex. Sete capturas HDR na matriz principal e uma na prova de lifecycle: HEVC Main10/yuv420p10le, limited, BT.2020/PQ, VUI9/16/9 lido nos SPS reais. Origem sintética lossless com877 níveis; saída Native NVENC com863 valores distintos na rampa. As seis bandas PQ deram64/509/573/609/657/723, exatamente os valores preparados; bandas de300 e1000nits permanecem distintas.648 níveis não são múltiplos de4. Isso comprova que esta rota/operação preservou precisão além de8bits, sem afirmar todas as origens/filtros/encoders.

Quatro sessões simultâneas: cada uma produziu152 frames decodificados, com os mesmos valores HDR e AAC/PCM real. Apenas esse encoder/GPU em1024×240 a30/1 foi homologado localmente. Os demais IDs listados pelo Native são opções carregadas, não prova de suporte real; não testamos QSV/AMF, UHD,60fps ou limite geral de sessões.

AAC48000Hz estéreo decodificado: RMS≈0,087 e tom≈440Hz, com início A-V≈−21,334ms. Master foi uma escolha explícita e a própria fonte estava habilitada na cena de Programa. Master é o mix do Programa; escolher uma origem independente para vídeo não escolhe automaticamente seu áudio. Bus independente requer UUID público com tracks globais desativados, conforme contrato Native; privacidade/diretor não foi injetada neste ensaio.

PTS de vídeo/áudio são monotônicos. Capturas HDR curtas têm intervalo máximo0,1s; SDR0,033334s. As capturas delimitadas encerram a conexão e podem cortar os últimos B-frames: esta prova não afirma continuidade perfeita, atraso de display ou estabilidade de uma transmissão longa. Não houve ensaio subjetivo de HDR em monitor físico.

## Ciclo de vida observado

- Configurar não inicia envio; quatro slots começaram sem recursos ativos. SDR, alpha, autoStart e host wildcard recusados no preflight.
- Configure durante saída ativa foi recusado; shutdown_idle recusou recursos HDR pendentes.
- Reconexão automática voltou a entregar HDR/AAC sem segundo start. Parada repetida durante reconnect drenou em≈102ms.
- Parada imediata em starting sem listener drenou em≈3.151ms, conservando erro de transporte terminal. Um teste separado aguardou a falha real sem listener em≈3.257ms; estado error/activefalse/pendingfalse e a GUI continuou legível.
- Troca de coleção via CreateSceneCollection durante mídia real: contexto efetivo confirmado por GetSceneCollectionList, drenagem antes da limpeza,≈220ms. Não chamamos apenas a aceitação do comando de sucesso.
- Dois recebimentos SDR H.264420/High+AACP​CM passaram, incluindo reconnect e stop, exercitando o callback MPEGTS alterado.
- Três execuções Native fecharam cooperativamente, cada uma com contador0 e crash0; nenhum forcekill de Native. Meter warnings foram4 na primeira execução,1 na matriz corrigida e4 na prova de contexto. São observações preservadas, não ocultadas nem atribuídas sem investigação.

A troca de coleção interrompe deliberadamente seu listener; exit4294967291 nesse caso é EOF/erro esperado do receptor interrompido, não um decode/receiver exit0 PASS. Não provamos logoff externo, WM_CLOSE com saída ativa, timeout extremo do drain, troca de perfil, shutdown forçado, hardware ou WAN.

## Falha do harness preservada

receipt.json / run.mjs: FAIL por stderr maxBuffer de8MB no trace_headers. O NVENC CBR gerou filler e o log completo ultrapassou o limite. A fonte/pacote/Native ficaram intactos; o primeiro processo fechou com contador0/crash0. Não atribuímos essa falha ao encoder/transporte Native.

run-retry1.mjs filtra somente VPS/SPS/PPS antes do trace_headers (filter_units=pass_types=32|33|34), mantendo os SPS reais. Reutilizou a instalação própria já fechada, conferiu todos2.085 hashes e não repetiu instalação. retry1-receipt.json preserva a prova corrigida. run-lifecycle.mjs é a continuação finita separada, sem repetir a matriz4senders. Não há resposta simulada ou alteração do renderer/motor.

## API/UI para integração Root

API-NATIVE-CONTRACT.json registra request/config usados e shape da resposta real, sem tokens. É uma rota manual separada: Externo → SRT HDR. Escolher somente fontes de hdrSources; UUID da entrada/cena precisa permanecer existente/público, com dimensões pares. Preservar origem e tamanho originais. UI deve oferecer apenas IDs retornados em encoders e indicar validação de GPU pendente até mídia real.

action/senderId ficam fora de config; config usa whitelist explícita do helper. configure/start success significa aceitação do pedido, não LIVE. Mostrar state, active, pending, error e contadores. starting/reconnecting/stopping não são idle/live. Erro terminal pode coexistir com success:true em uma consulta state: success nesse caso é sucesso da consulta. Stop só conclui após pendingfalse/activefalse. Sem autoStart, fallback SDR, alpha/FillKey, HLG, HDR10+ ou Dolby Vision.

Não há aplicação canonical nesta entrega: Root integra API/UI e empacota outra versão.035000/Native23 permanecem preservados. Esses recibos não aprovam um Setup novo nem substituem QA instalada da integração.

Arquivos TS/fixture, credenciais/configs e logs crus ficam na TEMP própria e são excluídos da allowlist. PROVENANCE.json/recibos/hash-only permitem rastrear os resultados. Scripts têm caminhos próprios, pins exatos e nenhum comando Git/build/deploy.

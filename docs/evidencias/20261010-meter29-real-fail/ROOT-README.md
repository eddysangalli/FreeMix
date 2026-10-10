# Medidores Native29: FAIL real preservado

Três fontes de áudio locais e dois clientes reais receberam medidores; pausa/reprodução e fases anteriores avançaram. Ao trocar coleção e recriar os mesmos nomes com novos UUIDs, a validação registrou um valor inválido; o erro permaneceu mesmo após chegarem frames válidos dos novos UUIDs. O valor bruto inválido não foi capturado, portanto a causa ainda está em investigação. Não relaxar a exigência de números finitos nem declarar o lifecycle concluído.

Fechamento cooperativo confirmado, dois clientes mantidos até o shutdown, zero avisos de medidores, zero alocações restantes e zero crash. Os 2085 arquivos Native foram conferidos após fechamento. São sinais positivos limitados ao ensaio; o resultado global é FAIL. Recibo original, contrato e preparação copiados sem modificar os bytes.

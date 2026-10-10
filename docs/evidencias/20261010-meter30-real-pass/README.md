# Preparação real Meter30 — pinos Root pendentes

Derivada do runner/AL13 executado em Native29; preserva o FAIL29 e a validação byte-exata original. Nenhum Native/API/instalador ou dispositivo foi executado nesta preparação. O arquivo PREPARATION ainda não contém head/freeze30: o runner recusa o status pendente antes de qualquer instalação/spawn. Não há comando de execução autorizado.

O coletor guarda o primeiro evento rejeitado antes do assert: número do evento, tipo, timestamp monotônico, fase, UUID próprio, canal, posição e valor original numérico/null. NaN/Inf dos modelos têm tags explícitas; strings/objetos arbitrários não são exportados. Até3 inputs próprios,8 canais,3 posições e24 exemplos inválidos. Counts dos frames rejeitados ficam separados dos eventos aceitos. Erro permanece sticky e nunca é apagado por um frame válido posterior.

Os snapshots de ambos clientes vêm antes da assert final; mediaState e inputVolumeMul são obtidos uma única vez por requests readonly, com deadline12s. O timestamp desse readback é posterior e não afirma estado simultâneo ao frame inválido. Nenhum setter é repetido para observar; somente fixtures próprias de três tons/duas subscrições. O SDK GetVersion deverá confirmar GetInputVolume também.

`bind-native30.mjs` prepara NOVA pasta congelada somente depois de Root fornecer explicitamente --native-freeze, --native-freeze-sha, --native-head, --vendor-version e --out. Valida2085/exit0/instrumentaçãoOFF/versionSource30; copia o SDK atual como evidência readonly e confirma os guards fixados. Não inicia runtime e não preenche em silêncio a preparação pendente. Root precisa revisar os arquivos/pinos novos e autorizar os11 args reais antes da execução.

Futuro runtime: base600 imutável, toda árvore2085 Native30 em nova ownD TEMP, arquivos independentes/sem hardlinks, portas efêmeras próprias, readiness get_interface PID próprio +StudioMode+idle120s. Fechamento shutdown_idle próprio sem força, até20s, confirma identidade, logs originais/Meterwarnings/allocations/crash e2085 origem/destino apósclose. Contadores reais exigidos0; sem qualificação antecipada.

Original AL13 e FAIL29 ficam intactos. Erro inicial de contagem na geração desta preparação é preservado em PREPARATION-FIRST-FAIL.json +prepare-first-count-fail.mjs: foi somente preparação, sem Native/API nem runner escrito naquela tentativa. Nenhuma falha é reclassificada.

Limites: sem HTTP/CEF/IAB/Calls/FTB/distribuição/WAN/hardware/PCM/Master; não afirma callback-in-flight determinístico nem resolve automaticamente a causa do FAIL29. A cópia offline para criar a raiz futura é infraestrutura de isolamento, não reensaio do Setup.

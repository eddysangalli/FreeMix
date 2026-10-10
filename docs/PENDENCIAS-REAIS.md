# Pendências reais do FreeMix

O instalador selecionado permanece **0.1.0-local.20261010060000, Native24/a047860**. As fontes atuais são **Native30/93d73e2**, com compilação completa e2085 arquivos congelados verificados. O candidato093000/Native27 falhou na desinstalação por caminhos longos e não foi promovido. A correção foi integrada e o wrapper específico passou instalação/desinstalação real; falta o próximo pacote. Provas históricas abaixo não representam aprovação da instalação atual.

| Frente | Evidência atual | Próximo passo concreto e motivo da pendência | Esforço indicativo |
|---|---|---|---|
| Menus/Calls/SRT/MultiStream | Fluxos simplificados, nomes do talkback, handler duplicado corrigido;90 checks e capturas próprias desktop/celular/saídas. | Empacotar as fontes atuais; testar persistência com backend/Native e operação com convidados reais. Demais menus e editores precisam continuar a revisão visual; a nota1/10 do usuário não é aprovação de design. |1–2 sessões de integração/QA; revisão de uso depende da mesa. |
| Botões/lentidão | Corte/Preview/exclusão HTTP100/37/94ms; IAB Native27 Preview/Cut/tally/minimizar/restaurar PASS. | Medir conteúdo complexo/CEF/GPU e sessão longa. Prova em quatro cards não permite garantir latência de qualquer mesa. | Uma sessão por carga representativa; correções dependem do resultado. |
| Fechamento | Native30 realPASS: dois clientes, pausa/retomada, coleção/UUIDs e shutdown, valores0..0,25;0avisos/alocações/crashes. FAIL29 intacto. | Incorporar no pacote atual e reproduzir crashes antigos com seus executáveis/stacks; sessão longa e carga real não são provadas pelo ensaio finito. | Pacote/QA pertinente; reprodução depende do cenário antigo. |
| Calls vídeo/áudio/N-1 | RGBA/CEF local PASS. Intervenção sintética no player muted recebeu19 tons, mas sincronismoFAIL: drift9,78ms/s. | Corrigir/provar cadência e AV; integrar PCM/N-1/talkback, depois convidados/VDO/WAN reais. ContínuoOFF, helper só QA. | Várias sessões de implementação e QA; audição/endurance adicionais. |
| FTB/gate final | Gate5:8DSKs/linear/preto/restauração PASS; FAIL na barreira de cursor. PCM dos dois SRT passou offline sem apagarFAIL. | Gate6 com reset observado,30/29,97fps, reconexão e contextos; só executar após revisão. DefaultOFF. | Uma execução finita; corrigir falhas reais. |
| Replay | Timeline/IN-OUT/autoplay A/B históricos; correçãoR2 de cadência completa integrada,26 modelos e FFprobe CFR900/lateVFR885/VFR540 PASS. | Validar Native30 A/B, partida/seek/velocidade/áudio exclusivo; endurance SSD/GPU e UI instalada. | Ensaio finito de sete casos preparado; depois carga real. |
| Editores de entrada | Properties UUID correto/visible/activeWindow/focusWithintrue. | Ver pixels e ordem Properties/Filters no Windows. Qt não comprova z-order real; controle nativo UI não está disponível nesta sessão. | Inspeção manual curta + correção se falhar. |
| NDI HDR | SDR/alpha/runtime e contratos de outras saídas existentes. | Advanced SDK/licença, renderer/API e receptor HDR para validar mídia/metadados. SDK e equipamento não foram fornecidos. | Prazo depende de acesso/licença e dispositivo. |
| SDI/HDR, ASIO, OMT, PTZ/controladores | Contratos/implementação/provas de software delimitadas. | Driver/placa/câmera/controlador/receptor e audição física, além de correções do ensaio. | Depende do equipamento e agenda de teste. |
| GTZIP além do contrato finito | Títulos/ticker dentro do conjunto implementado. | Exemplos dos recursos/tempos ausentes e implementação por família. Não há suporte universal3D/imagens/feeds. | Depende dos exemplos; estimar por família. |
| WAN/bonding/Calls externos | Loopback/FEC/NACK/HTTPS local, limites documentados. | Duas conexões reais, VPS/domínio/TURN e receptor externo com perda controlada. Não inventar acesso/rota/hardware. | Depende dos recursos e testeWAN. |
| Assistente/presets/IA | Pedido novo autorizado; inventário/drafts em preparação. | Integrar assistente seguro de projetos e qualidade; NVIDIA/chroma/ruído/legendas/tradução somente com capability, SDK/modelo e backend reais. Indisponível deve ficar explícito/desabilitado. | Implementação por recurso; licença/modelo/hardware podem exigir acesso externo. |
| Atualizações controladas | Fork reproduzível e manifesto de pacote assinado existentes. | Auditar/bloquear atualizações binárias upstream e plugins no cliente; FreeMix recebe, testa e aprova as versões no próprio canal com rollback. | Auditoria e integração em andamento; distribuição pública depende do canal aprovado. |
| Distribuição | Setup600 aprovado. Wrapper corrigido passou instalação/desinstalação reais de9714 arquivos, caminhos266/276 e preservação de dados400. | Selar novo pacote com Native30/menus/correções atuais e checks pertinentes. Windows limpo, assinatura Authenticode e HTTPS exigem recursos externos. | Pacote/QA local; homologação externa depende dos recursos. |

Estimativas são ordem de esforço, sem promessa de100% pelo prazo. Primeiro corrigir/provar software implementável; separar software, mídia real, hardware e WAN. Alpha web foi abortado e não será retomado; ponte nativa permanece beta separada.

[Provas dos menus](evidencias/20261010-menus-operacao/README.md) · [histórico preservado](historico/20261010-antes-menus-cef27/PENDENCIAS-REAIS.md).

## Checkpoint de 10/10, 09:45 UTC

Fontes e provas dos menus publicadas no GitHub no commit 408db53. Metadados do candidato local093000 agora correspondem ao Native27; o instalador selecionado600 continua intacto até o novo candidato passar.

Gate3 executado uma vez: oito DSKs/eventos reais e baseline passaram; FAIL na comparação de ganho. O render atual mistura RGB codificado, enquanto o teste assumia luz linear. Ratios codificados0,554–0,556 cabem no bracket0,517–0,558; não há prova de ganho duplicado. Um contrato explícito linear-sRGB SDR8 com guardar/restaurar estado está sendo preparado antes de nova compilação/execução. Ainda não foram provados preto/OFF, decodificação SRT, NTSC ou áudio deste gate. Native e dois receptores fecharam com código0, sem crashes/Meter/alocações restantes; todos os pós-hashes passaram. [FAIL e análise preservados](evidencias/20261010-gate3-domain-fail/README.md).

AV sintético executado uma vez:600 quadros/400 blocos escritos sem drops/faults e583 vídeos decodificados. Houve1000 pacotes de áudio recebidos, mas nenhuma amostra/tom decodificado para correlacionar: resultado inconclusivo, sincronismo não qualificado. Recursos e HTTP fechados,19+2 pós-pins iguais. Wrapper PCM/N-1 segue isolado e desativado; modelos não substituem áudio Native real. [Prova inconclusiva](evidencias/20261010-calls-av-roi-inconclusive/README.md).

## Checkpoint de10/10,10:30UTC

O candidato093000 foi selado e instalado numa raiz própria.9714 arquivos assinados/2085 Native/113 fontes passaram; duas aberturas e fechamentos reais, cinco menus com backend instalado, persistência, migração opt-in e diagnósticoZIP passaram. A verificação da desinstalação falhou em caminhos longos .NET de266/276 caracteres; nenhum arquivo foi removido e a entrega600 permanece selecionada. Meter reapareceu3 vezes no segundo fechamento, sem crash/alocação restante. [Prova e FAIL preservados](evidencias/20261010-setup093000-fail/README.md).

Diagnóstico AV observou PCM não zero antes do Generator e no AudioData, mas o Worklet receptor processou7651 blocos com amostras zero. Gain0 não bloqueou o processor nesse ensaio; a causa do silêncio entre fonte e receptor ainda exige tap local/intervenção separada. Sincronismo continua inconclusivo e opt-in contínuoOFF. [Diagnóstico](evidencias/20261010-calls-av-consumer-diagnostic/README.md).

Native28a09423d integrou o contrato final linear-sRGB SDR8 e a proteção de epoch/captura PCM contra troca de lease durante cópia. Build e provas de mídia estão em andamento; esses commits não habilitam FTB geral nem qualificam AV. Agentes seguem em caminhos longos, lifecycleMeter e origem/timestamp de áudio.

## Checkpoint de10/10,10:50UTC

Native28a09423d compilou completamente;2085 arquivos/209 fontes/28 patches/3 submódulos conferidos. Helperbackend do gatev2 integrado com contrato linear-sRGB/SDR8 e defaultOFF; precisa ensaio real de pixels/GPU/SRT/NTSC/áudio. Meter r2 e desinstalador de caminhos longos seguem propostas isoladas em revisão; não declarar integrados.

Taplocal sintético executado: PCM não zero na trackGenerator(145920 amostras, peak0,35), mas receptorRTC recebe silêncio;7651 chamadas em ambos Worklets. HTTP/recursos e tab próprios fecharam; pós-pins9+2 passaram. AV permanece inconclusivo; adaptador de timestamp não executado. [Prova](evidencias/20261010-calls-av-local-tap/README.md).

## Correção do instalador integrada,10:50UTC

Root integrou apenasSetup.cs eUninstall.cs, review6. Regressões compiladas de.NET em caminhos266/276/400, hash/remover3/3, preservação de alterados/projeto/config/mídia, ZIPtraversal/reparse e picker opcional passaram. Prova é sintética; preparar novo wrapper/pacote e QA instalada específica antes selecionar. Nenhuma alteração global deWindows/registro de caminhos longos. [Fontes/provas e limites](evidencias/20261010-installer-long-paths-review6/README.md).

Gate4Native28 está em execução própria exclusiva; Meter r2 foi revisado/pinado porRoot, mas aguarda fim/cleanup doGate4 antes aplicação e compilaçãoNative29. Não editar SDKs durante execução; não repetir automaticamente se houverFAIL.

## Checkpoint de10/10,11:10UTC

Native29 integrou lifecycleMeter e compilou:2085 arquivos/214 snapshots/29 patches/3 submódulos conferidos. Avisos originais mantidos; prova Native real de inscrições/UUID/fechamento pendente. [Build](evidencias/20261010-native29-build/README.md).

Gate4Native28 encerrouFAIL: ganho linear,8DSKs/preto/restauraçãoPASS. Program/Source PCM idêntico; saltos de fase correspondem quantitativamente ao paddingAAC no loop, sem causalidade provada. Critérios não alterados; NTSC/reconnect/reset pendentes. Todos os processos próprios fecharam0; contador/Meter/crash0 e hashes passaram. [FAIL/provas](evidencias/20261010-gate4-audio-fail/README.md).

CallsUI integrado após23 verificações e revisão Root: limite reportado pelo motor, resumo de conferência e consulta somente leitura sem repetir comando. Capturas são fixtures sem backend; instalação/recepção real pendentes. [Guia](OPERAR-CALLS-E-SAIDAS.md). Wrapper do instalador corrigido está em compilação/QA própria, sem Native/API nem nova seleção. Replay: lacunaVFR fora das janelas de probe reproduzida em arquivo sintético com FFprobe; correção isolada em preparação. AVpage-origin ainda não executado; áudioRTC e sincronismo não qualificados.

## Checkpoint de10/10,11:15UTC

O wrapper de caminhos longos passou instalação/desinstalação reais:9714 arquivos, dois imutáveis266/276 removidos, alterado/config/projeto/mídia400 preservados, HKCU próprio ausente, filhos encerrados. Sem repetir Native/API/migração/diagnóstico.093000 original conservaFAIL e600 selecionado; próximo pacote precisa incorporar fontes atuais. [Prova](evidencias/20261010-installer-long-paths-real/ROOT-README.md).

Intervenção única de origem comum de timestamp A/V NÃO resolveu silêncioRTC: local145920 nonzero/peak0,35; receptorPCM0,1000 pacotes/0samples; vídeo598frames. Critérios intactos, AVinconclusivo, helper não integrado. HTTP/aba/recursos7 e pós-pins26+2 passaram. [Prova](evidencias/20261010-calls-av-page-origin/ROOT-README.md).

## Checkpoint de10/10,11:25UTC

Native29 foi executado com dois clientes de medidores e três fontes locais. O ensaio terminou FAIL na validação de evento durante troca de coleção/recriação de UUIDs; os valores inválidos não foram capturados, portanto ainda investigamos produto versus observação. Frames válidos posteriores não apagam a falha. Fechamento cooperativo, avisos0/alocações0/crash0 e2085 pós-pins PASS. [FAIL real preservado](evidencias/20261010-meter29-real-fail/ROOT-README.md).

O novo ensaio Gate5 foi revisado e iniciou numa raiz e portas próprias: fixture240s sem loop, critérios de áudio originais,30/1 e30000/1001, Source independente e oitoDSKs. Ainda em execução; nenhuma aprovação geral de FTB ou nova entrega. O instalador corrigido e o diagnóstico AV foram publicados no GitHub em3c82037; entrega600 permanece selecionada.

## Checkpoint de10/10,11:40UTC

Replay e saídas integrados em fontes, sem reiniciar o operador:3 fontes ReplayR2,26 modelos e FFprobe real em CFR900/lateVFR885/VFR540;6 fontes Saídas,21 casos de GET/timeout/ACK/rascunhos. [Replay](evidencias/20261010-replay-full-cadence-r2/ROOT-README.md) · [Saídas](evidencias/20261010-outputs-read-ack/ROOT-README.md). Falha de readiness do primeiro modelo Root preservada; barreira limitada de2s corrigiu apenas o teste. NativeA/B, UI instalada e benchmark ainda pendentes.

Gate5 terminouFAIL na confirmação de cursor após restart; análise offline dos dois SRT passou no contrato de áudio original, sem apagarFAIL. Native+receptores fecharam0, avisos/alocações/crash0,2085+9582pinsPASS. [Prova](evidencias/20261010-gate5-cursor-fail/ROOT-README.md). Defeitos concretos do Meter (histórico/mute sem inicialização, leitura fora do mutex, divisão por frames0) estão em revisão isolada antes Native30; sem atribuir causa única doFAIL29. AVCalls ainda sem áudio remoto decodificado. Instalador600 permanece selecionado, próximo pacote pendente.

## Checkpoint de10/10,11:55UTC

MeterR2 integrado no SDK Native30/93d73e2: campos inicializados, histórico limpo, frames0 protegidos e leitura de mute sob mutex.21 verificações normais+21ASan passaram no draft; compilação Native completa está em andamento. Não atribuímos causa única ao FAIL29 nem qualificamos o fechamento antes do novo teste real com captura do primeiro valor inválido.

Calls: anexar a mesma track remota ao player silenciado fez aparecer19 tons/197368 amostras não zero. O sincronismo ainda terminouFAIL: drift9,77886ms/s e desvio máximo82,908ms. Critérios intactos; helper somente QA e contínuoOFF. [Prova](evidencias/20261010-calls-av-muted-consumer/ROOT-README.md).600 continua selecionado; Replay, Saídas e Meter atuais aguardam regressão Native/HTTP isolada antes novo pacote.

## Checkpoint de10/10,11:56UTC

Native30/93d73e2 compilado e congelado:2085 arquivos, 214 snapshots,30 patches/3 submódulos; reconstrução local--checkPASS. [Build e correção dos medidores](evidencias/20261010-native30-build/ROOT-README.md). Novos testes reais de Meter, Replay e saídas estão preparados em raízes/portas próprias; não executamos o operador. Instalador600 segue selecionado; pacote novo depende desses checks.

## Checkpoint de10/10,12:05UTC

Meter30 realPASS: duas conexões,39/39eventos em2s, pausa/retomada/unsubscribe/resubscribe/coleção/novosUUIDs; nenhum rawinvalid/rejeitado, níveis0..0,25. Fechamento com duas inscrições, avisos0/alocações0/crash0, full2085postsPASS. [Prova e limites](evidencias/20261010-meter30-real-pass/ROOT-README.md). FAIL29 intacto; crashes antigos exigem reprodução própria. Gate6Native30 com reset observado está em execução exclusiva; Replay30 aguarda revisão do harness cooperativo semforce e ABI da capturaMaster.

## Escopo adicional autorizado em10/10

Após as correções prioritárias, usar agentes disponíveis para assistente de projetos horizontal/vertical com quatro câmeras e áudio, presets de imagem/ruído/nitidez/cor e recursos de IA. Disponibilidade deve ser detectada por hardware/SDK/modelo/API; controles indisponíveis ficam desabilitados com motivo concreto. Nenhum dispositivo deve abrir nem projeto do operador mudar ao apenas navegar. Legendas/tradução exigem motor e modelo reais; não apresentar modelos ausentes ou credenciais não fornecidas como recurso funcionando.

Governança de atualizações: cliente recebe releases aprovadas do FreeMix. Mudanças do OBS, dependências e plugins devem ser incorporadas ao fork, testadas e distribuídas por nosso canal; revisar bloqueio de auto-update/auto(re)install upstream e assinatura/rollback. Drafts offside de capacidades/presets/updates estão com os agentes; ainda não integrados. As falhas reais de Calls/FTB e os checks de Replay/menus/pacote mantêm prioridade.

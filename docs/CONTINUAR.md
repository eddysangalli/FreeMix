# Continuidade do FreeMix

O instalador selecionado permanece **0.1.0-local.20261010060000, Native24/a047860**. As fontes atuais são **Native29/7599299**, com compilação completa e2085 arquivos congelados verificados. O candidato093000/Native27 falhou na desinstalação por caminhos longos e não foi promovido. A correção foi integrada; wrapper específico em QA. Provas históricas abaixo não representam aprovação da instalação atual.

Leia [situação](ATUALIZACAO-20261010.md), [pendências](PENDENCIAS-REAIS.md), [entrega selecionada](ENTREGA-ATUAL.md) e [plano](PLANO-CONCLUSAO-20261013.md).

Native27 c4b5af00ea4a4b744a3a19fef5ec861f693c9a69/build2085/export27patches PASS; frozen qa-finalizacao/native-build-frozen-c4b5af0-configured.json SHA d7d7e623597b2eadef12a57b5f702bb3e20711f4e86e4b18c9a300cf947ac616. Último push anterior confirmado c418318f85768f13b5aff381d45e9c638845c68c. Não sincronizar Native com o pacote600 antigo.

Native27 duas fontes601/B754 RGBA exato PASS. CEF ROI597 enviados/595 decodificados/569callbacks/três cores PASS; antigaROI fora do quadro119confirmada em nova execução, FAIL anterior preservado. IAB Root real PreviewB→CutB/tally/min/restA PASS, fechamentos0/crash0/full2085+110; Meter3 explícito. Cinco fontesUI posteriores integradas: Callshtml/js, controle.js, saidas-operacao-ui.js, saidas-srt-hdr-access-ui.js.90checks+capturas próprias PASS; não aplicadas ao600/operador.

Root integra/commita/publique somente fontes autorizadas. Installer prepara candidato0.1.0-local.20261010093000 com FULLCOMMIT Root depois do push, sem sobrescrever600; nenhuma execução até revisão. Transportes prepara Gate26draft3 launcher/plano: seed8antesstart/eventchannel7+i. Gate26draft2FAILsetupnoveDSKs não é falhaGPU. Auditor preparaAVROI e draftPCMclock isolados, defaultOFF, sem áudio/Native/CEF até revisão. Sem abertura de novos chats; máximo Root+3agentes.

Preservar Corebe468/API503338/Callsbackend1e4/gate9342/mesa29d em cada ensaio. Core/gate/continuous experimental OFF; não promover FTB geral, vídeo30fps universal ou N-1/AV sem prova. NativeQA exclusivamente uma raiz por vez. TEMP/TMP próprios noD, full2085/pins/idle/UUID/vendorPID e cleanup cooperativo; nunca force/operador. InterfaceQt não prova ordem Windows.

Preservar mesa/processos/REC/Call/mídia/configuração do operador e artefatos aprovados. Não repetir instalações600. Não publicar/upload externo; commit/push GitHub e pacote local autorizados. Alphawebaborto e betaNative separada. Não marcar objetivo completo pelo prazo. Remover automação somente ao concluir de verdade. [Histórico](historico/20261010-antes-menus-cef27/CONTINUAR.md).

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

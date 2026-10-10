# Plano de conclusão até 13/10/2026

O instalador selecionado permanece **0.1.0-local.20261010060000, Native24/a047860**. As fontes atuais são **Native28/a09423d**, com compilação completa e2085 arquivos congelados verificados. O candidato093000/Native27 falhou na desinstalação por caminhos longos e não foi promovido. Correções e provas posteriores abaixo ainda exigem novo pacote aprovado.

1. Encerrados sem repetir: Native27 build/export2085/27patches, duasCallsRGBA exato, CEF ROI real e IAB Preview/Cut/min/rest/tally, todos dentro dos limites. Meter3segueinvestigação; crash0 não prova todos os cenários.
2. Root publicou fontesUI simplificadas após90checks/capturas e corrigiu handlerduplicado. Installer prepara novo candidato093000 com commit exato e fullmanifest/runtimeclosure; selar/selecionar somente após checks relevantes e startup próprio.600 permanece imutável.
3. Gate26draft3 executado uma vez e FAIL preservado; corrigir contrato de domínio antes de outro ensaio com:8DSKsreais/gainúnico/ProgrammeSRT/Sourceexcluído/PTS30&NTSC/áudiointacto/resetepoch. FTB geral e qualificationstartup continuam OFF.
4. AV20s ROI normalizada executado e inconclusivo; diagnosticar decodificação de áudio antes de outro ensaio. Implementar wrapperPCM com rate/cursor/PTS/gen e filas finitas em draftisolado; preservarN-1/talkback/privacidade. AVsintético não homologaPCM/VDO.
5. Continuar revisão dos menus/editores/replay com uso real e conteúdo complexo. Separar inspeçãovisualWindows, hardwareHDR/SDI/ASIO/OMT/PTZ, longa duração e WAN com duas redes/VPS/TURN.
6. GitHubfonte/pacotelocalautorizados; provas sanitizadas semcredenciais/rawlogs/mídia dooperador. MáximoRoot+3agentes, nenhumaNativeQAparalela.
7. Na terça conferir entrega e pendências concretas, recurso necessário e próximo teste. Prazo não significa100% nem conclusãoautomática. [Histórico](historico/20261010-antes-menus-cef27/PLANO-CONCLUSAO-20261013.md).

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

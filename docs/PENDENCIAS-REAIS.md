# Pendências reais do FreeMix

O instalador selecionado permanece **0.1.0-local.20261010060000, Native24/a047860**. As fontes atuais são **Native28/a09423d**, com compilação completa e2085 arquivos congelados verificados. O candidato093000/Native27 falhou na desinstalação por caminhos longos e não foi promovido. Correções e provas posteriores abaixo ainda exigem novo pacote aprovado.

| Frente | Evidência atual | Próximo passo concreto e motivo da pendência | Esforço indicativo |
|---|---|---|---|
| Menus/Calls/SRT/MultiStream | Fluxos simplificados, nomes do talkback, handler duplicado corrigido;90 checks e capturas próprias desktop/celular/saídas. | Empacotar as fontes atuais; testar persistência com backend/Native e operação com convidados reais. Demais menus e editores precisam continuar a revisão visual; a nota1/10 do usuário não é aprovação de design. |1–2 sessões de integração/QA; revisão de uso depende da mesa. |
| Botões/lentidão | Corte/Preview/exclusão HTTP100/37/94ms; IAB Native27 Preview/Cut/tally/minimizar/restaurar PASS. | Medir conteúdo complexo/CEF/GPU e sessão longa. Prova em quatro cards não permite garantir latência de qualquer mesa. | Uma sessão por carga representativa; correções dependem do resultado. |
| Fechamento | Ensaios novos contador0/crash0, sem objetos restantes/double destroy. IAB teve3 avisos Meter após limpar cenas. | Identificar lifecycle Meter por fonte/UUID; reproduzir crashes antigos pelo stack/executável correspondente. Zero crash desses ensaios não encerra todo cenário antigo. | Diagnóstico inicial1 sessão; sem estimativa responsável antes de reproduzir. |
| Calls vídeo/áudio/N-1 | Native27 RGBA/CEF local PASS; Native28 proteçãoepochPCM compilada. Diagnóstico real tem PCM noGenerator/taplocal, porém silêncio no receptorRTC. | Corrigir geração/transporte temporal e provar AV recebido; integrar/provar clock PCM real e N-1/talkback, depois convidados/VDO. JPEG do600 não é30fps; contínuoOFF. | Várias sessões de implementação e QA; audição/endurance reais adicionais. |
| FTB/gate final | Gate3 com8DSKs executadoFAIL na comparação do domínio de ganho; Native28 linear-sRGB/SDR8 e helperv2 compilados/integrados. | Gate4 real com8DSKs, Programme SRT, Source, ganho, preto/OFF, PTS30/29,97 e áudio intacto; defaultOFF até passar. | Uma execução finita após revisão; defeitos encontrados ampliam prazo. |
| Replay | Timeline IN/OUT/histórico/autoplayA/B e provas de sincronismo registradas nas revisões anteriores. | Conferência visual do arquivo, partida/seek/VFR, áudio exclusivo e enduranceSSD/GPU na instalação final. | Uma sessão representativa; hardware/arquivo real necessários. |
| Editores de entrada | Properties UUID correto/visible/activeWindow/focusWithintrue. | Ver pixels e ordem Properties/Filters no Windows. Qt não comprova z-order real; controle nativo UI não está disponível nesta sessão. | Inspeção manual curta + correção se falhar. |
| NDI HDR | SDR/alpha/runtime e contratos de outras saídas existentes. | Advanced SDK/licença, renderer/API e receptor HDR para validar mídia/metadados. SDK e equipamento não foram fornecidos. | Prazo depende de acesso/licença e dispositivo. |
| SDI/HDR, ASIO, OMT, PTZ/controladores | Contratos/implementação/provas de software delimitadas. | Driver/placa/câmera/controlador/receptor e audição física, além de correções do ensaio. | Depende do equipamento e agenda de teste. |
| GTZIP além do contrato finito | Títulos/ticker dentro do conjunto implementado. | Exemplos dos recursos/tempos ausentes e implementação por família. Não há suporte universal3D/imagens/feeds. | Depende dos exemplos; estimar por família. |
| WAN/bonding/Calls externos | Loopback/FEC/NACK/HTTPS local, limites documentados. | Duas conexões reais, VPS/domínio/TURN e receptor externo com perda controlada. Não inventar acesso/rota/hardware. | Depende dos recursos e testeWAN. |
| Distribuição | Setup600 aprovado e diagnósticoZIP manual;093000 instalou/abriu duas vezes/migrou, mas desinstalaçãoFAIL porMAX_PATH. | Correção de caminhos longos integrada após review6; novo wrapper/pacote e desinstalação real específica. Windows limpo/Authenticode/HTTPS dependem de recursos. | Pacote/QA local nesta frente; assinatura/homologação dependem dos recursos. |

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

# Pendências reais do FreeMix

O instalador selecionado permanece **0.1.0-local.20261010060000, Native24/a047860**. Native27 e as correções abaixo estão nas fontes; ainda não estão nesse instalador. Um novo candidato local está sendo preparado, sem substituir a entrega aprovada.

| Frente | Evidência atual | Próximo passo concreto e motivo da pendência | Esforço indicativo |
|---|---|---|---|
| Menus/Calls/SRT/MultiStream | Fluxos simplificados, nomes do talkback, handler duplicado corrigido;90 checks e capturas próprias desktop/celular/saídas. | Empacotar as fontes atuais; testar persistência com backend/Native e operação com convidados reais. Demais menus e editores precisam continuar a revisão visual; a nota1/10 do usuário não é aprovação de design. |1–2 sessões de integração/QA; revisão de uso depende da mesa. |
| Botões/lentidão | Corte/Preview/exclusão HTTP100/37/94ms; IAB Native27 Preview/Cut/tally/minimizar/restaurar PASS. | Medir conteúdo complexo/CEF/GPU e sessão longa. Prova em quatro cards não permite garantir latência de qualquer mesa. | Uma sessão por carga representativa; correções dependem do resultado. |
| Fechamento | Ensaios novos contador0/crash0, sem objetos restantes/double destroy. IAB teve3 avisos Meter após limpar cenas. | Identificar lifecycle Meter por fonte/UUID; reproduzir crashes antigos pelo stack/executável correspondente. Zero crash desses ensaios não encerra todo cenário antigo. | Diagnóstico inicial1 sessão; sem estimativa responsável antes de reproduzir. |
| Calls vídeo/áudio/N-1 | Native27 duas fontes RGBA exato e CEF cores corretas em20s; Programa visível atual/rollback17 casos. | Testar AV sintético preparado, implementar/provar clock PCM real e privacidade N-1/talkback, depois convidados/VDO/conteúdo complexo. JPEG do600 não é30fps; opt-in contínuo continua OFF. | Várias sessões de implementação e QA; audição/endurance reais adicionais. |
| FTB/gate final | Main25 passou; Native26 build/backend/contratos; FAILsetupDSK preservado e fixture8 corrigida preparada. | Gate real com8DSKs, Programme SRT, regressãoSource, gain único, PTS30/29,97 e áudio intacto; manter defaultOFF até passar. | Uma execução finita após revisão; defeitos encontrados ampliam prazo. |
| Replay | Timeline IN/OUT/histórico/autoplayA/B e provas de sincronismo registradas nas revisões anteriores. | Conferência visual do arquivo, partida/seek/VFR, áudio exclusivo e enduranceSSD/GPU na instalação final. | Uma sessão representativa; hardware/arquivo real necessários. |
| Editores de entrada | Properties UUID correto/visible/activeWindow/focusWithintrue. | Ver pixels e ordem Properties/Filters no Windows. Qt não comprova z-order real; controle nativo UI não está disponível nesta sessão. | Inspeção manual curta + correção se falhar. |
| NDI HDR | SDR/alpha/runtime e contratos de outras saídas existentes. | Advanced SDK/licença, renderer/API e receptor HDR para validar mídia/metadados. SDK e equipamento não foram fornecidos. | Prazo depende de acesso/licença e dispositivo. |
| SDI/HDR, ASIO, OMT, PTZ/controladores | Contratos/implementação/provas de software delimitadas. | Driver/placa/câmera/controlador/receptor e audição física, além de correções do ensaio. | Depende do equipamento e agenda de teste. |
| GTZIP além do contrato finito | Títulos/ticker dentro do conjunto implementado. | Exemplos dos recursos/tempos ausentes e implementação por família. Não há suporte universal3D/imagens/feeds. | Depende dos exemplos; estimar por família. |
| WAN/bonding/Calls externos | Loopback/FEC/NACK/HTTPS local, limites documentados. | Duas conexões reais, VPS/domínio/TURN e receptor externo com perda controlada. Não inventar acesso/rota/hardware. | Depende dos recursos e testeWAN. |
| Distribuição | Setup600 aprovado, diagnósticoZIP manual por botão/BAT, Ed25519 interno. | Novo candidato com correções e startup próprio; Windows limpo/homologação, certificado Authenticode se desejado, DNS/VPS paraHTTPS. Publicação externa não autorizada. | Pacote/QA local nesta frente; assinatura/homologação dependem dos recursos. |

Estimativas são ordem de esforço, sem promessa de100% pelo prazo. Primeiro corrigir/provar software implementável; separar software, mídia real, hardware e WAN. Alpha web foi abortado e não será retomado; ponte nativa permanece beta separada.

[Provas dos menus](evidencias/20261010-menus-operacao/README.md) · [histórico preservado](historico/20261010-antes-menus-cef27/PENDENCIAS-REAIS.md).

## Checkpoint de 10/10, 09:45 UTC

Fontes e provas dos menus publicadas no GitHub no commit 408db53. Metadados do candidato local093000 agora correspondem ao Native27; o instalador selecionado600 continua intacto até o novo candidato passar.

Gate3 executado uma vez: oito DSKs/eventos reais e baseline passaram; FAIL na comparação de ganho. O render atual mistura RGB codificado, enquanto o teste assumia luz linear. Ratios codificados0,554–0,556 cabem no bracket0,517–0,558; não há prova de ganho duplicado. Um contrato explícito linear-sRGB SDR8 com guardar/restaurar estado está sendo preparado antes de nova compilação/execução. Ainda não foram provados preto/OFF, decodificação SRT, NTSC ou áudio deste gate. Native e dois receptores fecharam com código0, sem crashes/Meter/alocações restantes; todos os pós-hashes passaram. [FAIL e análise preservados](evidencias/20261010-gate3-domain-fail/README.md).

AV sintético executado uma vez:600 quadros/400 blocos escritos sem drops/faults e583 vídeos decodificados. Houve1000 pacotes de áudio recebidos, mas nenhuma amostra/tom decodificado para correlacionar: resultado inconclusivo, sincronismo não qualificado. Recursos e HTTP fechados,19+2 pós-pins iguais. Wrapper PCM/N-1 segue isolado e desativado; modelos não substituem áudio Native real. [Prova inconclusiva](evidencias/20261010-calls-av-roi-inconclusive/README.md).

<!-- managed-source-package-20261012-0110 -->
## Fontes dos componentes gerenciados — complemento de empacotamento

O ZIP oficial DistroAV6.2.1 usado na compilação agora está em `licenses/freemix-distroav-managed/DistroAV-6.2.1-official-source.zip`, SHA6da38f422c6dc826165a7462b4496f967ed7f948bd6a97ba3e0e3143193625e4; catálogo e proveniência declaram o caminho local. A proveniência SceneSwitcher declara o ZIP oficial já presente na base600 assinada, SHA c3cb9d64d9bb9a15b0880a8b6e734ee20368f533fb5fb2aeb40b60aa77b66b2b. O novo montador deverá conferir ambos os ZIPs efetivamente copiados, além dos patches/licenças. Nenhum DLL, fonte C++ ou byte do Native39 mudou nesta complementação; build/QA anterior permanece com os mesmos pins. Pacote completo ainda não montado/selado, mesa intacta.

---
<!-- replay-preparado-root-20261012-0100 -->
## Replay — implementação experimental e provas reais de mídia, 11/10 às22h de Brasília

O dono autorizou Codex e seus agentes a implementar o replay enquanto os CLIs externos retomam. Código experimental preservado em `experimentos/replay-preparado-20261012`, fora dos caminhos de produto. Base canônica c40579b/Native39; nenhuma alteração da mesa/API do operador.

Root executou playlists CPU24/24 e worker real14/14. Em mídia sintética própria, lista CUT seguida de FADE400ms passou cinco verificações:168 quadros/5,6s, cores na ordem, mistura real dos tons PCM estéreo, originais intactos e12 processos ausentes por CIM. Curvas rápido→lento→rápido e rápido→lento passaram quatro verificações reais:72/56 quadros, mapeamento temporal/endpoints conferidos nos pixels decodificados, PCM silenciado, confirmação explícita de silêncio, cancelamento antes da preparação, originais intactos e13 processos ausentes. Provas: `docs/evidencias/20261012-replay-preparado-root`.

Limites: preparação cria um arquivo derivado H264/CRF18 antes de ir ao ar; não é codec sem perdas nem efeito aplicado ao decoder ao vivo. Curva ainda exige confirmação explícita de áudio silenciado; áudio variável não foi qualificado. Preparação consome tempo/disco. Esta bancada não prova Native/CEF, dispositivos, GPU, WAN, quatro câmeras ou longa duração.

Pendentes: integração do worker com todos os caminhos transitivos do replay, agulha/visualização/INOUT e editores de lista/curva na interface, QA da janela nativa/latência/retomada, seleção de codec por medições e novo pacote completo. Fontes experimentais ainda NÃO estão instaladas ou incluídas como recursos ativos do pacote do operador. Falhas anteriores de fixture, inspeção RGB e enum de erro permanecem preservadas nos diretórios próprios; nenhum critério foi relaxado.

Claude CLI voltou e trabalha em revisão de empacotamento/codec. A tentativa completa Gemini de12/10~01hUTC continuou HTTP429/RESOURCE_EXHAUSTED; nenhuma resposta de análise, saldo desconhecido. Seguir checks espaçados, sem afirmar que AGY está trabalhando. Prazo vigente:12/10 às19hBRT; o prazo não transforma pendências em concluídas.

---
<!-- managed-components-root-20261011 -->
## Atual — componentes internos e bloqueios de atualização qualificados

Ordem direta do dono: compilar/integrar os componentes e bloquear updates independentes do OBS/plugins; autorizou o Root a implementar esta frente sem depender de outros agentes. Native39 `7b77e328ec4741ab734e43f3275d37d9d1dfd22e` passou ALL_BUILD, exportação de 39 patches/três submódulos/snapshots e reconstrução --check. Freeze `qa-finalizacao/native-build-frozen-7b77e32-configured.json`, SHA `3952f3d5935f7cabdca57a30db3944522b7b87f59960e85d21b9892a2bedec4c`, 2085 arquivos. OBS updater manual/periódico bloqueado no fork; catálogo RTMP agora força updates OFF mesmo contra flag/cache ON.

SceneSwitcher recompilado com identidade estável FreeMix e backup de migração automático, atômico e imutável antes de LoadSettings. DistroAV recompilado sem auto/manual checker nem controles/handlers de instalação própria; NDI carrega somente o runtime aprovado app-local, ignora variável externa e recusa conteúdo alterado/links. Verificar Complementos agora faz somente diagnóstico local, sem consultas upstream. Bibliotecas internas continuam DLLs controladas da entrega; não afirmar que todos os terceiros foram reescritos ou estaticamente incorporados ao EXE.

QA final real Native39: duas aberturas/dois fechamentos cooperativos, Start/Stop da automação, fonte NDI registrada mesmo com ambiente inválido, backup exato sem regravar no reinício, zero leaks nos dois logs e 2085 post-pins. C++/Qt: backup14/14 e NDI8/8; diagnóstico Node7/7 zero fetch. Receita offline e reconstrução dos nove fontes modificados passaram. Prova sanitizada: docs/evidencias/20261011-componentes-gerenciados-root. Falha inicial da fixture fora de modules preservada e fechada cooperativamente; R2/R3 PASS não apagam o FAIL original.

Fontes/licenças/patches/receita integrados no FreeMix; componentes.json registra os novos hashes destinados à próxima entrega. Inputs aprovados locais: D:/FreeMix-QA-PluginGovernance-20261011-2305/delivery-inputs/APPROVED-INPUTS.json. Ainda NÃO há novo instalador completo selado nem atualização armada com estes bytes; mesa145116 intacta. Próximo: empacotar Native39+três DLLs qualificadas+fontes finais, conferir assinatura/hashes/startup e entregar sem instalar plugins avulsos no cliente. Não homologar hardware/WAN/SDKs fechados por estes testes; demais pendências de replay/áudio/calls/codec permanecem.

---
<!-- sceneswitcher-notice-20261011 -->
## 11/10 — aviso do Advanced Scene Switcher: conferência local

O dono identificou o aviso no FreeMix como Advanced Scene Switcher. A tradução instalada contém: “Detectada uma nova versão do Advanced Scene Switcher. Deve ser criado um backup das configurações antigas?” (`AdvSceneSwitcher.askBackup`). A fonte preservada chama `AskForBackup` quando `VersionChanged` compara a versão salva com `g_GIT_SHA1`; esse caminho solicita backup após uma mudança local, sem consultar um servidor de atualizações. O texto exato visto pelo dono ainda não foi confirmado, portanto a identificação deste diálogo como o aviso observado permanece condicionada ao texto.

Os hashes das duas DLLs instaladas coincidem com as DLLs recompiladas e testadas da correção de shutdown: módulo `699b1f15067fd27dd0aca42a5108b4b1be6d1e863085aabec71cbdfaab294cc0`, biblioteca `5b0e93759d1d544d39371ce7bbe3f7e962a39fead1fe1f6b0cb2d3774d91b24f`. O componente foi adaptado/recompilado, mas continua modular; seus subplugins/dependências oficiais foram preservados. Não afirmar que todos os plugins já foram incorporados ao executável ou que seus diálogos foram governados.

Pendência: integrar identidade de versão estável e aviso de migração/backup ao fluxo FreeMix, preservando configurações e proteção de backup, com revisão de fonte, recompilação e QA próprio antes de distribuir. Nenhuma DLL, macro, configuração ou processo do operador foi alterado nesta conferência. Bloquear o updater do OBS não substitui o tratamento dos diálogos de cada componente.

Observação somente leitura: `obs-vmix/version.json` agora declara `0.1.0-local.20261011145116`; o estado anterior “incremental ainda não aplicado” ficou histórico. Root não aplicou a atualização. Esta leitura não qualifica todos os recursos da mesa ou substitui os testes pendentes.

---
<!-- prazo-humano-20261012-1900 -->
## Prazo vigente — segunda-feira, 12/10/2026, às 19h de Brasília

Pedido direto do dono em 11/10: entregar o sistema pronto amanhã às 19h (22h UTC), substituindo o prazo anterior de 13/10. Coordenar Claude CLI e Antigravity continuamente enquanto disponíveis, acompanhar cada tarefa até uma entrega revisável e verificar cota quando houver parada. Com um provedor indisponível, seguir pelo outro; com ambos limitados, aguardar e verificar disponibilidade espaçadamente. Não inventar saldo nem tratar timeout ou resposta vazia como falta de créditos.

A automação existente passa a acompanhar a cada 20 minutos; tentativas de provedor com limite prolongado permanecem espaçadas. Preservar a mesa do operador. Entregar código, documentação e pacote local qualificado; registrar separadamente o que ainda não passou em testes ou depende de equipamento/rede/licença. O prazo não transforma recurso pendente em concluído. A meta antiga do aplicativo está em `usageLimited`; a ferramenta disponível não permite editar seu objetivo/prazo. Este bloco e a automação registram o novo prazo sem encerrar falsamente a meta antiga.

Pedidos do replay preservados: agulha com visualização durante a busca e IN/OUT preciso, listas sequenciadas com transições e curva de velocidade. Comparar codecs para qualidade, gravação, leitura e busca rápidas com testes próprios; distinguir compressão sem perda de qualidade visualmente próxima. Recursos novos e pacote completo atual continuam pendentes de integração/qualificação.

---
# Changelog do FreeMix

Registro cronológico resumido, só com marcos confirmados. Para estado vigente: CONTINUAR.md e PENDENCIAS-REAIS.md. Arquivo novo; não existia changelog consolidado antes de 11/10/2026. Datas abaixo estão em UTC (horário de São Paulo = UTC-3).

## 10/10/2026
- Instalador completo selecionado: `0.1.0-local.20261010060000`, Native24/a047860 (imutável), validado em instalação própria do Root.
- Prazo de conclusão definido para 13/10 (plano em PLANO-CONCLUSAO-20261013.md).

## 11/10/2026
- **App36 R4e — PASS:** 60.077ms de permanência em cinco telas, contadores run0/execute1/journal2/mutatingReq19 iguais ao início, Preview 90ms, Cut 165ms, dedupe/tags corretos, autosave só após mudança real, checkpoint manual HTTP 200, fechamento limpo (cleanup 0). Corrige o FAIL anterior de autosave do App36 R3 (preservado como histórico). Prova: [App36 R4e](evidencias/20261011-app36-r4e-real-pass/ROOT-README.md), `receipt-r4e.json`. Escopo: Native36 + painel `e801` — ainda não o Native38 atual. Ensaio ocorreu em 10/10/2026, 23:15–23:21 horário de São Paulo (11/10 em UTC).
- Native37 corrige o inventário de áudio tolerante a uma entrada defeituosa (ASIO/dispositivo sem nome). Native38 (`ed08547`) permite cada janela abrir no tamanho pedido pela página.
- Sete janelas novas (Streaming, Calls, Externo, Gravar, MultiGravação, Configurações do Replay, Configurações) tiveram roteiros relatando 122/122 — a maior parte dessa automação roda num navegador Edge separado, não na janela CEF embutida; só o caminho real de abrir a engrenagem e fechar pela janela nativa foi provado em separado (fechamento em 2s, 0 vazamentos).
- Corrigido nessa rodada: botão Fechar não fechava a janela de dentro do programa (agora usa o pedido nativo `close_panel`); Gravar e MultiGravação reescritos no molde visual do vMix; perda de texto não salvo no Externo; câmera obsoleta oferecida nas Configurações do Replay.
- Janela “Configurações” (engrenagem geral) implementada a partir das 98 preferências reais do motor; 18/18 testes com o programa real. Pendente: importar arquivo real, baixar Exportar na janela, botão nativo “todas as preferências do programa”.
- Atualização incremental da mesa **armada**: `0.1.0-local.20261011145116` (Native38 `ed08547` + painel `71f8aa7`) sobre a mesa em `0.1.0-local.20261009153453`. Ensaiada antes de armar numa cópia de fábrica — não testada com a configuração real do operador. Não aplicada até o momento.
- Prioridade definida pelo dono: estabilidade de transmissão (saídas simultâneas, reconexão, latência sob carga) é P0 atual, separada do endurance específico do Replay; ainda não há pacote completo novo selado com as fontes finais do Native38.
- Conferido: HEAD do FreeMix (`c4f374268adae2e73a71189400cd1bd26997d59b`) limpo e idêntico ao branch remoto no GitHub (https://github.com/eddysangalli/FreeMix) nesta checagem — código integrado publicado; propostas/bancadas offside permanecem locais. Assinatura + 394 hashes de arquivo e 18 fontes de UI/API/Mesa batem com o pacote armado.
- O dono aprovou a linha visual geral das telas (cópias do vMix); a prévia de Calls com API própria MOCK (chamadas sintéticas) não é prova de motor Native, microfone ou rede WAN.
- Preparado, não executado: especificação de QA externo de fontes/preferências nativas do Calls; 3 testes de Configurações Gerais pendentes. Revisões de fonte sobre stream/concorrência/reconexão aguardam confirmação em runtime.
- AGY: última chamada recebeu HTTP 429 (RESOURCE_EXHAUSTED, resposta 0 bytes); nova tentativa espaçada também 429. Claude retomou e respondeu integralmente depois — cotas interromperam parte das tarefas, mas Claude não está mais bloqueado; o AGY, na última tentativa, continua bloqueado.
- Criado este arquivo (`CHANGELOG.md`).

Detalhes e limites: PENDENCIAS-REAIS.md. Próximos passos: CONTINUAR.md.

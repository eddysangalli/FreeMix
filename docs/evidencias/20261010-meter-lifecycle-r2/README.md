# Draft isolado: lifecycle dos medidores obs-websocket

Revisão r2: o freeze v1 `545c835d385903ef797f11a56f38f516dcfaa9f25b5b70e20514a8082250ab3a` está preservado. Root encontrou que OnEvent também lê/usa o servidor, liberado antes do barrier v1. A revisão mínima move a mesma chamada Stop+Wait para o início do unload, antes até de StopServer. Não altera os quatro outros drafts Native. Não aplicado ao produto. Sem compilação C++, Native, navegador, instalação ou alteração do operador. Os cinco arquivos canônicos foram conferidos por SHA antes e depois da preparação. Node executa 64 contratos/modelos; cinco patches passam `git apply --check` apenas contra a cópia própria dos baselines.

## Achado e limite da evidência

`Meter` possui referência **weak**, não strong. No encerramento normal o frontend emite `SCRIPTING_SHUTDOWN` antes de `ClearSceneData`. Atualmente `FrontendExitMultiHandler` apenas desabilita eventos; o Handler continua com seus medidores até a última assinatura sair ou o plugin ser descarregado. Se uma fonte expira antes, `Meter::~Meter` não consegue promover sua referência e emite o warning. Isso é compatível com um defeito de ordem; o warning sozinho não prova uma fonte vazada.

O recibo histórico IAB27 registrou três warnings depois de `Scene data cleared`, allocation counter zero, crash zero, remaining zero e double-zero. Não há nome nem UUID nesses warnings: a associação a Master/BusA/BusB é hipótese, não identificação. Não existe evidência que ligue este achado ao crash `c0000094`.

Há também um defeito independente: o destrutor Handler retorna quando `obs_get_signal_handler()` é nulo, antes de parar/juntar sua `std::thread`. Uma thread joinable nessa condição pode terminar o processo; a observação histórica não demonstra que isso ocorreu nela.

## Alteração proposta (cinco arquivos)

- `utils/Obs_VolumeMeter.h/.cpp`: captura pausável e versionada, Stop sem join, WaitForStop apenas no unload final. Limpeza do vetor sob mutex por troca; destruição dos medidores fora dele. Enumeração e criação Meter fora do mutex da lista. Conexões globais ficam até o destrutor. O destrutor sempre drena a thread mesmo sem sinal global. Warning Meter e GetMeterData permanecem byte-equivalentes.
- `eventhandler/EventHandler.h/.cpp`: um Handler estável adormecido criado antes de expor callbacks. Refcount zero pausa; não destrói nem junta a thread. CollectionChanging e ScriptingShutdown limpam medidores enquanto as fontes estão vivas. Um lease shared temporário protege chamadas concorrentes fora do mutex lifecycle, sem strong refs permanentes a fontes. Geração rejeita estado atrasado; epoch distinto impede uma solicitação redundante de invalidar enumeração em andamento e evita aceitar candidatos de coleção anterior.
- `obs-websocket.cpp`: no início do unload final, drenar o publisher **antes** de chamar StopServer, remover subscription callback, liberar/resetar servidor, API ou callbacks EventHandler. O destrutor EventHandler repete Stop/Wait idempotentes fora dos locks antes de liberar outros callbacks e membros.

Nenhum medidor é criado no estado adormecido. Custo: uma thread ociosa acorda a cada período configurado (normalmente 50 ms) sem enumerar, coletar JSON ou publicar. Sem medição CPU nova. As únicas strong refs novas são temporárias durante enumeração, liberadas antes de SetCaptureEnabled retornar.

## Ordem e locks

`ProcessSubscriptionChange` atualiza contador sob lifecycle mutex, solta-o, obtém snapshot versionado e chama captura com lease próprio. Nunca faz join. O pause frontend também não faz join. Signals globais podem reentrar assinaturas, portanto não são desconectados durante pausa. A remoção de volume/audio callbacks por Meter pode adquirir signal/audio mutex; por isso Meter é destruído fora tanto lifecycle quanto meter-list mutex. A enumeração libobs adquire sources mutex; ela também fica fora meter-list mutex. Candidatos rejeitados morrem depois do lock da lista e antes de suas refs temporárias.

UpdateThread reúne dados sob meter-list mutex e publica fora dele. Running/capture/epoch são conferidos antes da publicação. Um callback externo inline já iniciado pode terminar depois de uma pausa; não se espera por ele no GUI. No unload final Stop+Wait esvaziam a thread antes da API/callback teardown. O contrato de unload permanece o contexto normal do módulo/frontend, nunca descarregar o módulo sincronicamente de sua própria thread publisher. Callbacks terceiros que bloqueiam indefinidamente continuam sendo um limite real de unload, não tratados com detach, timeout enganoso ou force kill.

## Testes e provas ainda necessárias

`test.mjs` executa a decisão generation/epoch extraída do próprio corpo C++ com tradução lexical finita; SDK/source/audio são modelos determinísticos declarados. Cobre warning antigo, limpeza precoce, expiração inesperada visível, null-signal join, último unsubscribe sem self-join, late subscribe, pausa/resume, UUID recriado, candidato/estado atrasado, população concorrente e teardown antes de API reset. A primeira execução falhou por shadowing do parâmetro generation no modelo JS; o recibo foi preservado e apenas o modelo foi corrigido.

StopServer por si só não é uma barreira do publisher: aguarda sua threadPool/sessões/thread de servidor, não UpdateThread do Meter. Um OnEvent que passou pelo check de ponteiro pode continuar usando servidor/API. O teste r2 modela callback já iniciado e bloqueado, comprovando que ambos alvos ficam vivos até WaitPublisher completar; depois StopServer drena seus próprios trabalhos e onClose só pausa assinaturas, sem self-join. Isso cobre o publisher Meter; não afirma corrigir todo possível produtor externo de eventos durante unload nem callbacks terceiros que nunca retornam. A descarga normal deve ocorrer no contexto de unload do módulo, nunca dentro de um callback da própria thread publisher.

Pendente: review Root, integração em versão posterior ao Native28, compilação plugin real, IAB real com três fontes de áudio e duas assinaturas, troca de coleção/UUID, teardown com callback em voo e logs/counters/crash. Não chamar os 64 contratos de homologação Native. Expiração inesperada ou exclusão de uma fonte sem deactivate ainda deve registrar o warning original.

Fontes primárias locais lidas: libobs `signal.c` (connect/disconnect/callback mutex), `obs-source.c` (audio capture mutex/destroy/deactivate), `obs.c` (sources enum mutex), frontend `OBSBasic.cpp` e `OBSBasic_SceneCollections.cpp`, `WebSocketApi.cpp`, `WebSocketServer.cpp`, `WebSocketServer_Protocol.cpp`, os cinco baselines pinados. Nenhuma alteração ou fetch nesses arquivos.

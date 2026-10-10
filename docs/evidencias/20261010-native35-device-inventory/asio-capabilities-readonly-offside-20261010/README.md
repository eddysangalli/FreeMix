# Rascunho: abrir áudio sem sondar dispositivos

Somente OFFSIDE. Nenhum arquivo canônico, operador, pacote ou processo Native foi alterado/iniciado. Base Native lida: `a73b97cefd8904191d73dae8693f425fac02e897`. Cinco fontes de produto e hashes exatos estão em `PRODUCT-PINS.json`; o delta é `readonly-asio.patch`. EOL original destes cinco arquivos é LF e foi preservado.

## Comportamento proposto

- `audio_capabilities` vazio/state/busUuid lê três inventários separados: render WASAPI, captura ASIO e saída ASIO. `renderInventoryKnown`, `asioInventoryKnown` e `asioOutputCapabilities.inventoryKnown` são inicialmente falsos. Getter não cria `AsioSession`, QTimer, eventos de frontend/quit, enumerador COM ou propriedades de captura ASIO.
- `discoverAsio:true` significa uma atualização explícita dos **três** inventários. O único emissor normal do backend é `audio_routing_devices` (botão Atualizar dispositivos). `discover()` inicial, refresh, Direct Out e criação de entrada ASIO não inferem consentimento para scan. Direct/Configure/Create pedem atualizar quando necessário. Configure e Start explícitos mantêm a revalidação do driver de saída já existente; Start mantém a abertura COM real, sem autostart.
- Criar a sessão em Configure/Start registra imediatamente os eventos de collection/profile/exit e aboutToQuit. Portanto Configure(A)→troca(B) invalida configured/routes antes de Start. O timer250ms só começa após Start bem-sucedido, e Stop o para. A lambda original do watchdog, limites de dois segundos, proteção de fontes privadas/feedback/rate e callbacks de áudio permanecem iguais.
- Scan incompleto falha fechado: flag correspondente false, mensagem específica, últimos IDs bons conservados. WASAPI explicita HRESULT, libera propriedades/IDs/objetos COM, balanceia S_OK/S_FALSE com CoUninitialize; RPC_E_CHANGED_MODE reutiliza o apartamento e não é tratado como ausência de hardware. Limites:256 entradas de registry/endpoints,4096 bytes por texto WASAPI. IDs de endpoints originais; nenhum novo ID `default`.
- Seleção ASIO salva/pendente ausente continua selecionada como opção indisponível, inclusive após scan conhecido que remove o driver. Não troca implicitamente X→Y. Configure/Create/Direct exigem ID presente no inventário conhecido; Stop/control panel de sessão ativa seguem disponíveis. Não há alteração de persistência ao abrir/ler.
- Parar Direct Out existente não depende de inventário: a operação valida UUID público/diretor e nome/kind do filtro, desabilita somente o filtro existente e conserva dispositivo/ganho salvos. Não cria filtro nem modifica settings/device. A UI permite essa parada; enable continua exigindo inventário conhecido. Atualizar dispositivos também popula opções de um formulário ASIO dirty sem apagar suas rotas/escolhas.

## Evidência e limites

`CHECKS.json`:25 checks CPU aprovados, executando métodos reais do backend e funções reais options/renderAsioOutput em VM/DOM limitado, mais guardas estruturais dos fontes Native. Duas checagens Node de sintaxe aprovadas. O primeiro guard Regex confundiu `Asio()` com sufixo `DiscoverAsio()`; falha preservada em `FIRST-CHECK-FAIL.json`, corrigida somente no harness.

Nada foi compilado ou executado no Native. Estas provas não homologam driver, exclusividade, dispositivo físico, áudio, painel de controle, ausência de vazamentos ou fluidez do operador. JSON ainda materializa dados; a proposta remove inicialização/sondagem de dispositivo na leitura, não promete getter sem qualquer alocação.

`asioInventoryKnown` significa que o plugin disponibilizou uma lista de propriedades válida. A API legada do plugin não informa falhas internas de cada driver; a lista não prova abertura/funcionamento de hardware. Registry Known exige enumeração completa. WASAPI Known exige todas as etapas concluídas; vazio conhecido não é fabricado a partir de erro.

Autenticação, vendor existente, roteamento/privacidade, ações Production e APIs centrais não mudam. Todos os caches são do processo Native e a resposta permanece informativa; não habilitam novos dispositivos nem alteram seleção salva.

Limite herdado ainda presente: `directFields()` pode reaplicar o device já salvo/listado durante polling, sobrescrevendo uma escolha Direct Out pendente ainda não aplicada. O novo cache conserva configuração e seleção ausente; não é uma correção geral do dirty-form de Direct Out nem de conflitos de perfil. Esse comportamento anterior não foi tratado como PASS, e precisa de intervenção própria se incluído no próximo escopo.

## Antigravity primeiro

Primeiro lançamento64816chars falhou antes de criar processo (limite operacional de commandline Windows/ResourceUnavailable), preservado em `AGY-LAUNCH-FAIL.json`. Uma chamada menor inline/source-only/Gemini3.8-flash-high completou exit0, status SUCCESS, response vazia/0 tokens/0s, conversa `7d49385e-e282-4f9e-9ff5-ee7005131056`. Sem patch útil. Resultado/stderr preservados. Implementação Codex foi fallback desta falha operacional; nenhuma cota foi alegada.

## Aceite futuro Root

1. Revisar e aplicar somente cinco arquivos se hashes base coincidirem; compilar Native em série. Não reiniciar operador.
2. Em raiz própria/pinos futuros, abrir/pollar menus várias vezes:0 scans WASAPI/ASIO,0 criação de sessão/timer/event por getter, config antes/depois idêntica. Getter busUuid segue somente leitura.
3. Um clique Atualizar dispositivos deve fazer uma atualização e retornar flags independentes, inclusive falha/partial, sem trocar seleção salva. Repetir reads deve usar cache.
4. Configure(A)→troca de collection/profile→Start deve recusar antes de abrir driver. Configure/Start explícitos podem consultar/abrir hardware autorizado; Stop, watchdog/fault, context/quit devem terminar uma sessão real. Este ensaio físico exige autorização/dispositivo adequado e não é alegado nesta entrega.

# GTZIP — perda de evento na carga

Status: **ordem de perda reproduzida em 8 checks Edge com obsstudio simulado**. Nenhum produto foi alterado para esta prova. Não é teste Native CEF.

O HTML gerado já define GC antes de carregar `gc.js`; o nome `obsSourceActiveChanged` e seu `detail.active` correspondem exatamente ao dispatch Native. O bridge inicia `shown=false`. DOMContentLoaded mostra automaticamente apenas quando `window.obsstudio` não existe. Portanto um evento recebido antes do listener pode se perder: após a carga não há consulta de active nem replay. Reload de uma fonte que continua ativa tem a mesma lacuna.

Leitura Native:

- `freemix-app/plugins/obs-browser/obs-browser-source.cpp:410`: `SetActive` envia Active e `obsSourceActiveChanged` imediatamente; ExecuteOnBrowser não guarda evento quando browser ainda não existe.
- `freemix-app/plugins/obs-browser/browser-client.cpp:609`: `OnLoadEnd` injeta CSS, sem reenviar active.
- `freemix-app/plugins/obs-browser/browser-app.cpp:110`: OnContextCreated cria obsstudio e funções, sem propriedade/getter authoritative de active.
- `browser-app.cpp:226`: CustomEvent possui detail JSON, nome correto.
- `obs-vmix/ferramentas/gtzip-runtime.mjs:6-9`: evento ativo e comandos explícitos são escutados; `freemix-gc-air` é escutado, mas não foi localizado emissor nos fontes pesquisados.

O teste usa o HTML de fixture própria do renderer e o bridge atual byte a byte. Evento ativo antes da carga fica hidden; evento ativo depois da carga mostra; false oculta; comando para outro nome não mostra; comando próprio recupera; reload sem edge posterior volta hidden. Simular replay de true após carga recupera, enquanto false após carga continua oculto. Nenhum erro JS.

Evidência CEF independente do installer: retry3 ativou own Program após espera de 5 s e decodificou QR inicial e atualizado UTF-8. A recuperação falhou depois, por scanner de módulos internos, registrada em `qa-finalizacao/package-native-startup-045000-qr-retry3.json`. O recibo geral continua FAIL pelo recovery; não foi transformado em PASS.

Correção mínima proposta: em OnLoadEnd do frame principal, reenunciar o valor atual authoritative `obs_source_active(bs->source)` por SetActive, depois da carga. Root/installer deve revisar validade/vida útil e frame principal, compilar, e provar Native ativação cedo, reload estando ativo e manutenção de off-air oculto. Não inferir active de getStatus/getCurrentScene; mostrar tudo em DOMContentLoaded alteraria preview/off-air. Não alegamos que os eventos Native anteriores das capturas transparentes foram medidos diretamente nesta QA.

Nenhum build, Git, Native, mesa, transmissões ou pacote selado foi tocado. `resultado.json` registra hashes dos fontes somente lidos. Esses hashes de Native descrevem o checkout da leitura, não os DLLs usados pelo installer.

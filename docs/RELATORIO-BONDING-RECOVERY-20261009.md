# Bonding medido, receptor portátil e conteúdo remoto na recuperação

Implementação local de 9 de outubro de 2026. Operador, portas 8088/4466, motor nativo, configurações do operador e ZIPs selados não foram alterados nesta frente.

## Bonding

`bonding-medicoes.mjs` acrescenta medição opt-in. `measureMedia` autentica um envelope próprio por caminho e contabiliza pacotes originais recebidos antes de FEC e retransmissão, com janela de chegada atrasada. Feedback, pedidos e testes usam domínios HKDF distintos, limites, sessão, contador e proteção contra repetição. A mídia interna continua usando o AES-GCM e a paridade anteriores. Pacote máximo com envelope cabe no MTU IPv4 de 1500 bytes.

`network_measure` faz um teste explícito limitado: 150–400 ms por taxa, taxas 1/4/16/teto até 64 Mbps e até 5 MB por caminho. O resultado é **goodput realmente recebido dentro das taxas testadas**, um limite inferior; não é a velocidade nominal da interface nem uma homologação WAN. Não existe teste automático. `measuredAllocation` exige agregação e `measureMedia`, reserva 20% do goodput, reduz alocação conforme perda recente e invalida medições após cinco minutos. Sem medição válida, o caminho não recebe mídia. Configuração padrão continua manual.

Prova UDP local em 18210–18215: goodput 15,50 e 3,88 Mbps, pesos iniciais 80/20, perda original 0% e 30,77% durante descarte dirigido. Foram entregues 200/200 pacotes por FEC/NACK (3 recuperações FEC e 3 retransmissões). São sete checks PASS em `resultado-bonding-medido-20261009.json`, incluindo envelope adulterado, validação de configuração e runtime portátil.

## Receptor portátil privado

`network_export_receiver` cria pasta UUID nova, JSON privado, três módulos, Node Windows, CMD e manifesto de hashes. Nenhum processo é iniciado nem regra de firewall aplicada. `--check` valida configuração, versão de Node e hashes presentes no manifesto, sem abrir socket e sem imprimir a chave. O manifesto local verifica integridade, não é uma assinatura de distribuição; a entrega assinada continua sendo responsabilidade do instalador/empacotador central.

CLI:

```text
node ferramentas/bonding-producao.mjs --receiver receptor-privado.json --check
node ferramentas/bonding-producao.mjs --receiver receptor-privado.json --listen=0.0.0.0
```

O segundo comando expõe somente a porta UDP configurada, quando usado explicitamente. Saída MPEG-TS permanece em 127.0.0.1. Interface do emissor ausente na máquina receptora não bloqueia o papel `receiver`. Linux usa Node >=20 instalado e os três módulos; esta frente não instalou serviço, TURN ou firewall. O kit Linux é integrado separadamente pela raiz.

O JSON exportado contém chave AES. Pacote privado não deve integrar ZIP público ou diagnóstico. Dois computadores precisam da versão atual para medição; modo manual continua compatível com envelopes anteriores.

## Recuperação de conteúdo remoto

`recovery_backup` aceita opção manual explícita `materializeRemote:true,remote:{urls:[...]}`. `recuperacao-remota.mjs` baixa GETs HTTPS com TLS normal; HTTP é permitido somente em loopback para ensaio. Rejeita credenciais em URL/parâmetros privados e redirecionamento para outra origem. Não usa cookies, autenticação, browser ou execução de JavaScript. Captura HTML/CSS/imports JS/imagens/fontes/mídia e respostas JSON explícitas; navegação e fetch dinâmico exigem URL explícita. Defaults: 64 arquivos, 10 MB/arquivo, 50 MB total, quatro níveis, timeout 5 s/arquivo e limite total 30 s. URLs extras autorizam somente suas origens.

Cada download registra hash e tamanho originais; o arquivo local transformado possui hash próprio no `.fmx`. Referências estáticas viram arquivos locais. HTML recebe CSP bloqueando scripts, conexões, frames e formulários. Dados dinâmicos são preservados como respostas, **sem recompor o aplicativo/serviço**. Na cópia restaurada, browsers HTTP sem captura e mídias HTTP/RTMP/RTSP/SRT/UDP ficam sem endereço remoto; browser capturado usa HTML local estático. Isso não pretende desativar descoberta global de plugins, drivers ou reconstruir NDI/Calls ao vivo.

Cinco checks PASS em `resultado-recuperacao-remota-20261009.json`: captura transitiva + JSON explícito, limites/origem/credenciais, backup/restauração em produção nova sem nova requisição/original preservado, adulteração rejeitada, TLS real rejeitando certificado não confiável. HTTP local 18216 e HTTPS local 18218. O fluxo completo do RecoveryEngine foi exercitado com adaptador de motor controlado; não é prova nativa de renderização do HTML nesta rodada.

## Dependências da instalação

`recuperacao-instalabilidade.mjs`, chamado por `recovery_diagnose`, lê headers/imports PE sem executar DLLs e procura sidecars no diretório do plugin, bin/64bit, runtime, plugins e System32. Mostra arquitetura, DLL presente/não resolvida e contratos Windows API-set separadamente. Cinco checks PASS em `resultado-instalabilidade-recovery-20261009.json`, incluindo headers reais do libobs local, sidecar presente/ausente e arquivo malformado.

Presença não comprova ABI, exports, carregamento, licença redistribuível ou hardware. Limite 80 plugins, imports diretos e delay imports por RVA; drivers, fontes de sistema e dependências externas não são reinstalados automaticamente. Inventário anterior continua mostrando kinds/plugins/dispositivos reais disponíveis.

## Integração da raiz

- Adicionar `network_measure` ao gate local de configuração/exportação; `NetworkEngine.execute` já implementa ação e UI já envia o contrato.
- Nenhuma rota nova de Recovery é necessária. Defaults não fazem download, medição, bind ou execução automática.
- Novos módulos obrigatórios: `bonding-medicoes.mjs`, `bonding-receptor-portatil.mjs`, `recuperacao-remota.mjs`, `recuperacao-instalabilidade.mjs`.
- Arquivos alterados: `bonding-producao.mjs`, `recuperacao-producao.mjs`, `painel/remoto/rede.html/js`, `painel/remoto/recuperacao.html/js`.
- Sintaxe dos módulos e UIs verificada. Provas acima são dirigidas; não houve transmissão externa, teste WAN, GUI nativa nova ou endurance.

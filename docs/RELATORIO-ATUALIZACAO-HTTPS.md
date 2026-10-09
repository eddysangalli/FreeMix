# Cliente de atualização HTTPS configurável

Implementado em 08/10/2026, sem servidor publicado, sem domínio predefinido e sem consultas automáticas. A configuração pertence à instalação, em `config/obs-studio/plugin_config/freemix-control/update-feed.json`; não contém chaves/tokens. Um endereço vazio desativa o feed. Salvar endereço e ler estado não acessam rede.

## Contrato da distribuição

O operador informa uma URL **HTTPS**, sem credenciais, query ou fragmento. A resposta é JSON:

```json
{
  "format": 1,
  "manifestUrl": "HTTPS absoluto, mesma origem",
  "signatureUrl": "HTTPS absoluto, mesma origem",
  "filesBaseUrl": "HTTPS absoluto, mesma origem, termina com /"
}
```

O manifesto segue o formato **1 do atualizador incremental local**: `version` e `files` com `path`, `size`, `sha256`. A assinatura é binária Ed25519 de 64 bytes, sobre os bytes exatos do manifesto. A chave confiável é `update-public.pem` da instalação; o feed não fornece outra chave. `version.json` é obrigatório e deve confirmar a versão assinada. Pacote completo de instalação formato2 não é aceito por este cliente incremental.

TLS usa a validação padrão do Node com `rejectUnauthorized:true`; sem certificados aceitos à força, agent customizado, redirecionamentos ou retry para outra origem. O cliente rejeita arquivos comprimidos pelo transporte. Limites: feed64KB, manifesto16MB, 40mil arquivos, arquivo2GB, total8GB, 30segundos por request e 10minutos no conjunto de arquivos. O download faz streaming para arquivo privado, sem acumular um arquivo de 2GB em memória.

Assinatura e versão posterior são verificadas antes de ler os arquivos do pacote. Versões seguem a comparação numérica dos componentes utilizada no projeto, incluindo o timestamp de versões `local`; não se trata de um catálogo universal de canais SemVer. Caminhos recusam traversal, nomes reservados Windows, duplicados sem distinção de maiúsculas, colisão arquivo/pasta, configurações/projetos/gravações e `painel/local.js`. Links/junções são recusados na árvore de gravação.

## Comportamento do cliente

`OnlineUpdateEngine(root)` em `ferramentas/atualizacao-online.mjs` fornece `summary()`, `last` e `execute(action,data)`:

- `update_read`: estado/configuração e versão instalada, sem consulta externa.
- `update_configure {url}`: salvar ou desativar feed, sem consulta externa.
- `update_check`: consultar feed, manifesto e assinatura; expor versão/tamanho somente após validação.
- `update_download`: revalidar chave e versão atual; baixar arquivos por URLs derivadas dos caminhos assinados, conferir tamanho e SHA256, conferir `version.json`; publicar pasta pronta apenas depois de todos os arquivos aprovados.

Pacotes ficam em `updates/downloads/<uuid>` com `manifest.json` e `manifest.sig`, compatíveis com o atualizador local. Falhas removem somente o staging privado verificado; não alteram versão, executável nem projetos existentes. O cliente não oferece `apply`, não executa código baixado, não reinicia motor/API, não inicia saídas e não aplica com o aplicativo aberto. A aplicação e rollback pertencem ao atualizador local e ao guard de processos já existente.

A nova tela `painel/remoto/atualizacao.html/js` é acessível por Configurações → Atualizações. Endereço, consulta e download são explícitos. Mostra versão instalada/disponível, quantidade/tamanho, horário de verificação e caminho do pacote aprovado. A raiz integra rotas/actions `update_*` com acesso somente local e resposta `{success:true,update:engine.last}`. Downloads não devem bloquear a fila de produção/tick por minutos; a chamada deve permanecer na engine independente.

## Provas e limites

`resultado-atualizacao-online.json`: **8 PASS**, fixtures assinadas por chave Ed25519 temporária, configuração sem rede, URL/same-origin/segredos, assinatura/hash/downgrade, path/duplicados/limites, adulteração sem publicação, download streaming compatível, revalidação após versão instalada mudar e **TLS real local** recusando certificado self-signed. Todos os dados foram gerados numa raiz temporária FreeMix-QA-HTTPS. Nenhuma URL de distribuição externa foi acessada nos testes.

`resultado-atualizacao-interface.json`: **3 PASS** no navegador com API simulada, cobrindo bloqueios iniciais, fluxo explícito e desativação; sem erros de página. `atualizacao-interface.png` mostra o estado de pacote disponível. Esses testes não validam um servidor de distribuição real, porque nenhum foi definido/publicado. Importação do módulo e syntax check complementam as provas.

Permanecem fora desta entrega: hospedagem/publicação, certificado/domínio do distribuidor, assinatura de uma release online real e prova contra esse serviço, canais automáticos e atualização silenciosa. O cliente implementa verificação/download manual e prepara o pacote; não afirma ter publicado uma atualização.

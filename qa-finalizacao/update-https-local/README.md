# Atualização HTTPS local — evidência finita

**PASS: 50 verificações**, 52 requisições reais, TLS 1.3. Nenhuma fonte de produto alterada. Não houve aplicação/rollback, Native, operador, feed real ou publicação externa.

`test.mjs` cria exclusivamente em TEMP própria uma CA de desenvolvimento e dois certificados de servidor: um com SAN IP 127.0.0.1 correto, outro com hostname incorreto. OpenSSL local cria os certificados; chaves privadas não saem de TEMP e não entram na allowlist. Dois servidores HTTPS escutam somente 127.0.0.1 em portas efêmeras. O pacote próprio de dois arquivos tem manifesto Ed25519 assinado com chave efêmera.

`child.mjs` importa **OnlineUpdateEngine e httpsBytes reais**. Não usa adapter, custom agent, `rejectUnauthorized:false` nem `NODE_TLS_REJECT_UNAUTHORIZED=0`. O subprocesso trusted recebe `NODE_EXTRA_CA_CERTS` apontando somente para a CA própria; o subprocesso untrusted não recebe esse trust e recusa o servidor. Nenhuma variável global ou confiança do Windows é alterada. Hashes de três fontes do produto antes/depois são idênticos e estão no recibo.

Positivos: configuração e reload do feed persistido, consulta HTTPS do feed/manifesto/assinatura, verificação Ed25519, streaming real dos dois arquivos, tamanho e SHA256 de cada arquivo, versão nova disponível e pacote baixado sem aplicar na instalação.

Negativas reais: CA não confiada; hostname incompatível mesmo com CA confiada; timeout limitado; assinatura inválida; manifesto adulterado; versão antiga; traversal; URLs de origens diferentes; content-encoding inesperado; redirecionamento no feed, manifesto e arquivo; hash errado; tamanho excedido com Content-Length e chunked; arquivo truncado; version.json divergente da versão assinada. Em todas as falhas de download, estado final seguro e ausência de staging `.partial` ou pacote final. O endpoint de redirecionamento nunca foi acessado. HTTP, credenciais, query e fragmento também foram recusados pelo contrato URL real.

Recibos: `resultado.json` resume a matriz e os pins; `resultado-trusted.json` e `resultado-untrusted.json` guardam os checks específicos. O processo pai encerrou os dois servidores/sockets, apagou chaves/fixtures somente após conferir sua raiz TEMP e retornou exit0. Os recibos usam `flag:'wx'` e não devem ser sobrescritos por reexecução.

Reprodução em nova pasta de recibos: `node test.mjs`, com OpenSSL local disponível em `C:/Program Files/Git/usr/bin/openssl.exe`, ou parâmetro de ambiente **somente da QA** `FREEMIX_QA_OPENSSL` apontando para um executável OpenSSL existente. A QA exige Node com suporte a NODE_EXTRA_CA_CERTS. Nenhum download de dependência foi feito.

Limites: não aprova disponibilidade de um feed público/WAN, domínio/DNS de distribuição, nem atualização de um pacote completo de instalador. O painel continua apenas consultando/baixando; aplicação/rollback local previamente comprovados não foram repetidos. Não mede UI/CEF ou Native instalado. Certificados de desenvolvimento e chave de assinatura da fixture não são certificados ou chaves de distribuição do produto.

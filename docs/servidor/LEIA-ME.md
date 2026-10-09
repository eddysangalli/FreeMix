# Serviços FreeMix

Kit para VPS Linux dedicado com Node.js 20+, Caddy e coturn. Hospedagem comum de site sem UDP/processos próprios não substitui esse receptor.

1. Aponte um domínio seu para o IP público do VPS e preencha `servidor.json` a partir do exemplo.
2. Copie o kit preparado inteiro para o VPS. Execute `sudo bash instalar-servidor.sh --config servidor.json`.
3. Importe o ICE privado gerado na central Calls e configure o endereço HTTPS do feed na central Atualizações. Abra somente as portas listadas em `PORTAS.txt` na rede do VPS.

As configurações e credenciais são geradas localmente. O kit não publica nada sozinho, não contém chave de assinatura privada e não expõe a API do operador. O feed serve apenas arquivos do incremento assinado, conferidos antes de escutar. O receptor bonding usa o JSON privado exportado pela central Rede e envia TS a localhost.

O `--check` confere a release antes de iniciar serviços. A instalação preserva serviços existentes e recusa conflitos de portas/pasta. Caddy obtém HTTPS para o domínio configurado; coturn fornece relay autenticado. Fonte das opções: [Caddy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy) e [coturn](https://github.com/coturn/coturn/blob/master/examples/etc/turnserver.conf).

Para bonding, `bondingPort` deve ser exatamente o `receiverPort` do JSON privado exportado e das rotas do remetente; o exemplo usa 19101. Na central Rede configure essa porta antes de exportar. Copie o pacote privado do receptor separadamente para o VPS, confira `node bonding-producao.mjs --receiver receptor-privado.json --check`, e então inicie com `--listen=0.0.0.0`. O receptor usa Node instalado no Linux; não execute o node.exe Windows do pacote nesse servidor. TS de saída continua apenas em 127.0.0.1. O receptor não é iniciado automaticamente pelo instalador web/TURN.

O arquivo `ice-import.json` fica em `/opt/freemix-services/private/`; copie-o privadamente para a máquina FreeMix e use Calls → Importar configuração TURN. Ele para os retornos atuais e exige prepará-los novamente. A configuração vale para o publicador de retorno FreeMix; os convidados usam VDO.Ninja. O feed fica em `https://SEU_DOMINIO/updates/feed.json`. Não edite os arquivos de `release`: a assinatura/hashes são conferidos e uma alteração bloqueia a inicialização.

Prova local de TLS/feed não é prova de DNS, portas públicas, audição humana ou TURN em operadoras reais. Essas dependências permanecem explícitas até configurar um servidor seu.

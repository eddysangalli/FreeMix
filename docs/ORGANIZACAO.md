# Organização das pastas — 10/10/2026

Na raiz ficam README, o apontador CONTINUAR e os atalhos principais de abrir, instalar e gerar logs. Documentação atual está em `docs`; scripts auxiliares em `scripts`.

`obs-vmix` é a instalação do operador. `freemix-app` é o repositório C++ do motor e suas compilações. `FreeMix` é o repositório privado de distribuição dos fontes/painel/patches. Eles têm funções distintas; apagar um dos repositórios elimina parte do projeto. Cópias geradas e antigas são arquivadas separadamente quando não utilizadas.

`entregas/INSTALADOR-ATUAL.json` aponta o instalador completo verificado 000500 (Native21). `ULTIMA-ATUALIZACAO.json` conserva o incremento da instalação legada do operador, que não foi ativada/substituída por esta rodada. A ponte nativa alpha tem ZIP beta separado. Versões anteriores são movidas para `archived/limpeza-demo-20261009/entregas-antigas`, com registro de origem/destino. Os pacotes assinados não são modificados.

As pastas `qa-*` têm scripts e evidências do que passou e falhou. Runtimes/SDKs ainda usados pelos testes permanecem. Fixtures e provas antigas encerradas foram movidas para `archived/limpeza-demo-20261009`, preservando seus nomes.

Consulte `archived/limpeza-demo-20261009/movimentos.json` e os recibos complementares para recuperar os caminhos antigos. Os movimentos não encerram processos nem alteram gravações/configurações do operador.

O instalador completo anterior 153453, seu ZIP/pasta e respectivos hashes/recibo foram movidos para archived/rollback-installer-20261009153453 (seis artefatos), preservados para rollback. O protótipo de empacotamento da ponte 220409 foi arquivado em archived/betas-nao-entregues; a beta atual é 220522. Nenhuma release assinada foi modificada.

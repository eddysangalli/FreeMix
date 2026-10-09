# Organização das pastas — 09/10/2026

Na raiz ficam README, o apontador CONTINUAR e os atalhos principais de abrir, instalar e gerar logs. Documentação atual está em `docs`; scripts auxiliares em `scripts`.

`obs-vmix` é a instalação do operador. `freemix-app` é o repositório C++ do motor e suas compilações. `FreeMix` é o repositório privado de distribuição dos fontes/painel/patches. Eles têm funções distintas; apagar um dos repositórios elimina parte do projeto. Cópias geradas e antigas são arquivadas separadamente quando não utilizadas.

`entregas` conserva a versão indicada por `ULTIMA-ATUALIZACAO.json`, seu pacote completo/incremental, o instalador e os recibos atuais. Versões anteriores são movidas para `archived/limpeza-demo-20261009/entregas-antigas`, com registro de origem/destino. Os pacotes assinados não são modificados.

As pastas `qa-*` têm scripts e evidências do que passou e falhou. Runtimes/SDKs ainda usados pelos testes permanecem. Fixtures e provas antigas encerradas foram movidas para `archived/limpeza-demo-20261009`, preservando seus nomes.

Consulte `archived/limpeza-demo-20261009/movimentos.json` e os recibos complementares para recuperar os caminhos antigos. Os movimentos não encerram processos nem alteram gravações/configurações do operador.

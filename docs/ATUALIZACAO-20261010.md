# Situação do FreeMix em 10/10/2026

O instalador selecionado é **0.1.0-local.20261010060000, Native24/a047860**. As correções posteriores estão em desenvolvimento e não estão incluídas nesse instalador.

**Entregue:** instalador600 conferido numa instalação real com dois ciclos cooperativos, zero crash e contador zero nesse ensaio; diagnóstico instalado e desinstalação conservadora. Navegação e menus foram conferidos em IAB com backend Native real. Isso não homologa todo CEF, hardware ou internet. Fontes e provas estão no GitHub, commit7793113.

**Correções posteriores nas fontes:** recuperação de operações incertas sem repetir Cut/Preview/exclusão; orçamento de miniaturas que ignora entradas fora da tela/minimizadas; polling HTTP periódico fora da fila dos comandos. Há24 testes de contrato,11 do orçamento de capturas e13 da fila com HTTP próprio. Cut, Preview, exclusão e mudança de contexto passaram no ensaio direto com Native real; fechamento cooperativo com contador0/crash0. Endpoint HTTP e mesa ainda pendentes.

**Nova integração Native:** commit local de136e8 reúne FTB com retorno ao Programa renderizado, captura contínua AUX das Calls com25/30/29,97fps derivados e observação opcional dos editores Qt. Compilação completa passou;2085 arquivos congelados para QA real. Provas do draft não equivalem a feature instalada; controle Node/browser e áudio sincronizado das Calls ainda precisam integração/QA.

O instalador600 e sua seleção continuam intactos. A instalação e os processos do operador foram preservados. Próximas etapas e limites estão em [pendências reais](PENDENCIAS-REAIS.md).
Histórico anterior completo: [registro preservado](historico/20261010-preNative25/ATUALIZACAO-20261010.md).

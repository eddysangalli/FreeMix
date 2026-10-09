# Conteúdo vinculado entre composições horizontal e vertical

Na tela Composições, **Criar versão vertical vinculada** ou **Criar versão horizontal vinculada** cria outra entrada com geometria própria. Trocar a câmera de uma camada ou o fundo em qualquer versão atualiza as versões vinculadas. Posição, recorte, máscara, estilo e enquadramento Fit/Fill de cada versão permanecem próprios. Os dados dos títulos compartilhados seguem a fonte original; o vínculo não cria um novo editor de títulos.

Correção desta rodada: a propagação de conteúdo podia levar o modo Fill da horizontal para a vertical. Agora esse modo só muda na versão editada. A tela informa o estado do vínculo e permite **Desfazer troca de conteúdo H/V**, até 20 trocas nesta sessão. Desfazer posição continua separado. Desvincular deixa a entrada independente; fechar o serviço descarta o histórico de desfazer, mas preserva as composições salvas.

Antes de propagar, as camadas são verificadas nas versões: câmera existente, ausência de ciclos e camadas desbloqueadas. Falha numa versão reverte as operações tentadas. Se a reversão também falhar, a mensagem informa a restauração incompleta; não se declara sucesso. Desfazer recusa um vínculo alterado ou uma dependência removida.

## Evidência

- `qa-finalizacao/resultado-composicoes-vinculadas.json`: seis regressões de comportamento com transporte simulado, incluindo falha após mutação parcial, bloqueio, ciclo e vínculo alterado.
- `qa-finalizacao/resultado-composicoes-vinculadas-native.json`: sete verificações com o motor real em instalação temporária/porta 14499; troca e desfazer de câmeras/fundos, enquadramentos próprios, bloqueio e desvincular. Screenshots confirmam a fonte nova nas duas orientações. Programa e saídas da raiz QA permaneceram inalterados. Operador não acessado.
- Motor testado: SHA-256 `09ae2e0f2c72df7e4245df2cb616ba3ede281fe28eb9dc2a6cde0e9b91df105e`.

Isso valida o contrato de conteúdo descrito acima. Não significa propagação de todas as edições de geometria, nem homologação física de duas saídas simultâneas.

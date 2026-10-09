# Biblioteca GC própria — 8/10/2026

Foram acrescentados 22 modelos próprios: 11 estruturas de conteúdo com versões horizontal 1920×1080 e vertical 1080×1920. O catálogo conserva as cinco entradas anteriores, incluindo o placar importado do operador. O pacote deve continuar excluindo `gc/gt_titles` e os importados; nenhum arquivo importado foi alterado nesta frente.

Modelos: manchete, nome/cargo/local, dois nomes, créditos por cargo, agenda por horário, contagem regressiva, placar com relógio, comparativo estatístico, marca/relógio, redes sociais e cartão de informação. As versões verticais reorganizam conteúdo e posições. Contagem e placar avançam enquanto o título está ativo; editar campos ou entrar no ar reinicia o tempo a partir do valor configurado.

A tela `/gc` oferece galeria com 22 miniaturas PNG, filtros por grupo/formato, edição de campos, cores de destaque/painel/texto, opacidade, tamanho de texto, deslocamento e escala. Salvar seleciona o ID confirmado; nomes iguais são permitidos. Duplicação e importação geram IDs novos. Exportação/importação JSON contempla somente os modelos próprios e campos tipados, sem scripts, URLs, arquivos ou credenciais. Importação é validada integralmente antes de acrescentar títulos. Salvar/importar não coloca um título fora do ar no ar.

`GCLibraryEngine` persiste biblioteca por produção em `freemix-gc`. Criar entrada usa uma cena e navegador próprios por UUID. Colocar/retirar do ar utiliza os canais de overlay existentes; retirar não corta outro título que passou a ocupar o canal. Troca de modelo/canal e remoção são bloqueadas enquanto o título está no ar. Campos salvos de um título ativo usam o evento GC existente; o endereço atualizado é persistido ao retirar. Remover da biblioteca conserva a cena criada no motor, permitindo revisão e limpeza manual posterior.

O backup `.fmx` inclui o namespace GC e segue as referências estáticas dos navegadores até `core.js` e lifecycle. A allowlist de criação e de leitura foi atualizada sem mudar o contrato de hashes. A restauração continua criando outra produção; não substitui a original.

## Evidência

- `qa-portatil/resultado-gc-miniaturas.json`: 22 PNG gerados do mesmo SVG usado no renderer, dimensões e SHA256; cinco entradas originais preservadas.
- `qa-portatil/resultado-gc-biblioteca.json`: sete verificações de modelos/campos/segurança/persistência/orientação/overlay/importação e 22 páginas abertas em Edge headless, com lifecycle de update/play/stop confirmado.
- `qa-portatil/resultado-gc-biblioteca-nativo.json`: seis verificações na raiz privada `FreeMix-QA-Recovery-20261008`, WS14479/API18104: screenshot CEF não vazio; edição no ar; navegador vertical; backup de metadados e scripts; restauração nova; galeria/campos/salvar/seleção e orientação pela UI/API real.
- `qa-portatil/resultado-gc-editor-contrato.json`: três verificações adicionais em servidor temporário com o backend GC real e transporte simulado: Salvar confirma novo ID/readback e habilita ações, Duplicar seleciona novo ID, trocar orientação abre título independente. Esta prova aguarda a Promise de Salvar; a captura anterior do editor real foi tirada antes do fim dessa Promise.
- `qa-portatil/gc-biblioteca-capturas/`: amostras horizontal/vertical, screenshot nativo e tela do editor. Inspeção visual de manchete/agenda/placar/dois nomes e editor foi feita, sem equivaler à aprovação visual do usuário.
- `qa-portatil/resultado-gc-biblioteca-encerrada.json`: QA salva e fechada, saídas inativas, operador preservado.

As tentativas curtas da mesma sessão privada identificaram a regex de leitura `.fmx` sem o namespace GC e os recursos `.mjs` bloqueados pelo servidor. Ambas foram corrigidas e os passos afetados conferidos. O browser usa cópias ESmodule `.js`; os modelos ao vivo usam bundle clássico para funcionar também em `file://` no CEF. O teste de caminhos Windows normaliza separadores; o teste do editor ignora somente favicon ausente. Não houve build nativa nesta frente.

## Limites reais

A biblioteca é um conjunto de layouts próprios com campos e estilo, não um editor universal de títulos de terceiros nem suporte completo ao formato GTZIP. O fundo editável é cor/opacidade; imagens arbitrárias e fontes externas não são importadas. Não há sincronização automática entre dois títulos salvos de orientações diferentes. Cada versão é independente. Textos extensos e listas têm áreas fixas e limite de 12 linhas; conferir leitura no Preview antes do ar. Não houve homologação de todos os tamanhos/DPI, nem entrega visual aprovada pelo usuário. GC da biblioteca ainda não foi incluído nas ações de replay de journal/macros; ações desconhecidas continuam sendo lacunas explícitas, sem replay parcial silencioso.

## Arquivos e integração

Fontes: `painel/gc/biblioteca/modelos.mjs`, `render.mjs`, `player.mjs`; geração: `ferramentas/gerar-biblioteca-gc.mjs`; backend: `ferramentas/gc-biblioteca-producao.mjs`; UI: `painel/remoto/gc.html` e `gc.js`. Páginas/descriptors, browser modules, bundle e miniaturas próprios são gerados em `painel/gc/biblioteca`. `recuperacao-producao.mjs` inclui namespace e allowlist GC. Production/API/mesa foram integrados pela raiz com constructor/setScope/summary/execute, restrição local de edição/import/export e dimensões do catálogo.

Para a entrega, copiar a árvore GC própria, catálogo limpo sem entradas importadas, UI, backend e RecoveryEngine atual. A instalação do operador não deve receber fixtures/receipts/capturas/configurações da QA.

## Seletor da Mesa em instalações atualizadas

A Mesa agora carrega catalogo-biblioteca.js e mescla os 22 modelos próprios em memória aos antigos/importados. Não altera catalogo.js do operador. Recarregar/importar mantém os novos modelos sem duplicação e seleciona o novo título importado. As dimensões dos modelos horizontais/verticais alimentam o Browser real. Provas: resultado-gc-catalogo-mesa.json e resultado-gc-catalogo-mesa-ui.json.

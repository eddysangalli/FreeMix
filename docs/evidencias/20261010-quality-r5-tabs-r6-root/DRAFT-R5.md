# R5 — conexão capturada, revisão backend mínima

R4 preservada. Root identificou que seu `bound.getObs` devolvia o novo OBS RAW quando a conexão mudava. A reprodução `prior-r4-foreign-binding-fail.json` usa a classe R4 real e QualityAdapter.session real, com dois stubs: uma escrita chega ao foreign e fica sem contador. Nenhum motor/processo/escrita real é utilizado nessa reprodução.

R5 altera **apenas** esse accessor: `check(); return obs;`. Ele nunca devolve conexão estrangeira. Mudança de OBS/scope/disconnected lança antes de retornar o proxy. Isso fecha a janela entre discover e Quality.session; os req capturados também continuam conferindo antes/depois de await. Zero dispatch torna rejected; falha depois da primeira escrita permanece uncertain.

37 casos executados nesta revisão: 9 novos de binding/race/legacy, 28 regressões do adapter. O restante UI/cache R4 permanece byteidêntico com provas históricas preservadas (73 casos R4; não rotulados como 73 novas execuções R5). 8 arquivos JS/MJS de produto passam syntax. Nenhum Native/API/browser/mic/model/SDK foi iniciado.

Os 10 product files completos são pinados em INTEGRATION-R5.json; todos salvo efeitos-operacoes.mjs devem ser byteidênticos R4. Novo fechamento cache permanece requerido. UI de abas será derivação R6 separada, preservando esta freeze. Baselines R3/R4 e hashes canônicos são responsabilidade do guard Root, não aplicar scripts prepare aqui ao produto.

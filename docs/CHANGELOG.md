# Changelog do FreeMix

Registro cronológico resumido, só com marcos confirmados. Para estado vigente: CONTINUAR.md e PENDENCIAS-REAIS.md. Arquivo novo; não existia changelog consolidado antes de 11/10/2026. Datas abaixo estão em UTC (horário de São Paulo = UTC-3).

## 10/10/2026
- Instalador completo selecionado: `0.1.0-local.20261010060000`, Native24/a047860 (imutável), validado em instalação própria do Root.
- Prazo de conclusão definido para 13/10 (plano em PLANO-CONCLUSAO-20261013.md).

## 11/10/2026
- **App36 R4e — PASS:** 60.077ms de permanência em cinco telas, contadores run0/execute1/journal2/mutatingReq19 iguais ao início, Preview 90ms, Cut 165ms, dedupe/tags corretos, autosave só após mudança real, checkpoint manual HTTP 200, fechamento limpo (cleanup 0). Corrige o FAIL anterior de autosave do App36 R3 (preservado como histórico). Prova: [App36 R4e](evidencias/20261011-app36-r4e-real-pass/ROOT-README.md), `receipt-r4e.json`. Escopo: Native36 + painel `e801` — ainda não o Native38 atual. Ensaio ocorreu em 10/10/2026, 23:15–23:21 horário de São Paulo (11/10 em UTC).
- Native37 corrige o inventário de áudio tolerante a uma entrada defeituosa (ASIO/dispositivo sem nome). Native38 (`ed08547`) permite cada janela abrir no tamanho pedido pela página.
- Sete janelas novas (Streaming, Calls, Externo, Gravar, MultiGravação, Configurações do Replay, Configurações) tiveram roteiros relatando 122/122 — a maior parte dessa automação roda num navegador Edge separado, não na janela CEF embutida; só o caminho real de abrir a engrenagem e fechar pela janela nativa foi provado em separado (fechamento em 2s, 0 vazamentos).
- Corrigido nessa rodada: botão Fechar não fechava a janela de dentro do programa (agora usa o pedido nativo `close_panel`); Gravar e MultiGravação reescritos no molde visual do vMix; perda de texto não salvo no Externo; câmera obsoleta oferecida nas Configurações do Replay.
- Janela “Configurações” (engrenagem geral) implementada a partir das 98 preferências reais do motor; 18/18 testes com o programa real. Pendente: importar arquivo real, baixar Exportar na janela, botão nativo “todas as preferências do programa”.
- Atualização incremental da mesa **armada**: `0.1.0-local.20261011145116` (Native38 `ed08547` + painel `71f8aa7`) sobre a mesa em `0.1.0-local.20261009153453`. Ensaiada antes de armar numa cópia de fábrica — não testada com a configuração real do operador. Não aplicada até o momento.
- Prioridade definida pelo dono: estabilidade de transmissão (saídas simultâneas, reconexão, latência sob carga) é P0 atual, separada do endurance específico do Replay; ainda não há pacote completo novo selado com as fontes finais do Native38.
- Conferido: HEAD do FreeMix (`c4f374268adae2e73a71189400cd1bd26997d59b`) limpo e idêntico ao branch remoto no GitHub (https://github.com/eddysangalli/FreeMix) nesta checagem — código integrado publicado; propostas/bancadas offside permanecem locais. Assinatura + 394 hashes de arquivo e 18 fontes de UI/API/Mesa batem com o pacote armado.
- O dono aprovou a linha visual geral das telas (cópias do vMix); a prévia de Calls com API própria MOCK (chamadas sintéticas) não é prova de motor Native, microfone ou rede WAN.
- Preparado, não executado: especificação de QA externo de fontes/preferências nativas do Calls; 3 testes de Configurações Gerais pendentes. Revisões de fonte sobre stream/concorrência/reconexão aguardam confirmação em runtime.
- AGY: última chamada recebeu HTTP 429 (RESOURCE_EXHAUSTED, resposta 0 bytes); nova tentativa espaçada também 429. Claude retomou e respondeu integralmente depois — cotas interromperam parte das tarefas, mas Claude não está mais bloqueado; o AGY, na última tentativa, continua bloqueado.
- Criado este arquivo (`CHANGELOG.md`).

Detalhes e limites: PENDENCIAS-REAIS.md. Próximos passos: CONTINUAR.md.

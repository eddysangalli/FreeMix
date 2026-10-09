# NDI / OMT: senders independentes e alpha

Implementação local validada em 08/10/2026, exclusivamente na raiz QA Parallel Outputs, WS 14478 / API 18100. Motor testado SHA256 `93a5b57292104254da179cc4209974a312c7d37ac652eff9d9b7ba6508958a67`.

O motor oferece quatro slots por protocolo, com fonte UUID, nome e barramento M/A/B próprios. OMT nomeado usa um wrapper por instância do SDK oficial MIT v1.0.0.19; o sender original com nome vazio permanece compatível. NDI usa o plugin oficial existente. Cada envio de entrada própria pode preservar alpha BGRA 8 bits SDR. Reiniciar usa a configuração em execução daquele sender e preserva os demais. Nenhum envio inicia automaticamente.

Foram decodificados simultaneamente dois NDI e dois OMT com fontes distintas, áudio A=440 Hz / B=660 Hz, alpha transparente nas bordas e centro opaco. Receber novamente após desconectar funcionou em NDI e OMT. OMT informa conexões reais; NDI informa receptor desconhecido porque o plugin não expõe esse contador. Programa principal permaneceu intacto. Nomes ativos duplicados foram rejeitados.

Recibos: `qa-portatil/network-multiple-final-resultado.json` (11 checks de mídia), `network-multiple-stop-resultado.json` (5 checks), `network-multiple-contract.json` (6 checks). Os PNG/JSON de receptores ficam em `qa-portatil/network-independent-multindi*` e `network-independent-multiomt*`. A interface foi conferida pelo navegador isolado: Sender 4, entrada própria e alpha habilitado; estados dos oito slots apareceram corretamente, sem erro de console.

A primeira execução revelou um crash na enumeração de audio-monitor sem contexto de instância, corrigido pela frente de áudio com enumeração oficial libobs. A evidência inicial está em `qa-portatil/network-multiple-failure-190425/`. Um stop assíncrono ainda ativo foi corrigido nos helpers com espera bounded de até 3 segundos; a prova separada passou. QA PID 117812 salvou e encerrou normalmente; API privada PID 113040 também foi encerrada. Operador e API 8088 preservados.

Limites: quatro slots são capacidade implementada; o ensaio simultâneo cobriu dois por protocolo. Alpha integrado não equivale a Fill+Key SDI, HDR ou teste físico de rede. Áudio é o barramento selecionado, não extração automática da entrada de vídeo. AudioSource de submix independente novo ainda não está integrado nestas saídas. Endurance/WAN e equipamento físico continuam sem prova.

SDK e licença: `obs-vmix/licenses/freemix-omt-sdk/`; DLL oficial `obs-vmix/obs-plugins/64bit/libomt.dll`, SHA256 `673b1d33222295f1c9190c54cefc89d5e322301702532e2c8fe78a16e8aa28da`. Fontes oficiais: https://github.com/openmediatransport/libomtnet/releases .

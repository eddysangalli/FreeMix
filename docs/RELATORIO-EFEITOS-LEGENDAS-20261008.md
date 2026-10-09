# Efeitos e legendas locais — evidência isolada

Implementação funcional em `obs-vmix/ferramentas/efeitos-producao.mjs` e `obs-vmix/painel/remoto/efeitos.{html,js}`. O motor descobre os filtros realmente registrados; controles ficam indisponíveis quando o plugin ou modelo necessário não existe. Fontes de câmera compartilhadas não recebem filtros diretamente: os efeitos são aplicados à cena da entrada selecionada. Alternância por macro preserva parâmetros já ajustados.

## Implementado e comprovado

- Blur gaussiano com raio, direções, qualidade e limites de área. Shader oficial `gaussian-blur-advanced.shader`; prova nativa com pixels modificados e energia de gradiente reduzida.
- Painel 3D com perspectiva XYZ, posição, escala, espessura, cantos, luz e movimento suave. Shader oficial `3d-panel.shader`; prova nativa de renderização distinta. É um cartão 3D, não um editor completo de objetos/cenas 3D.
- Face Tracker com tamanho/posição do rosto, zoom máximo, resposta PID e orientação horizontal/vertical/quadrada. Detector local HOG reconheceu o rosto de uma imagem anexada pelo usuário e reenquadrou a entrada com pixels reais, preservando a fonte compartilhada. Nenhum PTZ/hardware foi acionado.
- LocalVocal CPU + modelo Whisper tiny multilíngue local: áudio público selecionado gera texto em uma fonte OBS. Criar legenda deixa a nova fonte selecionada. Ativar reconhecimento não coloca a legenda no Programa; a entrada pode ser escolhida como overlay pelo operador.
- Mic privado do diretor é excluído usando também o UUID nativo de talkback, mesmo quando o estado JS ainda não possui o diretor. Tradução/cloud, captions diretas de stream, WebVTT e gravação de texto ficam desligados pela configuração aplicada.

## Recibos

- `efeitos-logica.json`: 4 PASS — limites, toggle preserva parâmetros, exclusão real do mic privado e rejeição de legenda privada.
- `efeitos-nativo.json`: 6 PASS — plugins/modelo presentes, blur/perspectiva reais, isolamento da fonte e configuração vertical do tracker.
- `tracking-facial-nativo.json`: 3 PASS — 718 pixels verdes/512 azuis de caixas reais, reenquadramento com diferença média 16,36 e câmera sem filtro.
- `legendas-offline-nativo.json`: 3 PASS — inferência CPU reconheceu fragmento de fala sintética inglesa (`This, welcome to F`), filtro desativado e português configurado sem cloud.
- `efeitos-ui.json`/`efeitos-ui.png`: conferência da interface integrada; recibo final contém somente resultados efetivamente confirmados.
- `efeitos-inventario-copia.json`: 249 arquivos/387 MiB, origem absoluta, destino relativo e SHA256 de cada arquivo para staging/pacote. Preserva dependências, dados e licenças.

## Proveniência

Plugins oficiais: [Shaderfilter 2.6.0](https://github.com/exeldro/obs-shaderfilter/releases/tag/2.6.0), [Face Tracker 0.9.1](https://github.com/norihiro/obs-face-tracker/releases/tag/0.9.1), [LocalVocal 0.6.2 CPU](https://github.com/royshil/obs-localvocal/releases/tag/0.6.2). SHA256 dos ZIPs correspondem aos digests publicados do GitHub, preservados em `efeitos-provenance/downloads.json`.

Modelo [Whisper tiny multilíngue](https://huggingface.co/ggerganov/whisper.cpp/blob/main/ggml-tiny.bin): SHA256 `be07e048e1e599ad46341c8d2a135645097a538221678b7acdd1b1919c6e1b21` coincide com o LFS upstream. Licença MIT do Whisper preservada. Modelos HOG/CNN/5 pontos do Face Tracker incluem a licença upstream; modelo 68 pontos não comercial não foi incluído.

## Limites restantes

A prova de tracking usa uma imagem local, não um ensaio prolongado de locutor em movimento. Reconhecimento de fala portuguesa ainda não foi medido; o modelo é multilíngue e o idioma foi configurado no filtro real, mas a prova de texto usou voz sintética inglesa. Qualidade, latência e concorrência de filtros dependem do CPU/GPU. Não há tradução cloud, PTZ físico, editor universal 3D ou homologação de palco/câmeras. Plugins foram instalados apenas na raiz QA privada; a instalação do operador não foi modificada. Integração e empacotamento finais são da raiz coordenadora.

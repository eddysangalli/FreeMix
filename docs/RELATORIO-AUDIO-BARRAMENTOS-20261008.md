# Áudio: submix independente, Direct Out e ASIO

Implementação real em `FreeMixAudioRouting.cpp/.hpp`, `audio-buses-producao.mjs`, integração de `audio-routing-producao.mjs` e tela `audio.html`/`audio-buses.js`. Registro idempotente no Init e no vendor; entradas e metadados persistem por coleção/UUID.

Até oito submixes estéreo, com até 32 fontes públicas e ganho individual 0–2. O motor captura áudio pós-filtro/volume, alinha os relógios, mistura com buffer de 50 ms, limita amostras a -1..1 e começa sem trilhas globais. Encaminhamento explícito para M/A/B pelas pré-trilhas 4/5/6; Direct Out pelo filtro Audio Monitor em dispositivo WASAPI enumerado pelo libobs, com nível e atraso individuais. Fontes isoladas com mixers=0 mantêm lease de ativação; fontes compartilhadas com trilhas globais seguem a cena existente para evitar abrir áudio no Master automaticamente. Ciclos, buses, retornos e microfone privado são recusados. Quando fonte vira diretor, buffer anterior é limpo. Direct Out valida o UUID do diretor real, mesmo com contexto de UI antigo.

Foi encontrado crash real ao enumerar `obs_get_source_properties("audio_monitor")`: o plugin oficial dereferencia contexto NULL. Corrigido usando `obs_enum_audio_monitoring_devices`, sem acessar propriedades do filtro sem instância. Build central final fornecido pela raiz; ensaio depois da correção passou.

ASIO: pacote oficial `v3.2.1f`, ZIP SHA256 `cb9606decbcec0c71bf2a1c161b1121f6efac18627f532a6c380ae49fbc1b247`, coincide com checksum publicado. DLL carregada na QA OBS32.2.2. Enumeração real encontrou Realtek ASIO, Soundcraft USB Audio ASIO, US-1800 e X-AIR ASIO Driver. A tela seleciona driver/canais esquerdo/direito e cria captura estéreo, valida canais reais retornados pelo driver antes de abrir a fonte. ASIO é captura; saída direta permanece WASAPI. Não se afirma reprodução ASIO.

## Evidências

- `audio-avancado-logica.json`: 4 PASS: privacidade/ciclos, ganhos, filtro criado silencioso, ausência de driver recusa criação.
- `audio-avancado-nativo.json`: 10 PASS: motor/plugin; source sem trilhas; PCM estéreo real; ganho dobra pico 0.044189→0.088379; ciclo recusado; A/B reais; filtro Direct Out desligado com atraso125ms; fonte privada pico0; privado recusado. UI alterou atraso para200ms confirmado diretamente no filtro nativo.
- `audio-avancado-privado-nativo.json`: 2 PASS: diretor real excluído mesmo com contexto antigo, Direct Out recusado antes da criação de filtro.
- `audio-avancado-ui.json` + `audio-avancado-ui.png`: formulário operacional, três dispositivos WASAPI e quatro drivers reais, alteração por formulário confirmada no motor.
- QA exclusiva WS14476/API18098, sem tráfego externo, sem tocar operador. Fontes/bus/filtro de teste removidos e encerramento normal guardado em `audio-avancado-qa-fechada.json`.

## Limites

Captura física de placas ASIO, canais conectados, saída acústica WASAPI, latência do dispositivo e resistência prolongada dependem dos equipamentos. Nenhum som foi aberto em dispositivo físico durante a QA: Direct Out permaneceu desligado. Submixes ainda não são fontes de áudio independentes dos encoders extras/NDI/OMT; esses destinos mantêm o contrato M/A/B. O software não inclui saída ASIO nem seleção multicanal além da captura estéreo. Fontes compartilhadas fora da cena e roteadas às trilhas globais não são forçadas ativas pelo bus.

## Pacote oficial a incluir pela raiz

Copiar `qa-portatil/audio-avancado-provenance/asio-binary/obs-plugins/64bit/obs-asio.dll`, dados `data/obs-plugins/obs-asio/locale/en-US.ini`, licença `asio-LICENSE` e proveniência `asio-download.json`; plugin foi instalado somente na QA nesta frente. Nenhum driver de hardware foi instalado ou alterado.

Fontes primárias: https://github.com/Andersama/obs-asio/releases/tag/v3.2.1f e https://github.com/exeldro/obs-audio-monitor.

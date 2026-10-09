# Plugins de automação e legendas — 08/10/2026

Instalados de forma portátil, sem alterar configurações, fontes ou regras do operador: Advanced Scene Switcher 1.36.1 e Cloud Closed Captions 0.33. Foram adicionados 82 arquivos (192.389.239 bytes), sem PDB, em `data/obs-plugins/advanced-scene-switcher`, `obs-plugins/64bit/advanced-scene-switcher*.dll`, sua pasta privada de extensões/dependências e `obs-plugins/64bit/obs_google_caption_plugin.dll`. Não foram substituídas DLLs do motor, Qt ou SSL. O acesso aos menus originais está disponível pela categoria Plugins na central Configurações, pela ponte nativa integrada pela frente principal.

## Origem, compatibilidade e licenças

- [Advanced Scene Switcher 1.36.1](https://github.com/WarmUpTill/SceneSwitcher/releases/tag/1.36.1), commit `29e07ce63a8df145151715d971c5c788dd2ed7ef`, exige OBS 31.1.1 ou superior. ZIP portátil oficial: SHA256 `8a7f5fd705863c0cf239f294a0877a7cf0094c0ee053fb420fc527bd5b7a8cc4`. Licença GPL-2.0 e avisos de dependências preservados; [instalação oficial](https://github.com/WarmUpTill/SceneSwitcher/wiki/Installation).
- [Closed Captions v0.33](https://github.com/ratwithacompiler/OBS-captions-plugin/releases/tag/v0.33), commit `ce3a76cb096695e46d64b69a7819f7c291de376b`, suporta OBS 32 e requer no mínimo OBS 30. ZIP oficial: SHA256 `c394a1faa258808f6c58fdef59e6fac7d5d863f62e11d4149282307ff986f656`. Licença GPL-2.0 preservada. O fórum ainda apresenta uma versão antiga; a versão usada é a publicação oficial do autor no GitHub.
- O motor real foi consultado via `GetVersion`: OBS 32.2.2, obs-websocket 5.7.4, Windows x64. O log de teste mostra inicialização dos dois módulos e todas as extensões ADV, sem erro de carregamento desses plugins. A linha que ignora `advanced-scene-switcher-lib.dll` como módulo OBS é esperada: é uma biblioteca auxiliar, carregada pelo plugin.

As fontes acompanham `licenses/advanced-scene-switcher/advanced-scene-switcher-1.36.1-source.tar.xz` (481.141.292 bytes; SHA256 `1e8c66e18c1d999c47f1e69a3978df3121a5d1ebaf5d77cdae7d73d062d53ce2`), distribuição oficial incluindo 24.867 arquivos, CMake e fontes nos 14 diretórios de dependências. `licenses/obs-google-caption-plugin/OBS-captions-plugin-v0.33-source.zip` contém a árvore completa da tag, 16 arquivos C++ e scripts de build, sem submódulos ausentes; SHA256 `efe89bbde052b3061fd0fe9aefbf00c099b35d36d234ff1972abccec9209b1bb`. Os arquivos `source-provenance.json` registram origem, hashes e inspeção. Não foi recompilado nenhum desses plugins nem demonstrada reprodução binária idêntica; dependências de toolchain/OBS/Qt e opções de API são requisitos de uma recompilação.

## Inicialização e preservação

O ADV original define `active=true` quando não encontra configuração. Em novas coleções, a integração principal preenche apenas namespaces ausentes em `modules`:

```json
{
  "advanced-scene-switcher": {"active": false, "startup_behavior": 2, "autoStartEvent": 0},
  "cloud_closed_caption_rat": {"enabled": false}
}
```

`startup_behavior=2` corresponde a STOP; 0 é PERSIST e 1 é START. Configurações já existentes do operador são preservadas. Essa regra de defaults é do preparador principal; os plugins não foram modificados. No ensaio isolado, o salvamento real da coleção manteve `active=false`, STOP e `enabled=false`. Nenhuma macro ADV ou serviço de reconhecimento foi iniciado. O pacote ADV inclui modelo Whisper tiny e dados OCR locais; não foi configurado download de modelo nem uma regra que os execute.

O código do CaptionPluginManager exige `enabled=true` antes de chamar `start_caption_stream`. A instalação permanece desligada. Esse plugin usa a implementação antiga Google HTTP; seu CMake referencia `www.google.com` e portas 80. O funcionamento, privacidade do tráfego, disponibilidade da API e credenciais do serviço não foram validados. Não enviamos áudio, não configuramos microfone ou chave, nem afirmamos reconhecimento operacional. Ativar legendas Google exige uma decisão posterior do operador e validação desse caminho externo.

## Evidência executada

Raiz exclusiva `C:/Users/eddyr/AppData/Local/Temp/FreeMix-QA-Recovery-20261008`, WS 14479/API 18104. O teste confirmou identidade do motor/API, saídas inativas, carregamento dos módulos, salvamento dos defaults e fechamento apenas dos processos dessa raiz. A instância do operador não foi fechada nem reconfigurada.

- `qa-portatil/plugins-automacao/resultado-nativo.json`: três verificações de carregamento e persistência. A cópia inicial ainda não tinha a nova ponte Tools; essa limitação está explicitamente registrada nesse recibo.
- `qa-portatil/plugins-automacao/resultado-tools.json`: prova curta posterior com executável de build SHA256 `123e55f0bfb480a85e12047b6887cb5c68c5abf4cd58d764f4c995ae62282fed`; lista original inclui “Troca Avançada de Cenas” e “Cloud Closed Captions”, ambos habilitados. ID/label inválidos foram recusados. Abrir ADV retornou `scheduled=true/success=true`, enfileirando a QAction Qt. Não há afirmação de aprovação visual do diálogo nem teste do reconhecimento.
- `qa-portatil/plugins-automacao/encerramento.json`: processos isolados encerrados após salvar; `operatorTouched=false`.
- `qa-portatil/plugins-automacao/instalacao.json`, `artefatos.json`, `source-conteudo.json`: inventário, hashes oficiais e conteúdo das fontes.

Permanecem testes de regras ADV escolhidas pelo operador, dispositivos MIDI/Stream Deck/USB, OCR/Whisper em máquina real, reconhecimento/legendas Google e aceitação visual das janelas. Carregamento e acesso não substituem esses testes funcionais. Não foi gerado pacote nesta frente; a frente principal inclui os arquivos e fontes na entrega.

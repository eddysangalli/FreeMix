import fs from 'fs';
import path from 'path';

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  const replacements = [
    ['Basic.MainMenu.File="Produção (&P)"', 'Basic.MainMenu.File="&Presets"'],
    ['Basic.MainMenu.File.Settings="Configurações... (&,)"', 'Basic.MainMenu.File.Settings="Configurações do Estúdio... (&C)"'],
    ['Basic.MainMenu.SceneCollection="Coleção de entrada&s"', 'Basic.MainMenu.SceneCollection="&Cenas / Presets"'],
    ['Basic.MainMenu.Profile="&Perfil"', 'Basic.MainMenu.Profile="&Perfis de Saída / Stream"'],
    ['Basic.MainMenu.Edit="&Entradas"', 'Basic.MainMenu.Edit="&Entradas & Edição"'],
    ['Basic.MainMenu.View="&Layout"', 'Basic.MainMenu.View="&Visualização & Telas"'],
    ['Basic.MainMenu.Docks="&Saídas e Painéis"', 'Basic.MainMenu.Docks="&Painéis do Estúdio"'],
    ['Basic.MainMenu.Tools="&Ferramentas"', 'Basic.MainMenu.Tools="&Ferramentas Broadcast"'],
    ['Basic.MainMenu.Help="A&juda"', 'Basic.MainMenu.Help="&Ajuda FreeMix"'],
    [/OBS Studio/g, 'FreeMix Studio'],
    [/OBS já está em execução/g, 'FreeMix Studio já está em execução'],
    [/o OBS foi/g, 'o FreeMix foi'],
    [/instalação do OBS/g, 'instalação do FreeMix'],
    [/com o OBS configurado/g, 'com o FreeMix Studio configurado'],
    [/Gravação do OBS/g, 'Gravação do FreeMix'],
    [/vez que o OBS foi usado/g, 'vez que o FreeMix foi usado'],
    [/O OBS encontrou/g, 'O FreeMix encontrou'],
    [/enquanto o OBS estiver/g, 'enquanto o FreeMix Studio estiver'],
    [/resolução do OBS/g, 'resolução do FreeMix'],
    [/janelas do FreeMix na captura de tela/g, 'Esconder janelas do FreeMix Studio na captura'],
    [/FreeMix é um ambiente de produção ao vivo baseado em OBS Studio\./g, 'FreeMix Studio — Sistema Profissional de Produção e Transmissão Broadcast.'],
    [/URL para o OBS/g, 'URL para o FreeMix Studio'],
    [/coleções do OBS/g, 'coleções do FreeMix'],
    [/que o OBS seja reiniciado/g, 'que o FreeMix Studio seja reiniciado'],
    [/deseja reiniciar o OBS/g, 'deseja reiniciar o FreeMix Studio'],
    [/vídeo do OBS/g, 'vídeo do FreeMix']
  ];

  for (const [from, to] of replacements) {
    content = typeof from === 'string' ? content.split(from).join(to) : content.replace(from, to);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[OK] Patch aplicado em: ${filePath}`);
}

const target1 = path.resolve('obs-vmix/data/obs-studio/locale/pt-BR.ini');
const target2 = path.resolve('FreeMix/config/locale/pt-BR.ini');

patchFile(target1);
patchFile(target2);

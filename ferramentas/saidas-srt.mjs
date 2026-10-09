// Destination-only SRT format contract. No shared/global video settings are altered.
export function srtDestinationOptions(data,before={},capabilities={}){
 const chroma=data.chroma===undefined?(before.chroma??'420'):data.chroma,alphaMode=data.alphaMode===undefined?(before.alphaMode??'none'):data.alphaMode;
 if(!['420','444'].includes(chroma)||!['none','packed'].includes(alphaMode))throw Error('Selecione 4:2:0/4:4:4 e um modo de alpha válido');
 if(chroma==='420'&&alphaMode==='none')return{chroma,alphaMode};
 const protocol=data.protocol??before.protocol??'auto',server=String(data.server??before.server??''),effective=protocol==='auto'?server.split(':')[0].toLowerCase():protocol,encoder=data.encoder??before.encoder??'obs_x264',width=Number(data.width??before.width);
 if(effective!=='srt')throw Error('4:4:4 e cor + máscara exigem um destino SRT');
 if(!capabilities.srtChroma444Supported)throw Error('Este motor não oferece a saída SRT 4:4:4; atualize o motor antes de selecionar este formato');
 if(encoder!==(capabilities.srt444Encoder||'obs_x264'))throw Error('SRT 4:4:4 usa somente x264 H.264 nesta versão; selecione o codificador x264');
 if(alphaMode==='packed'){
  if(chroma!=='444')throw Error('Cor + máscara exige 4:4:4 para preservar a máscara');
  if(!capabilities.srtPackedAlphaSupported)throw Error('Este motor não oferece cor + máscara para SRT');
  const max=Number(capabilities.srtPackedAlphaMaxWidth)||1920;if(!Number.isInteger(width)||width<240||width>max)throw Error('Cor + máscara: a largura lógica deve ser de 240 até '+max+' pixels; o transporte usa o dobro da largura');
 }
 return{chroma,alphaMode};
}

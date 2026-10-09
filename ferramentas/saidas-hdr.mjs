// Capabilities of the integrated paths, not a claim about the whole protocol.
// NDI standard SDK 6 cannot send HDR metadata; OMT has manual HDR workflows,
// but our PA16 renderer currently produces BT.709 SDR.
export const outputHdrContracts = Object.freeze({
 NDI:Object.freeze({hdrSupported:false,status:'requires_ndi_advanced_sdk_and_hdr_renderer',reason:'Envio HDR NDI exige NDI Advanced SDK licenciado e render PQ/HLG. Esta saída usa BT.709 SDR8.',reference:'https://docs.ndi.video/all/developing-with-ndi/sdk/hdr'}),
 OMT:Object.freeze({hdrSupported:false,status:'sdr_path_use_separate_manual_hdr_output',separateHdrAction:'outputs_omt_hdr',reason:'Estes controles OMT produzem BT.709 SDR, inclusive PA16. Para vídeo HDR opaco, abra OMT HDR abaixo: fonte HDR real e PQ/HLG correspondente configurado manualmente no receptor.',reference:'https://github.com/openmediatransport/omtplugin/blob/master/README.md'}),
 SDI:Object.freeze({hdrSupported:false,status:'sdr_path_use_explicit_driver_preflight_hdr',separateHdrAction:'outputs_sdi',reason:'Os controles padrão SDI usam SDR. Abra SDI HDR para uma fonte HDR própria, PQ/HLG e metadados confirmados. O driver precisa aceitar SDI/Rec.2020/RGB10/metadados; a placa e o receptor requerem homologação física.'}),
 SRT:Object.freeze({hdrSupported:false,status:'independent_destination_hdr_not_implemented',reason:'Esta saída independente usa SDR8. HDR SRT exige render P010/PQ ou HLG, encoder 10 bits compatível e validação dos metadados no receptor.'})
});

export function assertSdrOutputRequest(protocol,options={}){
 const key=String(protocol).toUpperCase(),contract=outputHdrContracts[key]||outputHdrContracts.SRT;
 if(options.hdr!==undefined&&typeof options.hdr!=='boolean')throw Error('HDR deve ser uma opção booleana');
 const transfer=String(options.transfer??'sdr').toLowerCase();
 const colorSpace=String(options.colorSpace??'bt709').toLowerCase();
 if(options.hdr===true||!['sdr','bt709','bt_709','709',''].includes(transfer)||!['sdr','bt709','bt_709','709','rec709',''].includes(colorSpace))
  throw Object.assign(Error(contract.reason),{code:'OUTPUT_HDR_UNSUPPORTED',protocol:key,hdrContract:contract});
}

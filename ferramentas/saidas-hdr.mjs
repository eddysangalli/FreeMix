// Capabilities of the integrated paths, not a claim about the whole protocol.
// NDI standard SDK 6 cannot send HDR metadata; OMT has manual HDR workflows,
// but our PA16 renderer currently produces BT.709 SDR.
export const outputHdrContracts = Object.freeze({
 NDI:Object.freeze({hdrSupported:false,status:'requires_ndi_advanced_sdk_and_hdr_renderer',reason:'Envio HDR NDI exige NDI Advanced SDK licenciado e render PQ/HLG. Esta saída usa BT.709 SDR8.',reference:'https://docs.ndi.video/all/developing-with-ndi/sdk/hdr'}),
 OMT:Object.freeze({hdrSupported:false,status:'integrated_renderer_sdr_manual_hdr_not_implemented',reason:'Esta saída OMT produz BT.709 SDR, inclusive PA16. HDR exige render PQ/HLG e configuração compatível no receptor; o protocolo atual não anuncia a transferência automaticamente.',reference:'https://github.com/openmediatransport/omtplugin/blob/master/README.md'}),
 SDI:Object.freeze({hdrSupported:false,status:'unsupported_in_integrated_sdr_path',reason:'A saída SDI integrada usa SDR. HDR exige caminho PQ, metadados e dispositivo/driver homologados na ferramenta DeckLink original.'}),
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

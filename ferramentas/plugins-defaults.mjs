// New plugin namespaces start stopped. Existing operator settings are never overwritten.
export function pluginDefaults(collection,{advancedSceneSwitcher=false,cloudCaptions=false}={}){
 if(!collection||typeof collection!=='object'||Array.isArray(collection))throw Error('Coleção inválida para preparar plugins');
 if(collection.modules!==undefined&&(!collection.modules||typeof collection.modules!=='object'||Array.isArray(collection.modules)))throw Error('Módulos da coleção inválidos; plugins não preparados');
 const result=structuredClone(collection),modules=result.modules||{},added=[];
 if(advancedSceneSwitcher&&!Object.hasOwn(modules,'advanced-scene-switcher')){modules['advanced-scene-switcher']={active:false,startup_behavior:2,autoStartEvent:0};added.push('advanced-scene-switcher');}
 if(cloudCaptions&&!Object.hasOwn(modules,'cloud_closed_caption_rat')){modules.cloud_closed_caption_rat={enabled:false};added.push('cloud_closed_caption_rat');}
 if(added.length)result.modules=modules;
 return {collection:result,added};
}

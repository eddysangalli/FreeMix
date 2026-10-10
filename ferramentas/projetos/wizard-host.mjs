import {createProjectProvisioner} from './project-provisioner.mjs';
const fail=code=>{throw Object.assign(Error(code),{code});};
// Root exposes these methods through authenticated central routes. No endpoint is presumed present.
export function createWizardHost({previewAdapter,discovery,getConnection,...applyDependencies}){
 let scannedConnection=null;
 const readPreviewContext=async()=>{
  const base=await previewAdapter.readPreviewContext(),cached=discovery?.getCached();
  if(cached&&scannedConnection===getConnection())base.inventory=cached;
  base.context.applicationSupported=applyDependencies.executionEnabled===true;
  base.context.discoverySupported=applyDependencies.discoveryEnabled===true;
  if(!base.context.discoverySupported)base.inventory.reason="Descoberta física ainda não qualificada neste host. Use Escolher câmera para espaços vazios; nenhuma captura será inventada.";
  return base;
 };
 const provisioner=createProjectProvisioner({...applyDependencies,getConnection,readPreviewContext});
 return Object.freeze({readPreviewContext,previewProject:provisioner.previewProject,applyProject:provisioner.applyProject,
  async scanDevices(consent){if(applyDependencies.discoveryEnabled!==true)fail("DISCOVERY_HELPER_UNQUALIFIED");const connection=getConnection();await discovery.scan(consent);if(connection!==getConnection())fail('CONNECTION_CHANGED');scannedConnection=connection;return readPreviewContext();}
 });
}

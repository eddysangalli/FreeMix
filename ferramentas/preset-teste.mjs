// Small helper of test-fechar.ps1: add / del / has <scene name>, or save (the program's Save request).
import { connect } from "./obsws.mjs";
const [, , cmd, name] = process.argv, obs = await connect();
if (cmd === "add") { await obs.tryReq("CreateScene", { sceneName: name }); console.log("criada"); }
else if (cmd === "del") { await obs.tryReq("RemoveScene", { sceneName: name }); console.log("removida"); }
else if (cmd === "has") console.log((await obs.req("GetSceneList")).scenes.some((s) => s.sceneName === name) ? "sim" : "nao");
else if (cmd === "save") console.log((await obs.tryReq("CallVendorRequest", { vendorName: "freemix", requestType: "save_preset", requestData: {} }))?.responseData?.success ? "salvo" : "falhou");
obs.close();

// Uses the original OBS DeckLink output; only advertised devices/modes/keyers.
#pragma once
#include "FreeMixVideoTransports.hpp"
#include "FreeMixAudioRouting.hpp"
#include <obs-frontend-api.h>
#include <QDir>
#include <string>
#include <memory>
namespace freemix_sdi {
inline OBSOutputAutoRelease &Output(){static OBSOutputAutoRelease value;return value;}
inline obs_view_t *&View(){static obs_view_t *value=nullptr;return value;}
inline OBSSceneAutoRelease &Scene(){static OBSSceneAutoRelease value;return value;}
inline std::unique_ptr<FreeMixSourceAudio> &Audio(){static std::unique_ptr<FreeMixSourceAudio> value;return value;}
inline void Stop(){if(Output()&&obs_output_active(Output()))obs_output_force_stop(Output());Output()=nullptr;Audio().reset();if(View()){obs_view_remove(View());obs_view_set_source(View(),0,nullptr);obs_view_destroy(View());View()=nullptr;}Scene()=nullptr;}
inline std::string Path(){char *folder=obs_frontend_get_current_profile_path();const std::string path=folder?std::string(folder)+"/freemix-sdi.json":"";bfree(folder);return path;}
inline void Request(obs_data_t *request,obs_data_t *response,bool (*isPrivate)(obs_source_t *)){
 const std::string action=obs_data_get_string(request,"action"),path=Path();OBSDataAutoRelease config=path.empty()?nullptr:obs_data_create_from_json_file(path.c_str());if(!config)config=obs_data_create();
 std::string error;const bool active=Output()&&obs_output_active(Output());
 if(action=="configure"){
  if(active)error="Pare SDI antes de configurar";
  else{OBSDataAutoRelease proposed=obs_data_get_obj(request,"config");if(!proposed)error="Configuração SDI ausente";else{
   OBSDataAutoRelease transports=FreeMixVideoTransports(),deck=obs_data_get_obj(transports,"decklink");OBSDataArrayAutoRelease devices=obs_data_get_array(deck,"devices");bool valid=false;
   for(size_t n=0;n<obs_data_array_count(devices);n++){OBSDataAutoRelease device=obs_data_array_item(devices,n);if(std::string(obs_data_get_string(device,"hash"))!=obs_data_get_string(proposed,"deviceHash"))continue;OBSDataArrayAutoRelease modes=obs_data_get_array(device,"modes"),keyers=obs_data_get_array(device,"keyers");bool mode=false,key=false;for(size_t i=0;i<obs_data_array_count(modes);i++){OBSDataAutoRelease v=obs_data_array_item(modes,i);mode|=obs_data_get_int(v,"value")==obs_data_get_int(proposed,"modeId");}for(size_t i=0;i<obs_data_array_count(keyers);i++){OBSDataAutoRelease v=obs_data_array_item(keyers,i);key|=obs_data_get_int(v,"value")==obs_data_get_int(proposed,"keyer");}valid=mode&&key;}
   OBSSourceAutoRelease selected=obs_get_source_by_uuid(obs_data_get_string(proposed,"sourceUuid"));
   if(selected&&isPrivate(selected))error="SDI recusado: fonte contém áudio privado";
   else if(!valid)error="Dispositivo, modo FPS ou keyer SDI não anunciado pelo driver";
   else if(obs_data_get_bool(proposed,"hdr"))error="HDR SDI requer a ferramenta original e homologação do dispositivo; esta rota preserva SDR";
   else if(obs_data_get_int(proposed,"audioTrack")<0||obs_data_get_int(proposed,"audioTrack")>2)error="Áudio SDI deve ser Master/A/B ou UUID de bus isolado";
   else{config=obs_data_get_obj(request,"config");obs_data_erase(config,"active");obs_data_set_bool(config,"autoStart",false);if(path.empty()||!obs_data_save_json_safe(config,path.c_str(),"tmp","bak"))error="Não foi possível salvar configuração SDI no perfil";}
  }}
 }else if(action=="start"){
  if(!active){OBSDataAutoRelease validate=obs_data_create(),validated=obs_data_create();obs_data_set_string(validate,"action","configure");obs_data_set_obj(validate,"config",config);Request(validate,validated,isPrivate);if(!obs_data_get_bool(validated,"success"))error=obs_data_get_string(validated,"error");
   if(error.empty()){Stop();OBSDataAutoRelease settings=obs_data_create();obs_data_set_string(settings,"device_hash",obs_data_get_string(config,"deviceHash"));obs_data_set_int(settings,"mode_id",obs_data_get_int(config,"modeId"));obs_data_set_int(settings,"keyer",obs_data_get_int(config,"keyer"));obs_data_set_bool(settings,"force_sdr",true);obs_data_set_bool(settings,"auto_start",false);video_t *video=obs_get_video();const std::string uuid=obs_data_get_string(config,"sourceUuid"),audioUuid=obs_data_get_string(config,"audioSourceUuid");
    if(!uuid.empty()){OBSSourceAutoRelease source=obs_get_source_by_uuid(uuid.c_str());obs_video_info info={};if(!source||!obs_get_video_info(&info))error="Fonte SDI ausente";else{info.base_width=info.output_width=obs_source_get_width(source);info.base_height=info.output_height=obs_source_get_height(source);info.output_format=VIDEO_FORMAT_BGRA;info.colorspace=VIDEO_CS_709;info.range=VIDEO_RANGE_FULL;if(!info.base_width||!info.base_height||info.base_width>3840||info.base_height>3840)error="Dimensões SDI inválidas";else{Scene()=obs_scene_create_private("FreeMix SDI scene");if(!obs_scene_add(Scene(),source))error="Não foi possível criar cena SDI";else{View()=obs_view_create();obs_view_set_source(View(),0,obs_scene_get_source(Scene()));video=obs_view_add2(View(),&info);if(!video)error="View SDI indisponível";}}}}
    if(error.empty()&&!audioUuid.empty())Audio()=FreeMixSourceAudio::Open(audioUuid,"FreeMix SDI PCM",error);
    if(error.empty()){Output()=obs_output_create("decklink_output","FreeMix SDI Output",settings,nullptr);if(!Output())error="Plugin DeckLink indisponível";else{obs_output_set_media(Output(),video,Audio()?Audio()->Audio():obs_get_audio());obs_output_set_mixers(Output(),Audio()?1ULL:1ULL<<uint32_t(obs_data_get_int(config,"audioTrack")));if(!obs_output_start(Output()))error="Driver não iniciou SDI; confira dispositivo e modo/FPS";}}
    if(!error.empty())Stop();
   }
  }
 }else if(action=="stop")Stop();else if(action!="state")error="Ação SDI inválida";
 obs_data_set_bool(response,"success",error.empty());if(!error.empty())obs_data_set_string(response,"error",error.c_str());obs_data_set_bool(response,"active",Output()&&obs_output_active(Output()));obs_data_set_obj(response,"config",config);OBSDataAutoRelease transports=FreeMixVideoTransports();obs_data_set_obj(response,"capabilities",transports);obs_data_set_bool(response,"autoStart",false);
}
}

// Query the original OBS DeckLink plugin. No output is created or started.
#pragma once
#include <obs.hpp>
#include <obs-properties.h>
#include <string>

inline OBSDataAutoRelease FreeMixVideoTransports()
{
 OBSDataAutoRelease result=obs_data_create(),decklink=obs_data_create();
 const char *id=nullptr;bool loaded=false;
 for(size_t n=0;obs_enum_output_types(n,&id);++n)if(std::string(id)=="decklink_output"){loaded=true;break;}
 obs_data_set_bool(decklink,"pluginLoaded",loaded);
 obs_data_set_string(decklink,"outputId","decklink_output");
 obs_data_set_string(decklink,"configuration","native-tools-decklink");
 obs_data_set_string(decklink,"hdrStatus","requires_explicit_driver_preflight");
 obs_data_set_bool(decklink,"hdrSupported",false);
 OBSDataArrayAutoRelease devices=obs_data_array_create();
 // decklink_output_properties explicitly ignores context (original OBS source).
 obs_properties_t *props=loaded?obs_get_output_properties("decklink_output"):nullptr;
 obs_data_set_bool(decklink,"hdrOutputImplemented",props&&obs_properties_get(props,"freemix_hdr_contract"));
 obs_data_set_bool(decklink,"hdrPhysicalVerified",false);
 obs_property_t *list=props?obs_properties_get(props,"device_hash"):nullptr;
 if(list)for(size_t n=0;n<obs_property_list_item_count(list)&&n<64;++n){
  const char *hash=obs_property_list_item_string(list,n);
  if(!hash||!*hash||obs_property_list_item_disabled(list,n))continue;
  const char *displayName=obs_property_list_item_name(list,n);
  const std::string deviceHash=hash,deviceName=displayName?displayName:hash;
  OBSDataAutoRelease device=obs_data_create(),settings=obs_data_create();
  obs_data_set_string(device,"hash",deviceHash.c_str());obs_data_set_string(device,"name",deviceName.c_str());
  obs_data_set_string(settings,"device_hash",deviceHash.c_str());obs_properties_apply_settings(props,settings);
  OBSDataArrayAutoRelease modes=obs_data_array_create(),keyers=obs_data_array_create();
  for(const char *key:{"mode_id","keyer"}){
   auto *options=obs_properties_get(props,key);if(!options)continue;
   for(size_t i=0;i<obs_property_list_item_count(options)&&i<256;++i){
    if(obs_property_list_item_disabled(options,i))continue;OBSDataAutoRelease item=obs_data_create();
    obs_data_set_int(item,"value",obs_property_list_item_int(options,i));obs_data_set_string(item,"name",obs_property_list_item_name(options,i));
    obs_data_array_push_back(std::string(key)=="keyer"?keyers:modes,item);
   }
  }
  OBSDataArrayAutoRelease hdrModes=obs_data_array_create();auto *hdrOptions=obs_properties_get(props,"freemix_hdr_modes");if(hdrOptions)for(size_t i=0;i<obs_property_list_item_count(hdrOptions)&&i<256;++i){if(obs_property_list_item_disabled(hdrOptions,i))continue;OBSDataAutoRelease row=obs_data_create();obs_data_set_int(row,"value",obs_property_list_item_int(hdrOptions,i));obs_data_set_string(row,"name",obs_property_list_item_name(hdrOptions,i));obs_data_array_push_back(hdrModes,row);}
  obs_data_set_array(device,"hdrModes",hdrModes);obs_data_set_array(device,"modes",modes);obs_data_set_array(device,"keyers",keyers);obs_data_array_push_back(devices,device);
 }
 if(props)obs_properties_destroy(props);
 obs_data_set_array(decklink,"devices",devices);obs_data_set_bool(decklink,"hardwareAvailable",obs_data_array_count(devices)>0);
 obs_data_set_obj(result,"decklink",decklink);
 obs_data_set_int(result,"networkPrecisionBits",8);obs_data_set_string(result,"networkColorSpace","BT709 SDR");
 obs_data_set_bool(result,"networkHdrSupported",false);obs_data_set_bool(result,"networkHighPrecisionAlpha",false);
 return result;
}

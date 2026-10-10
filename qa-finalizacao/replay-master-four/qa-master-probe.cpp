// QA ONLY: final digital mix 0 capture. Never ship or load in operator root.
#include <obs-module.h>
#include <obs-websocket-api.h>
#include <util/platform.h>
#include <vector>
#include <string>
#include <mutex>
#include <cstdio>
#include <cstdlib>
#include <cstring>
OBS_DECLARE_MODULE()
MODULE_EXPORT const char *obs_module_description(void){return "Private QA final Master PCM probe";}
struct Packet{uint64_t timestamp,wall;uint32_t frames;};
static std::vector<float> left,right;static std::vector<Packet> packets;
static size_t samples=0,count=0;static bool overflow=false,connected=false;
static std::string directory;static uint32_t rate;static std::mutex controls;
static obs_view_t *view=nullptr;
static void callback(void *,size_t mix,audio_data *data){
 if(mix!=0||!data||!data->data[0]||!data->data[1])return;
 if(samples+data->frames>left.size()||count==packets.size()){overflow=true;return;}
 std::memcpy(left.data()+samples,data->data[0],data->frames*sizeof(float));
 std::memcpy(right.data()+samples,data->data[1],data->frames*sizeof(float));
 samples+=data->frames;packets[count++]={data->timestamp,os_gettime_ns(),data->frames};
}
static void detach(){if(connected){audio_output_disconnect(obs_get_audio(),0,callback,nullptr);connected=false;}}
struct ViewRequest{obs_data_t *out;bool release;};
static void view_task(void *ptr){auto *r=static_cast<ViewRequest *>(ptr);
 if(view){obs_view_set_source(view,0,nullptr);obs_view_remove(view);obs_view_destroy(view);view=nullptr;}
 if(r->release){obs_data_set_bool(r->out,"success",true);return;}
 auto *s=obs_get_source_by_name("QA Four Players");if(!s){obs_data_set_string(r->out,"error","QA scene missing");return;}
 view=obs_view_create();obs_view_set_source(view,0,s);obs_source_release(s);
 obs_data_set_bool(r->out,"success",obs_view_add(view)!=nullptr);
}
static void request(obs_data_t *in,obs_data_t *out,void *){
 std::lock_guard<std::mutex> lock(controls);const char *action=obs_data_get_string(in,"action");
 obs_data_set_int(out,"wallNs",os_gettime_ns());
 if(std::strcmp(action,"view")==0||std::strcmp(action,"release-view")==0){ViewRequest r{out,std::strcmp(action,"release-view")==0};obs_queue_task(OBS_TASK_UI,view_task,&r,true);return;}
 if(std::strcmp(action,"start")==0){detach();samples=count=0;overflow=false;left.resize(size_t(rate)*180);right.resize(left.size());packets.resize(16384);
  audio_convert_info format{};format.format=AUDIO_FORMAT_FLOAT_PLANAR;format.samples_per_sec=rate;format.speakers=SPEAKERS_STEREO;
  connected=audio_output_connect(obs_get_audio(),0,&format,callback,nullptr);obs_data_set_bool(out,"success",connected);
 }else if(std::strcmp(action,"stop")==0){detach();
  for(const auto &item: {std::pair<const char *,const std::vector<float> *>("left.f32",&left),{"right.f32",&right}}){auto file=directory+"/"+item.first;FILE *f=std::fopen(file.c_str(),"wb");if(!f){obs_data_set_string(out,"error","QA output unavailable");return;}std::fwrite(item.second->data(),sizeof(float),samples,f);std::fclose(f);}
  FILE *f=std::fopen((directory+"/packets.csv").c_str(),"wb");if(f){std::fprintf(f,"timestamp,wallNs,frames\n");for(size_t i=0;i<count;i++)std::fprintf(f,"%llu,%llu,%u\n",(unsigned long long)packets[i].timestamp,(unsigned long long)packets[i].wall,packets[i].frames);std::fclose(f);}
  obs_data_set_int(out,"samples",samples);obs_data_set_int(out,"packets",count);obs_data_set_bool(out,"overflow",overflow);obs_data_set_bool(out,"success",true);
 }else if(std::strcmp(action,"mark")!=0){obs_data_set_string(out,"error","QA action invalid");return;}
 obs_data_set_int(out,"sampleRate",rate);obs_data_set_string(out,"point","audio_output_connect mix0: final digital Master/track1, after libobs source mixing/mute/volume; no hardware");
}
bool obs_module_load(void){const char *p=std::getenv("FREEMIX_QA_MASTER_DIRECTORY");if(!p)return false;directory=p;rate=audio_output_get_sample_rate(obs_get_audio());return rate==48000;}
void obs_module_post_load(void){auto v=obs_websocket_register_vendor("qa-master-four");if(v)obs_websocket_vendor_register_request(v,"capture",request,nullptr);}
void obs_module_unload(void){std::lock_guard<std::mutex> lock(controls);detach();if(view){ViewRequest r{obs_data_create(),true};obs_queue_task(OBS_TASK_UI,view_task,&r,true);obs_data_release(r.out);}}

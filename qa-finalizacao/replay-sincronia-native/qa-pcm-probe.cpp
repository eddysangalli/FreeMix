// QA only: bounded pre-Master PCM capture. Never ship/load in an operator root.
#include <obs-module.h>
#include <obs-websocket-api.h>
#include <util/platform.h>
#include <atomic>
#include <array>
#include <vector>
#include <string>
#include <mutex>
#include <cstdio>
#include <cstdlib>
#include <cstring>
OBS_DECLARE_MODULE()
MODULE_EXPORT const char *obs_module_description(void){return "Isolated QA Replay PCM probe";}
struct Packet{uint64_t timestamp,wall;uint32_t frames;bool muted;};
struct Capture{obs_source_t *source=nullptr;std::vector<float> pcm;std::vector<Packet> packets;size_t samples=0,count=0;bool overflow=false;};
static std::array<Capture,4> captures;static std::mutex controls;static std::string directory;static unsigned rate;
static obs_view_t *qa_view=nullptr;
struct ViewRequest{obs_data_t *out;bool release;};
static void view_task(void *ptr){auto *v=static_cast<ViewRequest *>(ptr);if(qa_view){obs_view_set_source(qa_view,0,nullptr);obs_view_remove(qa_view);obs_view_destroy(qa_view);qa_view=nullptr;}if(v->release){obs_data_set_bool(v->out,"success",true);return;}auto *source=obs_get_source_by_name("QA Playback Pair");if(!source){obs_data_set_string(v->out,"error","QA pair scene missing");return;}qa_view=obs_view_create();obs_view_set_source(qa_view,0,source);obs_source_release(source);auto *video=obs_view_add(qa_view);obs_data_set_bool(v->out,"success",video!=nullptr);}
static void audio(void *param,obs_source_t *,const audio_data *data,bool muted){
 auto &c=*static_cast<Capture *>(param);if(!data||!data->data[0])return;
 if(c.samples+data->frames>c.pcm.size()||c.count==c.packets.size()){c.overflow=true;return;}
 std::memcpy(c.pcm.data()+c.samples,data->data[0],data->frames*sizeof(float));c.samples+=data->frames;c.packets[c.count++]={data->timestamp,os_gettime_ns(),data->frames,muted};
}
static void detach(Capture &c){if(c.source){obs_source_remove_audio_capture_callback(c.source,audio,&c);obs_source_release(c.source);c.source=nullptr;}}
static void request(obs_data_t *in,obs_data_t *out,void *){
 std::lock_guard<std::mutex> lock(controls);const char *p=obs_data_get_string(in,"player"),*action=obs_data_get_string(in,"action");
 if(!directory.empty()&&(!std::strcmp(action,"hold-view")||!std::strcmp(action,"release-view"))){ViewRequest v{out,!std::strcmp(action,"release-view")};obs_queue_task(OBS_TASK_UI,view_task,&v,true);return;}
 if(!p||std::strlen(p)!=1||p[0]<'A'||p[0]>'D'||directory.empty()){obs_data_set_string(out,"error","QA environment/player invalid");return;}
 auto &c=captures[p[0]-'A'];
 if(std::strcmp(action,"start")==0){
  detach(c);c.samples=c.count=0;c.overflow=false;c.pcm.resize(size_t(rate)*180);c.packets.resize(16384);
  std::string name="Replay Player ";name+=p;c.source=obs_get_source_by_name(name.c_str());if(!c.source){obs_data_set_string(out,"error","Replay input missing");return;}
  // Do not read callback-owned counters while capture runs.
  obs_data_set_int(out,"sampleRate",rate);obs_data_set_string(out,"format","float32-planar-first-channel");obs_data_set_int(out,"wallNs",os_gettime_ns());obs_data_set_int(out,"samples",0);obs_data_set_int(out,"packets",0);obs_data_set_bool(out,"overflow",false);
  obs_source_add_audio_capture_callback(c.source,audio,&c);
  return;
 }else if(std::strcmp(action,"stop")==0){
  detach(c);std::string file=directory+"/"+p+".f32",csv=directory+"/"+p+".csv";FILE *f=std::fopen(file.c_str(),"wb");if(!f){obs_data_set_string(out,"error","QA output unavailable");return;}std::fwrite(c.pcm.data(),sizeof(float),c.samples,f);std::fclose(f);f=std::fopen(csv.c_str(),"wb");if(f){std::fprintf(f,"timestamp,wallNs,frames,muted\n");for(size_t n=0;n<c.count;n++){auto &v=c.packets[n];std::fprintf(f,"%llu,%llu,%u,%u\n",(unsigned long long)v.timestamp,(unsigned long long)v.wall,v.frames,v.muted?1:0);}std::fclose(f);}obs_data_set_string(out,"file",file.c_str());obs_data_set_string(out,"packetsFile",csv.c_str());
 }else{obs_data_set_string(out,"error","QA action invalid");return;}
 obs_data_set_int(out,"sampleRate",rate);obs_data_set_string(out,"format","float32-planar-first-channel");obs_data_set_string(out,"point","source audio capture callback after libobs resample, before Master mixing");obs_data_set_int(out,"samples",c.samples);obs_data_set_int(out,"packets",c.count);obs_data_set_bool(out,"overflow",c.overflow);
}
bool obs_module_load(void){const char *path=std::getenv("FREEMIX_QA_PCM_DIRECTORY");if(!path)return false;directory=path;rate=audio_output_get_sample_rate(obs_get_audio());return rate>0;}
void obs_module_post_load(void){auto vendor=obs_websocket_register_vendor("qa-replay-pcm");if(vendor)obs_websocket_vendor_register_request(vendor,"capture",request,nullptr);}
void obs_module_unload(void){std::lock_guard<std::mutex> lock(controls);for(auto &c:captures)detach(c);}

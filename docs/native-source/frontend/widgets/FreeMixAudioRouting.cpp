// Independent stereo submixes. No implicit connection to global recording mixes.
#include "FreeMixAudioRouting.hpp"
#include <obs.hpp>
#include <util/platform.h>
#include <QCoreApplication>
#include <QMetaObject>
#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <mutex>
#include <set>
#include <string>
#include <thread>
#include <vector>

namespace {
struct Bus;
struct Tap { Bus *bus; obs_source_t *source; float gain; int64_t offset=0; uint64_t last=0; bool aligned=false,blocked=false,activeLease=false; };
struct Bus {
 obs_source_t *source; uint32_t rate; size_t capacity; std::mutex mutex;
 std::vector<float> samples; std::vector<int64_t> tags; std::vector<Tap *> taps;
 std::atomic<bool> stopping{false}; std::thread worker;
 Bus(obs_source_t *s,uint32_t r):source(s),rate(r),capacity(r*2),samples(capacity*2),tags(capacity,-1){}
};
bool Private(obs_source_t *s){
 const std::string name=obs_source_get_name(s),kind=obs_source_get_id(s);
 OBSDataAutoRelease settings=obs_source_get_private_settings(s);
 return obs_data_get_bool(settings,"freemix_director_private")||kind=="freemix_audio_bus"||kind=="mix-track-to-source"||
  name.rfind("FreeMix Retorno",0)==0||name.rfind("FreeMix N1",0)==0||name.rfind("FreeMix Bus",0)==0||name=="FreeMix Master";
}
void Capture(void *param,obs_source_t *source,const audio_data *audio,bool muted){
 auto *tap=static_cast<Tap *>(param);auto &bus=*tap->bus;
 if(Private(source)){if(!tap->blocked){std::lock_guard<std::mutex> lock(bus.mutex);std::fill(bus.tags.begin(),bus.tags.end(),-1);tap->blocked=true;}return;}
 tap->blocked=false;if(muted||!audio||!audio->frames||audio->frames>8192)return;
 const float gain=tap->gain*obs_source_get_volume(source);if(!(gain>0))return;
 const uint64_t now=os_gettime_ns(),duration=uint64_t(audio->frames)*1000000000ULL/bus.rate;
 int64_t time=int64_t(audio->timestamp)+tap->offset;
 if(!tap->aligned||audio->timestamp<tap->last||time>int64_t(now)+100000000LL||time<int64_t(now)-750000000LL){tap->offset=int64_t(now>duration?now-duration:0)-int64_t(audio->timestamp);tap->aligned=true;time=int64_t(audio->timestamp)+tap->offset;}
 tap->last=audio->timestamp;const int64_t first=(time/1000000000LL)*bus.rate+(time%1000000000LL)*bus.rate/1000000000LL;
 std::lock_guard<std::mutex> lock(bus.mutex);
 for(uint32_t f=0;f<audio->frames;f++){const int64_t frame=first+f;if(frame<0)continue;const size_t index=size_t(frame)%bus.capacity;if(bus.tags[index]!=frame){bus.tags[index]=frame;bus.samples[index*2]=bus.samples[index*2+1]=0;}
  for(size_t ch=0;ch<2;ch++){const float value=audio->data[ch]?reinterpret_cast<const float *>(audio->data[ch])[f]:audio->data[0]?reinterpret_cast<const float *>(audio->data[0])[f]:0;if(std::isfinite(value))bus.samples[index*2+ch]+=value*gain;}}
}
void Clear(Bus &bus){for(auto *tap:bus.taps){obs_source_remove_audio_capture_callback(tap->source,Capture,tap);if(tap->activeLease)obs_source_dec_active(tap->source);obs_source_release(tap->source);delete tap;}bus.taps.clear();std::lock_guard<std::mutex> lock(bus.mutex);std::fill(bus.tags.begin(),bus.tags.end(),-1);}
void Update(void *data,obs_data_t *settings){
 auto &bus=*static_cast<Bus *>(data);std::vector<Tap *> next;std::set<std::string> seen;std::string error;
 OBSDataArrayAutoRelease rows=obs_data_get_array(settings,"sources");
 if(rows&&obs_data_array_count(rows)>32)error="At most 32 public sources per bus";
 else for(size_t n=0;rows&&n<obs_data_array_count(rows);n++){
  OBSDataAutoRelease row=obs_data_array_item(rows,n);const std::string uuid=obs_data_get_string(row,"uuid");const float gain=float(obs_data_get_double(row,"gain"));
  obs_source_t *s=obs_get_source_by_uuid(uuid.c_str());
  if(!s||!seen.insert(uuid).second||!std::isfinite(gain)||gain<0||gain>2||!(obs_source_get_output_flags(s)&OBS_SOURCE_AUDIO)||(obs_source_get_output_flags(s)&OBS_SOURCE_COMPOSITE)||Private(s)){if(s)obs_source_release(s);error="Private, missing, duplicate or cyclic audio source";break;}
  next.push_back(new Tap{&bus,s,gain});
 }
 if(!error.empty()){for(auto *tap:next){obs_source_release(tap->source);delete tap;}OBSDataAutoRelease status=obs_source_get_private_settings(bus.source);obs_data_set_string(status,"freemix_bus_error",error.c_str());return;}
 Clear(bus);bus.taps=std::move(next);for(auto *tap:bus.taps){
  // Activating a shared input with global routes could open its sound on air.
  // Only hold isolated (mixers=0) inputs active. Routed inputs follow their
  // existing scene activation; the bus never changes their public routes.
  if(obs_source_get_audio_mixers(tap->source)==0){obs_source_inc_active(tap->source);tap->activeLease=true;}
  obs_source_add_audio_capture_callback(tap->source,Capture,tap);
 }
 OBSDataAutoRelease status=obs_source_get_private_settings(bus.source);obs_data_set_string(status,"freemix_bus_error","");obs_data_set_int(status,"freemix_bus_sources",bus.taps.size());
}
void Render(Bus &bus){
 const size_t frames=bus.rate/100;std::vector<float> left(frames),right(frames);auto next=std::chrono::steady_clock::now();int64_t readFrame=-1;uint64_t timestamp=0;
 while(!bus.stopping){next+=std::chrono::milliseconds(10);const uint64_t now=os_gettime_ns();
  if(!timestamp||now>timestamp+250000000ULL){timestamp=now;const uint64_t read=now>50000000ULL?now-50000000ULL:0;readFrame=int64_t(read/1000000000ULL*bus.rate+read%1000000000ULL*bus.rate/1000000000ULL);}
  {std::lock_guard<std::mutex> lock(bus.mutex);for(size_t f=0;f<frames;f++){const int64_t frame=readFrame+int64_t(f);const size_t index=size_t(frame)%bus.capacity;const bool present=bus.tags[index]==frame;left[f]=present?std::clamp(bus.samples[index*2],-1.f,1.f):0;right[f]=present?std::clamp(bus.samples[index*2+1],-1.f,1.f):0;}}
  obs_source_audio audio{};audio.data[0]=reinterpret_cast<uint8_t *>(left.data());audio.data[1]=reinterpret_cast<uint8_t *>(right.data());audio.frames=uint32_t(frames);audio.speakers=SPEAKERS_STEREO;audio.format=AUDIO_FORMAT_FLOAT_PLANAR;audio.samples_per_sec=bus.rate;audio.timestamp=timestamp;obs_source_output_audio(bus.source,&audio);
  readFrame+=int64_t(frames);timestamp+=uint64_t(frames)*1000000000ULL/bus.rate;std::this_thread::sleep_until(next);
 }
}
void *Create(obs_data_t *settings,obs_source_t *source){obs_audio_info info{};if(!obs_get_audio_info(&info))return nullptr;auto *bus=new Bus(source,info.samples_per_sec);obs_source_set_audio_mixers(source,0);Update(bus,settings);bus->worker=std::thread([bus](){Render(*bus);});return bus;}
void Destroy(void *data){auto *bus=static_cast<Bus *>(data);bus->stopping=true;if(bus->worker.joinable())bus->worker.join();Clear(*bus);delete bus;}
void List(obs_data_t *response,const char *key,const char *kind,const char *property){
 obs_properties_t *props=obs_get_source_properties(kind);OBSDataArrayAutoRelease rows=obs_data_array_create();
 auto *p=props?obs_properties_get(props,property):nullptr;
 if(p&&obs_property_get_type(p)==OBS_PROPERTY_LIST)for(size_t n=0;n<obs_property_list_item_count(p);n++){
  const char *id=obs_property_list_item_string(p,n);if(!id||!*id||std::string(id)=="VBAN"||obs_property_list_item_disabled(p,n))continue;
  OBSDataAutoRelease row=obs_data_create();obs_data_set_string(row,"id",id);obs_data_set_string(row,"name",obs_property_list_item_name(p,n));obs_data_array_push_back(rows,row);
 }
 obs_data_set_array(response,key,rows);if(props)obs_properties_destroy(props);
}
}
bool FreeMixAudioBusAllowed(obs_source_t *source){
 if(!source||obs_source_removed(source)||!obs_source_enabled(source)||std::string(obs_source_get_id(source))!="freemix_audio_bus"||obs_source_get_audio_mixers(source)!=0)return false;
 OBSDataAutoRelease settings=obs_source_get_private_settings(source);
 return !obs_data_get_bool(settings,"freemix_director_private");
}
struct FreeMixSourceAudio::Impl {
 OBSSourceAutoRelease source;audio_t *audio=nullptr;std::string name;
 uint32_t rate=48000;size_t capacity=0;std::vector<float> samples;std::vector<int64_t> tags;std::mutex mutex;
 bool attached=false,activeLease=false;std::atomic<bool> closing{false};
 static void Capture(void *param,obs_source_t *source,const audio_data *data,bool muted){
  auto &self=*static_cast<Impl *>(param);if(self.closing)return;
  std::lock_guard<std::mutex> lock(self.mutex);
  if(!FreeMixAudioBusAllowed(source)||muted||!data||!data->frames||data->frames>8192){std::fill(self.tags.begin(),self.tags.end(),-1);return;}
  const float gain=obs_source_get_volume(source);const int64_t first=int64_t(data->timestamp/1000000000ULL*self.rate+data->timestamp%1000000000ULL*self.rate/1000000000ULL);
  for(uint32_t f=0;f<data->frames;f++){const int64_t frame=first+f;if(frame<0)continue;const size_t at=size_t(frame)%self.capacity;self.tags[at]=frame;
   for(size_t ch=0;ch<2;ch++){const float sample=data->data[ch]?reinterpret_cast<const float *>(data->data[ch])[f]:data->data[0]?reinterpret_cast<const float *>(data->data[0])[f]:0;self.samples[at*2+ch]=std::isfinite(sample)?std::clamp(sample*gain,-1.f,1.f):0;}}
 }
 static bool Read(void *param,uint64_t start,uint64_t,uint64_t *timestamp,uint32_t mixes,audio_output_data *data){
  auto &self=*static_cast<Impl *>(param);*timestamp=start;
  if(self.closing||!FreeMixAudioBusAllowed(self.source)||obs_source_muted(self.source))return true;
  const uint64_t time=start>50000000ULL?start-50000000ULL:0;
  const int64_t first=int64_t(time/1000000000ULL*self.rate+time%1000000000ULL*self.rate/1000000000ULL);
  std::lock_guard<std::mutex> lock(self.mutex);
  for(size_t mix=0;mix<MAX_AUDIO_MIXES;mix++)if(mixes&(1u<<mix))for(size_t f=0;f<AUDIO_OUTPUT_FRAMES;f++){
   const int64_t frame=first+int64_t(f);const size_t at=size_t(frame)%self.capacity;const bool present=self.tags[at]==frame;
   for(size_t ch=0;ch<2;ch++)if(data[mix].data[ch])data[mix].data[ch][f]=present?self.samples[at*2+ch]:0;
  }
  return true;
 }
 ~Impl(){
  closing=true;
  // libobs removes the callback under its capture mutex, waiting for in-flight
  // calls. Keep this context alive until callback removal and audio thread join.
  if(attached)obs_source_remove_audio_capture_callback(source,Capture,this);
  if(audio)audio_output_close(audio);
  if(activeLease)obs_source_dec_active(source);
 }
};
FreeMixSourceAudio::FreeMixSourceAudio(std::unique_ptr<Impl> p):impl(std::move(p)){}
FreeMixSourceAudio::~FreeMixSourceAudio()=default;
std::unique_ptr<FreeMixSourceAudio> FreeMixSourceAudio::Open(const std::string &uuid,const std::string &name,std::string &error){
 auto p=std::make_unique<Impl>();p->source=obs_get_source_by_uuid(uuid.c_str());
 if(!FreeMixAudioBusAllowed(p->source)){error="select a public independent audio bus with all global tracks disabled";return nullptr;}
 obs_audio_info info{};if(!obs_get_audio_info(&info)){error="audio context unavailable";return nullptr;}
 p->rate=info.samples_per_sec;p->capacity=p->rate*2;p->samples.resize(p->capacity*2);p->tags.assign(p->capacity,-1);p->name=name;
 audio_output_info output{};output.name=p->name.c_str();output.samples_per_sec=p->rate;output.speakers=SPEAKERS_STEREO;output.format=AUDIO_FORMAT_FLOAT_PLANAR;output.input_callback=Impl::Read;output.input_param=p.get();
 if(audio_output_open(&p->audio,&output)!=AUDIO_OUTPUT_SUCCESS){error="could not create independent PCM context";return nullptr;}
 obs_source_inc_active(p->source);p->activeLease=true;obs_source_add_audio_capture_callback(p->source,Impl::Capture,p.get());p->attached=true;
 return std::unique_ptr<FreeMixSourceAudio>(new FreeMixSourceAudio(std::move(p)));
}
audio_t *FreeMixSourceAudio::Audio()const{return impl->audio;}
bool FreeMixSourceAudio::Valid()const{return FreeMixAudioBusAllowed(impl->source);}
void FreeMixAudioRoutingRegister(){static bool registered=false;if(registered)return;registered=true;obs_source_info info{};info.id="freemix_audio_bus";info.type=OBS_SOURCE_TYPE_INPUT;info.output_flags=OBS_SOURCE_AUDIO|OBS_SOURCE_DO_NOT_DUPLICATE;info.get_name=[](void *){return "FreeMix Independent Audio Bus";};info.create=Create;info.destroy=Destroy;info.update=Update;info.icon_type=OBS_ICON_TYPE_AUDIO_OUTPUT;obs_register_source(&info);}
void FreeMixAudioCapabilitiesRequest(obs_data_t *request,obs_data_t *response,void *){
 QMetaObject::invokeMethod(qApp,[request,response](){
  // Audio Monitor properties requires a live filter context and dereferences
  // it unconditionally. Query libobs' WASAPI enumeration instead of passing
  // nullptr through obs_get_source_properties("audio_monitor").
  OBSDataArrayAutoRelease devices=obs_data_array_create();
  obs_enum_audio_monitoring_devices([](void *param,const char *name,const char *id){
   OBSDataAutoRelease row=obs_data_create();obs_data_set_string(row,"id",id);obs_data_set_string(row,"name",name);obs_data_array_push_back(static_cast<obs_data_array_t *>(param),row);return true;
  },devices.Get());
  obs_data_set_array(response,"renderDevices",devices);
  OBSDataAutoRelease recordDefaults=obs_get_source_defaults("source_record_filter");
  obs_data_set_bool(response,"source_record_bus_capture",recordDefaults&&obs_data_get_bool(recordDefaults,"freemix_premix_bus_capture"));
  List(response,"asioDrivers","asio_input_capture","device_id");
  const char *uuid=obs_data_get_string(request,"busUuid");if(uuid&&*uuid){OBSSourceAutoRelease source=obs_get_source_by_uuid(uuid);if(source&&std::string(obs_source_get_id(source))=="freemix_audio_bus"){OBSDataAutoRelease status=obs_source_get_private_settings(source);obs_data_set_string(response,"busError",obs_data_get_string(status,"freemix_bus_error"));obs_data_set_int(response,"busSources",obs_data_get_int(status,"freemix_bus_sources"));}}
  obs_data_set_bool(response,"success",true);
 },Qt::BlockingQueuedConnection);
}

// Separate native receiver; never controls FreeMix/OBS/vMix. NDI BGRA is straight,
// per official Frame Types SDK documentation. Packed input is Fill left, Key right.
#define NOMINMAX
#include <windows.h>
#include <atomic>
#include <chrono>
#include <thread>
#include <vector>
#include <iostream>
#include <fstream>
#include <algorithm>
#include <stdexcept>
#include <string>
extern "C" {
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libavutil/channel_layout.h>
#include <libswscale/swscale.h>
#include <libswresample/swresample.h>
}
#include "Processing.NDI.Lib.h"
using Clock=std::chrono::steady_clock;
static std::atomic<bool> stopping{false};
static BOOL WINAPI signalHandler(DWORD){stopping=true;return TRUE;}
static int64_t nowUs(){return std::chrono::duration_cast<std::chrono::microseconds>(Clock::now().time_since_epoch()).count();}
static int64_t deadline=0;
static int interrupt(void*){return stopping||(deadline&&nowUs()>deadline);}
static void require(bool ok,const char* message){if(!ok)throw std::runtime_error(message);}
struct Ndi {
 HMODULE dll=nullptr; NDIlib_send_instance_t sender=nullptr;
 decltype(&NDIlib_initialize) init; decltype(&NDIlib_destroy) finish;
 decltype(&NDIlib_send_create) create; decltype(&NDIlib_send_destroy) destroy;
 decltype(&NDIlib_send_send_video_v2) video; decltype(&NDIlib_send_send_audio_v2) audio;
 template<class T> T load(const char* n){auto p=GetProcAddress(dll,n);require(p!=nullptr,"NDI runtime entry missing");return reinterpret_cast<T>(p);}
 Ndi(const std::string& runtime,const std::string& name){
  dll=LoadLibraryExA(runtime.c_str(),nullptr,LOAD_WITH_ALTERED_SEARCH_PATH);require(dll!=nullptr,"Official NDI runtime unavailable");
  init=load<decltype(init)>("NDIlib_initialize");finish=load<decltype(finish)>("NDIlib_destroy");create=load<decltype(create)>("NDIlib_send_create");destroy=load<decltype(destroy)>("NDIlib_send_destroy");video=load<decltype(video)>("NDIlib_send_send_video_v2");audio=load<decltype(audio)>("NDIlib_send_send_audio_v2");
  require(init(),"NDI initialize failed");NDIlib_send_create_t c={};c.p_ndi_name=name.c_str();c.p_groups="FreeMix Alpha";c.clock_video=false;c.clock_audio=false;sender=create(&c);require(sender!=nullptr,"NDI sender failed");
 }
 ~Ndi(){if(sender)destroy(sender);if(dll){finish();FreeLibrary(dll);}}
};
struct Media {
 AVFormatContext* format=nullptr;AVCodecContext *video=nullptr,*audio=nullptr;AVFrame* frame=av_frame_alloc();AVPacket* packet=av_packet_alloc();SwsContext* scale=nullptr;SwrContext* resample=nullptr;
 int vi=-1,ai=-1;int64_t origin=AV_NOPTS_VALUE,anchor=0,outputOffset=AV_NOPTS_VALUE;int64_t lastVideo=-1,lastAudio=-1;int inputRate=0,inputFormat=-1;AVChannelLayout inputLayout={};
 ~Media(){av_channel_layout_uninit(&inputLayout);swr_free(&resample);sws_freeContext(scale);av_packet_free(&packet);av_frame_free(&frame);avcodec_free_context(&video);avcodec_free_context(&audio);avformat_close_input(&format);}
 AVCodecContext* decoder(int index){auto p=format->streams[index]->codecpar;auto codec=avcodec_find_decoder(p->codec_id);require(codec!=nullptr,"Decoder unavailable");auto c=avcodec_alloc_context3(codec);require(c!=nullptr,"Decoder allocation failed");if(avcodec_parameters_to_context(c,p)<0||avcodec_open2(c,codec,nullptr)<0){avcodec_free_context(&c);throw std::runtime_error("Decoder initialization failed");}return c;}
 void open(const std::string& url){format=avformat_alloc_context();require(format!=nullptr,"Demux allocation failed");format->interrupt_callback={interrupt,nullptr};AVDictionary* options=nullptr;av_dict_set(&options,"rw_timeout","5000000",0);av_dict_set(&options,"probesize","2097152",0);av_dict_set(&options,"analyzeduration","1000000",0);deadline=nowUs()+6000000;int r=avformat_open_input(&format,url.c_str(),nullptr,&options);av_dict_free(&options);require(r>=0,"Input unavailable; retrying");require(avformat_find_stream_info(format,nullptr)>=0,"No stream info");vi=av_find_best_stream(format,AVMEDIA_TYPE_VIDEO,-1,-1,nullptr,0);require(vi>=0,"Input has no video");ai=av_find_best_stream(format,AVMEDIA_TYPE_AUDIO,-1,-1,nullptr,0);video=decoder(vi);if(ai>=0)audio=decoder(ai);deadline=0;}
 int64_t pts(AVFrame* f,int stream){auto p=f->best_effort_timestamp;if(p==AV_NOPTS_VALUE)p=f->pts;require(p!=AV_NOPTS_VALUE,"Timestamp absent; refusing unsynchronized media");return av_rescale_q(p,format->streams[stream]->time_base,AVRational{1,1000000});}
 bool pace(int64_t pts){if(origin==AV_NOPTS_VALUE){origin=pts;anchor=nowUs();}int64_t target=anchor+pts-origin;if(target>nowUs()+2000000)throw std::runtime_error("PTS discontinuity; reconnecting");while(!stopping&&nowUs()<target)std::this_thread::sleep_for(std::chrono::milliseconds(1));return !stopping&&nowUs()-target<250000;}
};
struct Stats {uint64_t video=0,audio=0,samples=0,dropped=0,reconnects=0;double maxProcessMs=0;int width=0,height=0;int64_t firstVideo=-1,lastVideo=-1,firstAudio=-1,lastAudio=-1;};
static void save(const std::string& file,const Stats&s,const char* state){if(file.empty())return;std::ofstream f(file,std::ios::trunc);f<<"{\"state\":\""<<state<<"\",\"videoFrames\":"<<s.video<<",\"audioFrames\":"<<s.audio<<",\"audioSamplesPerChannel\":"<<s.samples<<",\"droppedLateFrames\":"<<s.dropped<<",\"reconnects\":"<<s.reconnects<<",\"maxVideoProcessMs\":"<<s.maxProcessMs<<",\"width\":"<<s.width<<",\"height\":"<<s.height<<",\"firstVideoPtsUs\":"<<s.firstVideo<<",\"lastVideoPtsUs\":"<<s.lastVideo<<",\"firstAudioPtsUs\":"<<s.firstAudio<<",\"lastAudioPtsUs\":"<<s.lastAudio<<",\"browser\":false,\"externalHomologation\":false}";}
int main(int argc,char** argv){
 std::string url,runtime,name="FreeMix SRT Alpha",receipt;bool once=false;int seconds=0;
 for(int i=1;i<argc;i++){std::string a=argv[i];if(a=="--once")once=true;else if(i+1<argc){auto v=argv[++i];if(a=="--input")url=v;else if(a=="--ndi-runtime")runtime=v;else if(a=="--name")name=v;else if(a=="--receipt")receipt=v;else if(a=="--seconds")seconds=std::stoi(v);else {std::cerr<<"Unknown argument\n";return 2;}}else{std::cerr<<"Missing argument\n";return 2;}}
 if(url.empty()||runtime.empty()){std::cerr<<"FreeMix native packed-alpha receiver\n--input srt://0.0.0.0:18460?mode=listener&latency=120000 --ndi-runtime <official DLL> [--name name] [--receipt json] [--seconds n] [--once]\n";return 2;}
 SetConsoleCtrlHandler(signalHandler,TRUE);av_log_set_level(AV_LOG_ERROR);avformat_network_init();Stats stats;auto began=nowUs();bool failed=false;
 try {Ndi ndi(runtime,name);std::vector<uint8_t> packed,rgba;std::vector<float> pcm;bool blankSent=false;int64_t epochWall=0,epochPts=0;
  while(!stopping&&(!seconds||nowUs()-began<int64_t(seconds)*1000000)){
   try {Media m;m.open(url);save(receipt,stats,"receiving");
    auto process=[&](AVFrame* frame,bool isVideo){int index=isVideo?m.vi:m.ai;int64_t pts=m.pts(frame,index);auto& last=isVideo?m.lastVideo:m.lastAudio;if(last>=0&&pts<=last){stats.dropped++;return;}last=pts;
     // Reconnecting senders may restart TS PTS. Rebase both streams together,
     // preserving their offset while keeping the NDI timeline monotonic.
     if(m.outputOffset==AV_NOPTS_VALUE){if(!epochWall){epochWall=nowUs();epochPts=pts;m.outputOffset=0;}else m.outputOffset=std::max(std::max(stats.lastVideo,stats.lastAudio)+33334,epochPts+nowUs()-epochWall)-pts;}
     int64_t outputPts=pts+m.outputOffset;
     if(!m.pace(pts)){stats.dropped++;return;}
     if(isVideo){int64_t start=nowUs();int w=frame->width,h=frame->height;require(w>0&&w<=7680&&w%4==0&&h>0&&h<=2160,"Packed dimensions invalid (double-width with even logical width)");require(frame->color_trc!=AVCOL_TRC_SMPTE2084&&frame->color_trc!=AVCOL_TRC_ARIB_STD_B67,"HDR packed bridge unavailable; use supported SDR");packed.resize(size_t(w)*h*4);rgba.resize(size_t(w/2)*h*4);m.scale=sws_getCachedContext(m.scale,w,h,AVPixelFormat(frame->format),w,h,AV_PIX_FMT_BGRA,SWS_BILINEAR,nullptr,nullptr,nullptr);require(m.scale!=nullptr,"Pixel conversion failed");const int* co=sws_getCoefficients(frame->colorspace==AVCOL_SPC_BT709?SWS_CS_ITU709:SWS_CS_DEFAULT);sws_setColorspaceDetails(m.scale,co,frame->color_range==AVCOL_RANGE_JPEG,co,1,0,1<<16,1<<16);uint8_t* out[4]={packed.data()};int strides[4]={w*4};sws_scale(m.scale,frame->data,frame->linesize,0,h,out,strides);
      for(int y=0;y<h;y++){const auto* row=packed.data()+size_t(y)*w*4;auto* dst=rgba.data()+size_t(y)*(w/2)*4;for(int x=0;x<w/2;x++){std::copy_n(row+x*4,3,dst+x*4);const auto* key=row+(x+w/2)*4;dst[x*4+3]=uint8_t((int(key[0])+key[1]+key[2]+1)/3);}}
      auto fps=av_guess_frame_rate(m.format,m.format->streams[m.vi],frame);require(fps.num>0&&fps.den>0,"Unknown video rate");NDIlib_video_frame_v2_t v={};v.xres=w/2;v.yres=h;v.FourCC=NDIlib_FourCC_type_BGRA;v.frame_rate_N=fps.num;v.frame_rate_D=fps.den;v.picture_aspect_ratio=float(w/2)/h;v.frame_format_type=NDIlib_frame_format_type_progressive;v.timecode=outputPts*10;v.p_data=rgba.data();v.line_stride_in_bytes=(w/2)*4;ndi.video(ndi.sender,&v);blankSent=false;stats.video++;stats.width=w/2;stats.height=h;if(stats.firstVideo<0)stats.firstVideo=outputPts;stats.lastVideo=outputPts;stats.maxProcessMs=std::max(stats.maxProcessMs,double(nowUs()-start)/1000);
     }else {if(!m.resample||m.inputRate!=frame->sample_rate||m.inputFormat!=frame->format||av_channel_layout_compare(&m.inputLayout,&frame->ch_layout)!=0){swr_free(&m.resample);av_channel_layout_uninit(&m.inputLayout);av_channel_layout_copy(&m.inputLayout,&frame->ch_layout);m.inputRate=frame->sample_rate;m.inputFormat=frame->format;AVChannelLayout stereo=AV_CHANNEL_LAYOUT_STEREO;require(swr_alloc_set_opts2(&m.resample,&stereo,AV_SAMPLE_FMT_FLTP,48000,&frame->ch_layout,AVSampleFormat(frame->format),frame->sample_rate,0,nullptr)>=0&&swr_init(m.resample)>=0,"Audio conversion failed");}
      int capacity=swr_get_out_samples(m.resample,frame->nb_samples);pcm.resize(size_t(capacity)*2);uint8_t* planes[2]={reinterpret_cast<uint8_t*>(pcm.data()),reinterpret_cast<uint8_t*>(pcm.data()+capacity)};int n=swr_convert(m.resample,planes,capacity,const_cast<const uint8_t**>(frame->extended_data),frame->nb_samples);require(n>=0,"Audio conversion failed");if(n){NDIlib_audio_frame_v2_t a={};a.sample_rate=48000;a.no_channels=2;a.no_samples=n;a.timecode=outputPts*10;a.p_data=pcm.data();a.channel_stride_in_bytes=capacity*sizeof(float);ndi.audio(ndi.sender,&a);stats.audio++;stats.samples+=n;if(stats.firstAudio<0)stats.firstAudio=outputPts;stats.lastAudio=outputPts;}}
    };
    while(!stopping&&(!seconds||nowUs()-began<int64_t(seconds)*1000000)){deadline=nowUs()+5000000;int r=av_read_frame(m.format,m.packet);deadline=0;if(r<0){if(r==AVERROR_EOF)break;throw std::runtime_error("Media interrupted; retrying");}bool video=m.packet->stream_index==m.vi;AVCodecContext* decoder=video?m.video:m.packet->stream_index==m.ai?m.audio:nullptr;if(decoder){r=avcodec_send_packet(decoder,m.packet);while(r==AVERROR(EAGAIN)){while(avcodec_receive_frame(decoder,m.frame)>=0){process(m.frame,video);av_frame_unref(m.frame);}r=avcodec_send_packet(decoder,m.packet);}require(r>=0,"Decoder packet error");while(avcodec_receive_frame(decoder,m.frame)>=0){process(m.frame,video);av_frame_unref(m.frame);}}av_packet_unref(m.packet);if(stats.video%30==0)save(receipt,stats,"receiving");}
    if(once)break;
   }catch(const std::exception& e){if(stopping)break;failed=true;std::cerr<<e.what()<<"\n";if(once)break;stats.reconnects++;
    // Clear the previous picture on link loss. Do not keep a frozen graphic on air.
    if(stats.width&&stats.height&&!blankSent){rgba.assign(size_t(stats.width)*stats.height*4,0);NDIlib_video_frame_v2_t blank={};blank.xres=stats.width;blank.yres=stats.height;blank.FourCC=NDIlib_FourCC_type_BGRA;blank.frame_rate_N=30;blank.frame_rate_D=1;blank.picture_aspect_ratio=float(stats.width)/stats.height;blank.frame_format_type=NDIlib_frame_format_type_progressive;blank.timecode=(std::max(stats.lastVideo,stats.lastAudio)+1)*10;blank.p_data=rgba.data();blank.line_stride_in_bytes=stats.width*4;ndi.video(ndi.sender,&blank);blankSent=true;}
    save(receipt,stats,"reconnecting");for(int n=0;n<50&&!stopping;n++)std::this_thread::sleep_for(std::chrono::milliseconds(10));}
  }
 }catch(const std::exception& e){std::cerr<<e.what()<<"\n";failed=true;}
 save(receipt,stats,failed&&once?"failed":"stopped");avformat_network_deinit();return failed&&once?1:0;
}

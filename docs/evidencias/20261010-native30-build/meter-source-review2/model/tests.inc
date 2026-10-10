static int checks=0;
static void check(bool condition,const char *name){if(!condition)throw std::runtime_error(name);++checks;}
static bool allZero(const FixedModel &m){for(int c=0;c<8;c++){if(m._magnitude[c]!=0||m._peak[c]!=0)return false;for(float v:m._previousSamples[c])if(v!=0)return false;}return true;}
int main(){try{
 FixedModel fixed;check(allZero(fixed)&&fixed._muted==false,"Fixed initial storage/muted zero");
 fixed._channels=2;const auto initial=fixed.GetMeterData();check(initial["inputLevelsMul"][0]==json::array({0.0f,0.0f,0.0f}),"GetMeterData before first callback numeric zeros");
 for(int c=0;c<8;c++){fixed._magnitude[c]=9;fixed._peak[c]=9;for(float &v:fixed._previousSamples[c])v=1.875f;}fixed.ResetAudioLevels();check(allZero(fixed),"Reset clears all history and levels");
 alignas(16) float samples[1024];for(int i=0;i<1024;i++)samples[i]=0.25f*std::sin(i*0.173f);samples[0]=0.25f;
 audio_data empty;empty.data[0]=reinterpret_cast<uint8_t*>(samples);empty.data[1]=reinterpret_cast<uint8_t*>(samples);
 BaselineModel old;old._channels=2;old.ProcessMagnitude(&empty);check(std::isnan(old._magnitude[0]),"Baseline zero-frame RMS NaN");check(json(old._magnitude[0]).dump()=="null","Pinned nlohmann nonfinite null");
 fixed._channels=2;fixed.ProcessMagnitude(&empty);check(allZero(fixed),"Fixed zero-frame RMS zero");check(json(fixed._magnitude[0]).is_number(),"Fixed RMS numeric serialization");
 for(float &v:fixed._previousSamples[0])v=1.875f;fixed._peak[0]=1.875f;fixed.ProcessPeak(&empty);check(allZero(fixed),"Zero-frame peak clears seeded history");
 audio_data tone=empty;tone.frames=1024;old._previousSamples[0][0]=1.875f;old.ProcessPeak(&tone);check(old._peak[0]==1.875f,"Baseline explicitly seeded peak persists");
 fixed.ResetAudioLevels();fixed.ProcessAudioChannels(&tone);fixed.ProcessPeak(&tone);fixed.ProcessMagnitude(&tone);check(std::abs(fixed._peak[0]-0.25f)<0.000001f&&fixed._magnitude[0]>0&&fixed._magnitude[0]<=0.25f,"Finite tone after initialized history");
 for(uint32_t n: {1u,2u,3u,4u,64u,1024u}){tone.frames=n;fixed.ResetAudioLevels();fixed.ProcessAudioChannels(&tone);fixed.ProcessPeak(&tone);fixed.ProcessMagnitude(&tone);check(std::isfinite(fixed._peak[0])&&std::isfinite(fixed._magnitude[0])&&fixed._magnitude[0]>=0&&fixed._magnitude[0]<=0.25f,"Framecount finite peak/RMS");}
 fixed.PeakMeterType=TRUE_PEAK_METER;tone.frames=1024;fixed.ResetAudioLevels();fixed.ProcessPeak(&tone);check(std::isfinite(fixed._peak[0])&&fixed._peak[0]<1.0f,"True peak finite after zeroed history");
 fixed._previousSamples[0][0]=1.875f;tone.data[1]=nullptr;fixed.ProcessAudioChannels(&tone);check(fixed._channels==1&&fixed._previousSamples[0][0]==0,"Channel change resets previous history");
 fixed._channels=1;fixed._muted=true;fixed._magnitude[0]=0.17f;fixed._peak[0]=0.25f;auto muted=fixed.GetMeterData();check(muted["inputLevelsMul"][0][0]==0&&muted["inputLevelsMul"][0][1]==0&&muted["inputLevelsMul"][0][2]==0.25f,"Muted under-lock scaled zero/raw peak retained");
 fixed._muted=false;fixed._lastUpdate=1;modelClock=1000000000;auto stale=fixed.GetMeterData();check(stale["inputLevelsMul"][0]==json::array({0.0f,0.0f,0.0f})&&allZero(fixed),"Decay resets current/history under lock");modelClock=0;
 FixedModel parallel;parallel._channels=1;parallel._magnitude[0]=0.17f;parallel._peak[0]=0.25f;std::atomic<bool> start{false},valid{true};
 std::thread writer([&]{while(!start.load())std::this_thread::yield();for(int i=0;i<20000;i++){std::unique_lock<std::mutex> lock(parallel._mutex);parallel._muted=i%2;parallel._magnitude[0]=parallel._muted?0.33f:0.17f;parallel._peak[0]=parallel._muted?0.5f:0.25f;}});
 start=true;for(int i=0;i<20000;i++){const auto data=parallel.GetMeterData();const auto &v=data["inputLevelsMul"][0];const bool zero=v[0]==0.0f&&v[1]==0.0f&&v[2]==0.5f,live=v[0]==0.17f&&v[1]==0.25f&&v[2]==0.25f;if(!zero&&!live)valid=false;}writer.join();check(valid.load(),"Fixed getter observes coherent mute/levels with mutex writer model");
 std::cout<<"{\"status\":\"PASS_CPP_EXTRACTED_METHOD_MODEL_ONLY\",\"checks\":"<<checks<<",\"concurrentReadbacks\":20000,\"nativeStarted\":false,\"callbacksObserved\":false,\"causeOriginalFailProven\":false}"<<std::endl;return 0;
 }catch(const std::exception &e){std::cerr<<"MODEL_FAIL "<<e.what()<<std::endl;return 1;}}

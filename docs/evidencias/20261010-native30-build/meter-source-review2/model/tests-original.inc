static int checks=0;
static void check(bool condition,const char *name){if(!condition)throw std::runtime_error(name);++checks;}
static bool allZero(const FixedModel &m){for(int c=0;c<8;c++){if(m._magnitude[c]!=0||m._peak[c]!=0)return false;for(float v:m._previousSamples[c])if(v!=0)return false;}return true;}
int main(){try{
 FixedModel fixed;check(allZero(fixed),"Fixed initial storage zero");
 for(int c=0;c<8;c++){fixed._magnitude[c]=9;fixed._peak[c]=9;for(float &v:fixed._previousSamples[c])v=1.875f;}fixed.ResetAudioLevels();check(allZero(fixed),"Reset clears all history and levels");
 alignas(16) float samples[1024];for(int i=0;i<1024;i++)samples[i]=0.25f*std::sin(i*0.173f);samples[0]=0.25f;
 audio_data empty;empty.data[0]=reinterpret_cast<uint8_t*>(samples);empty.data[1]=reinterpret_cast<uint8_t*>(samples);
 BaselineModel old;old._channels=2;old.ProcessMagnitude(&empty);check(std::isnan(old._magnitude[0]),"Baseline zero-frame RMS NaN");
 check(nlohmann::json(old._magnitude[0]).dump()=="null","Actual pinned nlohmann nonfinite serialization null");
 fixed._channels=2;fixed.ProcessMagnitude(&empty);check(allZero(fixed),"Fixed zero-frame RMS clears levels/history");check(nlohmann::json(fixed._magnitude[0]).is_number(),"Fixed RMS serializes numeric zero");
 for(float &v:fixed._previousSamples[0])v=1.875f;fixed._peak[0]=1.875f;fixed.ProcessPeak(&empty);check(allZero(fixed),"Zero-frame peak cannot retain/load seeded previous samples");
 audio_data tone=empty;tone.frames=1024;old._previousSamples[0][0]=1.875f;old.ProcessPeak(&tone);check(old._peak[0]==1.875f,"Exact baseline peak helper preserves deliberately seeded peak");
 fixed.ResetAudioLevels();fixed.ProcessAudioChannels(&tone);fixed.ProcessPeak(&tone);fixed.ProcessMagnitude(&tone);check(std::abs(fixed._peak[0]-0.25f)<0.000001f&&fixed._magnitude[0]>0&&fixed._magnitude[0]<=0.25f,"Fixed first aligned tone has expected finite levels");
 for(uint32_t n: {1u,2u,3u,4u,64u,1024u}){tone.frames=n;fixed.ResetAudioLevels();fixed.ProcessAudioChannels(&tone);fixed.ProcessPeak(&tone);fixed.ProcessMagnitude(&tone);check(std::isfinite(fixed._peak[0])&&std::isfinite(fixed._magnitude[0])&&fixed._magnitude[0]>=0&&fixed._magnitude[0]<=0.25f,"Bounded frame counts finite sample peak and RMS");}
 fixed.PeakMeterType=TRUE_PEAK_METER;tone.frames=1024;fixed.ResetAudioLevels();fixed.ProcessPeak(&tone);check(std::isfinite(fixed._peak[0])&&fixed._peak[0]<1.0f,"Actual true peak helper finite after initialized history");
 fixed._previousSamples[0][0]=1.875f;tone.data[1]=nullptr;fixed.ProcessAudioChannels(&tone);check(fixed._channels==1&&fixed._previousSamples[0][0]==0,"Channel count change resets previous history");
 check(nlohmann::json(std::numeric_limits<float>::infinity()).dump()=="null","Actual nlohmann infinity null");
 std::cout<<"{\"status\":\"PASS_CPP_EXTRACTED_METHOD_MODEL_ONLY\",\"checks\":"<<checks<<",\"nativeStarted\":false,\"callbacksObserved\":false,\"causeOriginalFailProven\":false}"<<std::endl;return 0;
 }catch(const std::exception &e){std::cerr<<"MODEL_FAIL "<<e.what()<<std::endl;return 1;}}

#include <algorithm>
#include <atomic>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <stdexcept>
#include <mutex>
#include <thread>
#include <xmmintrin.h>
#include <nlohmann/json.hpp>
#include "helpers.h"
#define MAX_AUDIO_CHANNELS 8
#define MAX_AV_PLANES 8
using json=nlohmann::json;
enum obs_peak_meter_type { SAMPLE_PEAK_METER, TRUE_PEAK_METER };
struct audio_data { uint8_t *data[8]{}; uint32_t frames=0; };
struct FakeSource {}; static FakeSource ownFakeSource;using OBSSourceAutoRelease=FakeSource*;
static std::atomic<uint64_t> modelClock{0};
static FakeSource* obs_weak_source_get_source(FakeSource* p){return p;}
static const char* obs_source_get_name(FakeSource*){return "QA Meter OwnA";}
static const char* obs_source_get_uuid(FakeSource*){return "11111111-2222-3333-4444-555555555555";}
static uint64_t os_gettime_ns(){return modelClock.load();}
static constexpr int LOG_WARNING=1;static void blog(int,const char*,...){}
class BaselineModel { public:
std::atomic<obs_peak_meter_type> PeakMeterType{SAMPLE_PEAK_METER};FakeSource* _input=&ownFakeSource; std::mutex _mutex; bool _muted=false; std::atomic<float> _volume{1.0f};
int _channels=0; float _magnitude[8]{}; float _peak[8]{}; float _previousSamples[8][4] = {}; std::atomic<uint64_t> _lastUpdate{0};
json GetMeterData();void ResetAudioLevels();void ProcessAudioChannels(const audio_data*);void ProcessPeak(const audio_data*);void ProcessMagnitude(const audio_data*);
};
json BaselineModel::GetMeterData()
{
	json ret;

	OBSSourceAutoRelease input = obs_weak_source_get_source(_input);
	if (!input) {
		blog(LOG_WARNING,
		     "[Utils::Obs::VolumeMeter::Meter::GetMeterData] Failed to get strong reference to input. Has it been destroyed?");
		return ret;
	}

	std::vector<std::vector<float>> levels;
	const float volume = _muted ? 0.0f : _volume.load();

	std::unique_lock<std::mutex> l(_mutex);

	if (_lastUpdate != 0 && (os_gettime_ns() - _lastUpdate) * 0.000000001 > 0.3)
		ResetAudioLevels();

	for (int channel = 0; channel < _channels; channel++) {
		std::vector<float> level;
		level.push_back(_magnitude[channel] * volume);
		level.push_back(_peak[channel] * volume);
		level.push_back(_peak[channel]);

		levels.push_back(level);
	}
	l.unlock();

	ret["inputName"] = obs_source_get_name(input);
	ret["inputUuid"] = obs_source_get_uuid(input);
	ret["inputLevelsMul"] = levels;

	return ret;
}
void BaselineModel::ResetAudioLevels()
{
	_lastUpdate = 0;
	for (int channelNumber = 0; channelNumber < MAX_AUDIO_CHANNELS; channelNumber++) {
		_magnitude[channelNumber] = 0;
		_peak[channelNumber] = 0;
	}
}
void BaselineModel::ProcessAudioChannels(const struct audio_data *data)
{
	int channels = 0;
	for (int i = 0; i < MAX_AV_PLANES; i++) {
		if (data->data[i])
			channels++;
	}

	bool channelsChanged = _channels != channels;
	_channels = std::clamp(channels, 0, MAX_AUDIO_CHANNELS);

	if (channelsChanged)
		ResetAudioLevels();
}
void BaselineModel::ProcessPeak(const struct audio_data *data)
{
	size_t sampleCount = data->frames;
	int channelNumber = 0;

	for (int planeNumber = 0; channelNumber < _channels; planeNumber++) {
		float *samples = (float *)data->data[planeNumber];
		if (!samples)
			continue;

		if (((uintptr_t)samples & 0xf) > 0) {
			_peak[channelNumber] = 1.0f;
			channelNumber++;
			continue;
		}

		__m128 previousSamples = _mm_loadu_ps(_previousSamples[channelNumber]);

		float peak;
		switch (PeakMeterType) {
		default:
		case SAMPLE_PEAK_METER:
			peak = GetSamplePeak(previousSamples, samples, sampleCount);
			break;
		case TRUE_PEAK_METER:
			peak = GetTruePeak(previousSamples, samples, sampleCount);
			break;
		}

		switch (sampleCount) {
		case 0:
			break;
		case 1:
			_previousSamples[channelNumber][0] = _previousSamples[channelNumber][1];
			_previousSamples[channelNumber][1] = _previousSamples[channelNumber][2];
			_previousSamples[channelNumber][2] = _previousSamples[channelNumber][3];
			_previousSamples[channelNumber][3] = samples[sampleCount - 1];
			break;
		case 2:
			_previousSamples[channelNumber][0] = _previousSamples[channelNumber][2];
			_previousSamples[channelNumber][1] = _previousSamples[channelNumber][3];
			_previousSamples[channelNumber][2] = samples[sampleCount - 2];
			_previousSamples[channelNumber][3] = samples[sampleCount - 1];
			break;
		case 3:
			_previousSamples[channelNumber][0] = _previousSamples[channelNumber][3];
			_previousSamples[channelNumber][1] = samples[sampleCount - 3];
			_previousSamples[channelNumber][2] = samples[sampleCount - 2];
			_previousSamples[channelNumber][3] = samples[sampleCount - 1];
			break;
		default:
			_previousSamples[channelNumber][0] = samples[sampleCount - 4];
			_previousSamples[channelNumber][1] = samples[sampleCount - 3];
			_previousSamples[channelNumber][2] = samples[sampleCount - 2];
			_previousSamples[channelNumber][3] = samples[sampleCount - 1];
		}

		_peak[channelNumber] = peak;

		channelNumber++;
	}

	for (; channelNumber < MAX_AUDIO_CHANNELS; channelNumber++)
		_peak[channelNumber] = 0.0;
}
void BaselineModel::ProcessMagnitude(const struct audio_data *data)
{
	size_t sampleCount = data->frames;

	int channelNumber = 0;
	for (int planeNumber = 0; channelNumber < _channels; planeNumber++) {
		float *samples = (float *)data->data[planeNumber];
		if (!samples)
			continue;

		float sum = 0.0;
		for (size_t i = 0; i < sampleCount; i++) {
			float sample = samples[i];
			sum += sample * sample;
		}

		_magnitude[channelNumber] = std::sqrt(sum / sampleCount);

		channelNumber++;
	}
}
class FixedModel { public:
std::atomic<obs_peak_meter_type> PeakMeterType{SAMPLE_PEAK_METER};FakeSource* _input=&ownFakeSource; std::mutex _mutex; bool _muted=false; std::atomic<float> _volume{1.0f};
int _channels=0; float _magnitude[8]{}; float _peak[8]{}; float _previousSamples[8][4] = {}; std::atomic<uint64_t> _lastUpdate{0};
json GetMeterData();void ResetAudioLevels();void ProcessAudioChannels(const audio_data*);void ProcessPeak(const audio_data*);void ProcessMagnitude(const audio_data*);
};
json FixedModel::GetMeterData()
{
	json ret;

	OBSSourceAutoRelease input = obs_weak_source_get_source(_input);
	if (!input) {
		blog(LOG_WARNING,
		     "[Utils::Obs::VolumeMeter::Meter::GetMeterData] Failed to get strong reference to input. Has it been destroyed?");
		return ret;
	}

	std::vector<std::vector<float>> levels;
	std::unique_lock<std::mutex> l(_mutex);
	const float volume = _muted ? 0.0f : _volume.load();

	if (_lastUpdate != 0 && (os_gettime_ns() - _lastUpdate) * 0.000000001 > 0.3)
		ResetAudioLevels();

	for (int channel = 0; channel < _channels; channel++) {
		std::vector<float> level;
		level.push_back(_magnitude[channel] * volume);
		level.push_back(_peak[channel] * volume);
		level.push_back(_peak[channel]);

		levels.push_back(level);
	}
	l.unlock();

	ret["inputName"] = obs_source_get_name(input);
	ret["inputUuid"] = obs_source_get_uuid(input);
	ret["inputLevelsMul"] = levels;

	return ret;
}
void FixedModel::ResetAudioLevels()
{
	_lastUpdate = 0;
	for (int channelNumber = 0; channelNumber < MAX_AUDIO_CHANNELS; channelNumber++) {
		_magnitude[channelNumber] = 0;
		_peak[channelNumber] = 0;
		std::fill_n(_previousSamples[channelNumber], 4, 0.0f);
	}
}
void FixedModel::ProcessAudioChannels(const struct audio_data *data)
{
	int channels = 0;
	for (int i = 0; i < MAX_AV_PLANES; i++) {
		if (data->data[i])
			channels++;
	}

	bool channelsChanged = _channels != channels;
	_channels = std::clamp(channels, 0, MAX_AUDIO_CHANNELS);

	if (channelsChanged)
		ResetAudioLevels();
}
void FixedModel::ProcessPeak(const struct audio_data *data)
{
	size_t sampleCount = data->frames;
	if (sampleCount == 0) {
		ResetAudioLevels();
		return;
	}
	int channelNumber = 0;

	for (int planeNumber = 0; channelNumber < _channels; planeNumber++) {
		float *samples = (float *)data->data[planeNumber];
		if (!samples)
			continue;

		if (((uintptr_t)samples & 0xf) > 0) {
			_peak[channelNumber] = 1.0f;
			channelNumber++;
			continue;
		}

		__m128 previousSamples = _mm_loadu_ps(_previousSamples[channelNumber]);

		float peak;
		switch (PeakMeterType) {
		default:
		case SAMPLE_PEAK_METER:
			peak = GetSamplePeak(previousSamples, samples, sampleCount);
			break;
		case TRUE_PEAK_METER:
			peak = GetTruePeak(previousSamples, samples, sampleCount);
			break;
		}

		switch (sampleCount) {
		case 0:
			break;
		case 1:
			_previousSamples[channelNumber][0] = _previousSamples[channelNumber][1];
			_previousSamples[channelNumber][1] = _previousSamples[channelNumber][2];
			_previousSamples[channelNumber][2] = _previousSamples[channelNumber][3];
			_previousSamples[channelNumber][3] = samples[sampleCount - 1];
			break;
		case 2:
			_previousSamples[channelNumber][0] = _previousSamples[channelNumber][2];
			_previousSamples[channelNumber][1] = _previousSamples[channelNumber][3];
			_previousSamples[channelNumber][2] = samples[sampleCount - 2];
			_previousSamples[channelNumber][3] = samples[sampleCount - 1];
			break;
		case 3:
			_previousSamples[channelNumber][0] = _previousSamples[channelNumber][3];
			_previousSamples[channelNumber][1] = samples[sampleCount - 3];
			_previousSamples[channelNumber][2] = samples[sampleCount - 2];
			_previousSamples[channelNumber][3] = samples[sampleCount - 1];
			break;
		default:
			_previousSamples[channelNumber][0] = samples[sampleCount - 4];
			_previousSamples[channelNumber][1] = samples[sampleCount - 3];
			_previousSamples[channelNumber][2] = samples[sampleCount - 2];
			_previousSamples[channelNumber][3] = samples[sampleCount - 1];
		}

		_peak[channelNumber] = peak;

		channelNumber++;
	}

	for (; channelNumber < MAX_AUDIO_CHANNELS; channelNumber++)
		_peak[channelNumber] = 0.0;
}
void FixedModel::ProcessMagnitude(const struct audio_data *data)
{
	size_t sampleCount = data->frames;
	if (sampleCount == 0) {
		ResetAudioLevels();
		return;
	}

	int channelNumber = 0;
	for (int planeNumber = 0; channelNumber < _channels; planeNumber++) {
		float *samples = (float *)data->data[planeNumber];
		if (!samples)
			continue;

		float sum = 0.0;
		for (size_t i = 0; i < sampleCount; i++) {
			float sample = samples[i];
			sum += sample * sample;
		}

		_magnitude[channelNumber] = std::sqrt(sum / sampleCount);

		channelNumber++;
	}
}
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

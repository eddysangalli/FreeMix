import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../..'), own=import.meta.dirname;
const files={
 'utils/Obs_VolumeMeter.h':'42671c7717036ee922d75f23fe6958a70daf339059cd0e0bc8ba48f78fd3b0f2',
 'utils/Obs_VolumeMeter.cpp':'30be0a279b86f13dba1dec4b94d7beccd71a8e11a0f9d477368f60740314e5dc',
 'eventhandler/EventHandler.h':'3cfcad64ff5bb43179241d5d5cbccae782479b2d11f6ae311c82140c345b1c08',
 'eventhandler/EventHandler.cpp':'3b9fc2491745d9fd260a8bd5915d4096adaa9fcdab710920921090087182305c',
 'obs-websocket.cpp':'ec6a0293af56e9cd59163bb1d88926010626dca7861b9d64219859e9326a25f7'};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const texts={};
for(const [rel,pin] of Object.entries(files)){
 const b=fs.readFileSync(path.join(root,'freemix-app/plugins/obs-websocket/src',rel));
 if(sha(b)!==pin)throw Error('Baseline changed: '+rel);
 const dest=path.join(own,'baseline',rel); fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b);
 texts[rel]=b.toString().replaceAll('\r\n','\n');
}
function replace(rel,a,b){if(!texts[rel].includes(a))throw Error('Missing exact hunk: '+rel);texts[rel]=texts[rel].replace(a,b);}
const mh='utils/Obs_VolumeMeter.h', mc='utils/Obs_VolumeMeter.cpp', eh='eventhandler/EventHandler.h', ec='eventhandler/EventHandler.cpp';
replace(mh,'Handler(UpdateCallback cb, uint64_t updatePeriod = 50);','Handler(UpdateCallback cb, uint64_t updatePeriod = 50, bool captureEnabled = true);');
replace(mh,'\t\t\t\t~Handler();','\t\t\t\t~Handler();\n\n\t\t\t\tvoid SetCaptureEnabled(bool enabled, uint64_t generation);\n\t\t\t\tvoid Stop();\n\t\t\t\tvoid WaitForStop();');
replace(mh,'\t\t\t\tstd::atomic<bool> _running;','\t\t\t\tstd::atomic<bool> _running;\n\t\t\t\tstd::atomic<bool> _capturing;\n\t\t\t\tuint64_t _captureGeneration = 0; // Protected by _meterMutex\n\t\t\t\tstd::atomic<uint64_t> _captureEpoch = 0; // Published phase token');
const start=texts[mc].indexOf('Utils::Obs::VolumeMeter::Handler::Handler('),end=texts[mc].indexOf('void Utils::Obs::VolumeMeter::Handler::UpdateThread()',start);
texts[mc]=texts[mc].slice(0,start)+`Utils::Obs::VolumeMeter::Handler::Handler(UpdateCallback cb, uint64_t updatePeriod, bool captureEnabled)
	: _updateCallback(cb), _updatePeriod(updatePeriod), _running(false), _capturing(false)
{
	signal_handler_t *sh = obs_get_signal_handler();
	if (!sh)
		return;

	// Connections remain until destruction. Pause must not wait on a global signal
	// while holding EventHandler's lifecycle lock (a client callback can re-enter).
	signal_handler_connect(sh, "source_activate", Handler::InputActivateCallback, this);
	signal_handler_connect(sh, "source_deactivate", Handler::InputDeactivateCallback, this);
	_running = true;
	SetCaptureEnabled(captureEnabled, 0);
	_updateThread = std::thread(&Handler::UpdateThread, this);
	blog_debug("[Utils::Obs::VolumeMeter::Handler::Handler] Handler created.");
}

void Utils::Obs::VolumeMeter::Handler::SetCaptureEnabled(bool enabled, uint64_t generation)
{
	std::vector<MeterPtr> retired;
	bool populate = false;
	uint64_t epoch = 0;
	{
		std::unique_lock<std::mutex> l(_meterMutex);
		if (generation < _captureGeneration)
			return;
		_captureGeneration = generation;
		const bool capture = enabled && _running;
		if (_capturing == capture)
			return;
		_capturing = capture;
		epoch = ++_captureEpoch;
		if (!capture)
			retired.swap(_meters);
		else
			populate = true;
	}
	// Retire outside _meterMutex: detach acquires source signal/audio locks.
	retired.clear();
	if (!populate)
		return;
	std::vector<OBSSourceAutoRelease> inputs;
	auto enumProc = [](void *priv_data, obs_source_t *input) {
		auto inputs = static_cast<std::vector<OBSSourceAutoRelease> *>(priv_data);
		if (!obs_source_active(input) || (obs_source_get_output_flags(input) & OBS_SOURCE_AUDIO) == 0)
			return true;
		inputs->emplace_back(obs_source_get_ref(input));
		return true;
	};
	// Do not nest the libobs sources mutex under _meterMutex either.
	obs_enum_sources(enumProc, &inputs);
	for (auto &input : inputs) {
		MeterPtr candidate(new Meter(input));
		std::unique_lock<std::mutex> l(_meterMutex);
		if (_captureEpoch != epoch || !_capturing || !_running || !obs_source_active(input))
			continue;
		bool duplicate = false;
		for (auto &meter : _meters)
			if (obs_weak_source_references_source(meter->GetWeakInput(), input)) {
				duplicate = true;
				break;
			}
		if (!duplicate)
			_meters.emplace_back(std::move(candidate));
		// l unlocks before a rejected candidate dies; its source ref is still live.
	}
}

void Utils::Obs::VolumeMeter::Handler::Stop()
{
	_running = false;
	_cond.notify_all();
	SetCaptureEnabled(false, UINT64_MAX);
}

void Utils::Obs::VolumeMeter::Handler::WaitForStop()
{
	// Only final plugin teardown, never subscription/collection pause, and never
	// under EventHandler lifecycle, meter, source signal or audio callback locks.
	if (_updateThread.joinable())
		_updateThread.join();
}

Utils::Obs::VolumeMeter::Handler::~Handler()
{
	Stop();
	signal_handler_t *sh = obs_get_signal_handler();
	if (sh) {
		signal_handler_disconnect(sh, "source_activate", Handler::InputActivateCallback, this);
		signal_handler_disconnect(sh, "source_deactivate", Handler::InputDeactivateCallback, this);
	}
	WaitForStop(); // Required even after the libobs global signal handler vanished.
	blog_debug("[Utils::Obs::VolumeMeter::Handler::~Handler] Handler destroyed.");
}

`+texts[mc].slice(end);
replace(mc,'\t\tstd::unique_lock<std::mutex> l(_meterMutex);\n\t\tfor (auto &meter : _meters)', '\t\tstd::unique_lock<std::mutex> l(_meterMutex);\n\t\tif (!_capturing)\n\t\t\tcontinue;\n\t\tconst uint64_t epoch = _captureEpoch;\n\t\tfor (auto &meter : _meters)');
replace(mc,'\t\tif (_updateCallback)\n\t\t\t_updateCallback(inputs);','\t\tif (_running && _capturing && _captureEpoch == epoch && _updateCallback)\n\t\t\t_updateCallback(inputs);');
replace(mc,'\tstd::unique_lock<std::mutex> l(c->_meterMutex);\n\tc->_meters.emplace_back(std::move(new Meter(input)));',`	uint64_t epoch;
	{
		std::unique_lock<std::mutex> l(c->_meterMutex);
		if (!c->_capturing)
			return;
		epoch = c->_captureEpoch;
	}
	MeterPtr candidate(new Meter(input));
	std::unique_lock<std::mutex> l(c->_meterMutex);
	if (!c->_capturing || c->_captureEpoch != epoch || !obs_source_active(input))
		return;
	for (auto &meter : c->_meters)
		if (obs_weak_source_references_source(meter->GetWeakInput(), input))
			return;
	c->_meters.emplace_back(std::move(candidate));`);
replace(mc,'\t// Don\'t ask me why, but using std::remove_if segfaults trying this.','\tstd::vector<MeterPtr> retired;\n\t// Move under lock, detach source callbacks after l unlocks.');
replace(mc,'\t\tif (obs_weak_source_references_source(iter->get()->GetWeakInput(), input))\n\t\t\titer = c->_meters.erase(iter);','\t\tif (obs_weak_source_references_source(iter->get()->GetWeakInput(), input)) {\n\t\t\tretired.emplace_back(std::move(*iter));\n\t\t\titer = c->_meters.erase(iter);\n\t\t}');
replace(eh,'#include <atomic>','#include <atomic>\n#include <mutex>');
replace(eh,'\tvoid ProcessSubscriptionChange(bool type, uint64_t eventSubscriptions);','\tvoid ProcessSubscriptionChange(bool type, uint64_t eventSubscriptions);\n\tvoid ShutdownInputVolumeMeters(); // Final unload only: drain before resetting callbacks/API.');
replace(eh,'\tstd::unique_ptr<Utils::Obs::VolumeMeter::Handler> _inputVolumeMetersHandler;',`	// Stable dormant publisher; local shared leases cover concurrent subscription calls.
	std::shared_ptr<Utils::Obs::VolumeMeter::Handler> _inputVolumeMetersHandler;
	std::mutex _inputVolumeMetersMutex;
	bool _inputVolumeMetersSuspended = true;
	bool _inputVolumeMetersShuttingDown = false;
	uint64_t _inputVolumeMetersGeneration = 0;
	void SetInputVolumeMeterState(bool ready, bool shuttingDown = false);
	void UpdateInputVolumeMeterCapture();`);
replace(ec,'\tobs_frontend_add_event_callback(OnFrontendEvent, this);',`	// Create dormant before exposing frontend/core callbacks. No Meter/source lease
	// exists with zero subscribers, and subscription callbacks never join this thread.
	_inputVolumeMetersHandler = std::make_shared<Utils::Obs::VolumeMeter::Handler>(
		std::bind(&EventHandler::HandleInputVolumeMeters, this, std::placeholders::_1), 50, false);
	obs_frontend_add_event_callback(OnFrontendEvent, this);`);
replace(ec,'\tobs_frontend_remove_event_callback(OnFrontendEvent, this);',`	ShutdownInputVolumeMeters();
	std::shared_ptr<Utils::Obs::VolumeMeter::Handler> meters;
	{
		std::lock_guard<std::mutex> l(_inputVolumeMetersMutex);
		meters = std::move(_inputVolumeMetersHandler);
	}
	if (meters) {
		meters->Stop();
		meters->WaitForStop(); // Outside all lifecycle/signal locks, before callback teardown.
		meters.reset();
	}
	obs_frontend_remove_event_callback(OnFrontendEvent, this);`);
const ps=texts[ec].indexOf('void EventHandler::ProcessSubscriptionChange('), pe=texts[ec].indexOf('// Function required in order to use default arguments',ps);
texts[ec]=texts[ec].slice(0,ps)+`void EventHandler::SetInputVolumeMeterState(bool ready, bool shuttingDown)
{
	{
		std::lock_guard<std::mutex> l(_inputVolumeMetersMutex);
		_inputVolumeMetersShuttingDown |= shuttingDown;
		_inputVolumeMetersSuspended = !ready || _inputVolumeMetersShuttingDown;
	}
	UpdateInputVolumeMeterCapture();
}

void EventHandler::ShutdownInputVolumeMeters()
{
	SetInputVolumeMeterState(false, true);
	std::shared_ptr<Utils::Obs::VolumeMeter::Handler> meters;
	{
		std::lock_guard<std::mutex> l(_inputVolumeMetersMutex);
		meters = _inputVolumeMetersHandler;
	}
	if (meters)
		meters->WaitForStop(); // No held locks; callbacks/API are still alive.
}

void EventHandler::UpdateInputVolumeMeterCapture()
{
	std::shared_ptr<Utils::Obs::VolumeMeter::Handler> meters;
	bool enabled, stopping;
	uint64_t generation;
	{
		std::lock_guard<std::mutex> l(_inputVolumeMetersMutex);
		meters = _inputVolumeMetersHandler;
		stopping = _inputVolumeMetersShuttingDown;
		enabled = !stopping && !_inputVolumeMetersSuspended && _inputVolumeMetersRef > 0;
		generation = ++_inputVolumeMetersGeneration;
	}
	// No lifecycle lock while detaching per-source signal/audio callbacks.
	if (meters) {
		if (stopping)
			meters->Stop();
		else
			meters->SetCaptureEnabled(enabled, generation);
	}
}

void EventHandler::ProcessSubscriptionChange(bool type, uint64_t eventSubscriptions)
{
	if ((eventSubscriptions & EventSubscription::InputVolumeMeters) != 0) {
		{
			std::lock_guard<std::mutex> l(_inputVolumeMetersMutex);
			if (type)
				_inputVolumeMetersRef++;
			else if (_inputVolumeMetersRef > 0)
				_inputVolumeMetersRef--;
			else
				blog(LOG_WARNING, "[EventHandler::ProcessSubscription] Unmatched input meter unsubscribe!");
		}
		UpdateInputVolumeMeterCapture();
	}
	if (type) {
		if ((eventSubscriptions & EventSubscription::InputActiveStateChanged) != 0)
			_inputActiveStateChangedRef++;
		if ((eventSubscriptions & EventSubscription::InputShowStateChanged) != 0)
			_inputShowStateChangedRef++;
		if ((eventSubscriptions & EventSubscription::SceneItemTransformChanged) != 0)
			_sceneItemTransformChangedRef++;
	} else {
		if ((eventSubscriptions & EventSubscription::InputActiveStateChanged) != 0)
			_inputActiveStateChangedRef--;
		if ((eventSubscriptions & EventSubscription::InputShowStateChanged) != 0)
			_inputShowStateChangedRef--;
		if ((eventSubscriptions & EventSubscription::SceneItemTransformChanged) != 0)
			_sceneItemTransformChangedRef--;
	}
}

`+texts[ec].slice(pe);
replace(ec,'\t\teventHandler->HandleCurrentSceneCollectionChanging();','\t\teventHandler->SetInputVolumeMeterState(false);\n\t\teventHandler->HandleCurrentSceneCollectionChanging();');
replace(ec,'\t\teventHandler->HandleCurrentSceneCollectionChanged();','\t\teventHandler->SetInputVolumeMeterState(true);\n\t\teventHandler->HandleCurrentSceneCollectionChanged();');
replace(ec,'\t_obsReadyCallback(true);\n\n\tblog_debug', '\t_obsReadyCallback(true);\n\tSetInputVolumeMeterState(true);\n\n\tblog_debug');
replace(ec,'\tHandleExitStarted();','\tSetInputVolumeMeterState(false, true);\n\tHandleExitStarted();');
replace('obs-websocket.cpp','\t// Shutdown the WebSocket server if it is running','\t// Drain the publisher before stopping/resetting ANY inline OnEvent target.\n\t_eventHandler->ShutdownInputVolumeMeters();\n\n\t// Shutdown the WebSocket server if it is running');
const receipts=[];
for(const [rel,t] of Object.entries(texts)){
 const draft=path.join(own,'draft',rel); fs.mkdirSync(path.dirname(draft),{recursive:true});fs.writeFileSync(draft,t.replaceAll('\n','\r\n'));
 const patch=path.join(own,'patches',rel.replaceAll('/','__')+'.patch');fs.mkdirSync(path.dirname(patch),{recursive:true});
 const d=spawnSync('git',['diff','--no-index','--binary','--','baseline/'+rel,'draft/'+rel],{cwd:own});
 if(d.status!==1)throw Error('Expected changed hunk');fs.writeFileSync(patch,d.stdout);
 const c=spawnSync('git',['apply','--check','--unsafe-paths','-p2',patch],{cwd:path.join(own,'baseline')});
 if(c.status!==0)throw Error(c.stderr.toString());
 receipts.push({path:rel,before:files[rel],after:sha(fs.readFileSync(draft)),ownPatchCheck:true});
}
fs.writeFileSync(path.join(own,'PREP.json'),JSON.stringify({scope:'offside plugin draft only; canonical untouched',files:receipts,nativeExecuted:false,compiled:false},null,2)+'\n');
console.log(JSON.stringify({prepared:receipts.length,patchChecks:receipts.length}));

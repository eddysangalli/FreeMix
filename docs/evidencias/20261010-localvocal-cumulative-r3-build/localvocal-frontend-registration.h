// FreeMix downstream lifecycle delta. Frontend vector mutations stay on the UI task.
#pragma once

#include <obs-module.h>
#include <obs-frontend-api.h>
#include <mutex>

#include "transcription-filter-data.h"
#include "transcription-filter-callbacks.h"

struct LocalVocalFrontendRegistration {
	std::mutex borrow_mutex;
	transcription_filter_data *filter;
	bool registered_on_ui = false;

	explicit LocalVocalFrontendRegistration(transcription_filter_data *value) : filter(value) {}
};

// OBSStudioAPI dispatches these frontend events on its UI thread. No gf pointer
// is stored in the frontend vector: only this independently retired ticket.
static void localvocal_recording_frontend_event(enum obs_frontend_event event, void *data)
{
	auto *registration = static_cast<LocalVocalFrontendRegistration *>(data);
	std::lock_guard<std::mutex> borrow(registration->borrow_mutex);
	if (registration->filter)
		recording_state_callback(event, registration->filter);
}

static void localvocal_register_frontend_on_ui(void *data)
{
	auto *registration = static_cast<LocalVocalFrontendRegistration *>(data);
	std::lock_guard<std::mutex> borrow(registration->borrow_mutex);
	if (!registration->filter) return; // Destroy may retire before this task runs.
	obs_frontend_add_event_callback(localvocal_recording_frontend_event, registration);
	registration->registered_on_ui = true;
}

static void localvocal_unregister_frontend_on_ui(void *data)
{
	auto *registration = static_cast<LocalVocalFrontendRegistration *>(data);
	if (registration->registered_on_ui)
		obs_frontend_remove_event_callback(localvocal_recording_frontend_event, registration);
	// Register/event/unregister all use the same UI thread, so no callback is in
	// flight here. Source destruction already retired filter under borrow_mutex.
	delete registration;
}

static void localvocal_register_frontend_callback(transcription_filter_data *gf)
{
	auto *registration = new LocalVocalFrontendRegistration(gf);
	gf->frontend_registration = registration;
	obs_queue_task(OBS_TASK_UI, localvocal_register_frontend_on_ui, registration, false);
}

static void localvocal_retire_frontend_registration(transcription_filter_data *gf)
{
	auto *registration = gf->frontend_registration;
	if (!registration) return;
	gf->frontend_registration = nullptr;
	{
		std::lock_guard<std::mutex> borrow(registration->borrow_mutex);
		registration->filter = nullptr;
	}
	// No Qt wait, no detach, no source ref cycle. ClearSceneData pumps queued UI
	// tasks after the destroy queue and before frontend API teardown in this fork.
	obs_queue_task(OBS_TASK_UI, localvocal_unregister_frontend_on_ui, registration, false);
}

#pragma once
#include <obs.h>
void FreeMixCallAudioRequest(obs_data_t *request, obs_data_t *response, void *);
void FreeMixCallAudioStop();
void FreeMixCallAudioTick();
void FreeMixCallAudioDirector(const char *uuid, const char *lease);

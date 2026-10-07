#include "ReplaySourceIntegration.h"
#include "FreeMixPlugin.h"

#include <obs-frontend-api.h>
#include <obs.h>
#include <util/base.h>

ReplaySourceIntegration::ReplaySourceIntegration(FreeMixPlugin* plugin, QObject* parent)
    : QObject(parent), m_plugin(plugin)
{
}

ReplaySourceIntegration::~ReplaySourceIntegration()
{
    shutdown();
}

bool ReplaySourceIntegration::initialize()
{
    m_available = findReplaySourceKind();
    if (m_available) {
        blog(LOG_INFO, "[FreeMix] Replay Source found: %s", m_replaySourceKind.toUtf8().constData());
    } else {
        blog(LOG_WARNING, "[FreeMix] Replay Source not available");
    }
    emit availabilityChanged(m_available);
    return m_available;
}

void ReplaySourceIntegration::shutdown()
{
    m_available = false;
}

bool ReplaySourceIntegration::isAvailable() const
{
    return m_available;
}

bool ReplaySourceIntegration::findReplaySourceKind()
{
    const char* kinds = obs_get_input_kind_list();
    if (kinds && strstr(kinds, "replay_source")) {
        return true;
    }
    return false;
}

bool ReplaySourceIntegration::createReplayAngle(const QString& cameraScene, const QString& replayName, int durationSeconds)
{
    if (!m_available) return false;

    obs_source_t* cameraSource = obs_get_source_by_name(cameraScene.toUtf8().constData());
    if (!cameraSource) {
        blog(LOG_ERROR, "[FreeMix] Camera scene not found: %s", cameraScene.toUtf8().constData());
        return false;
    }

    QString replaySceneName = "REPLAY " + cameraScene;
    QString replayInputName = "Replay " + cameraScene;

    obs_data_t* settings = obs_data_create();
    obs_data_set_string(settings, "source", cameraScene.toUtf8().constData());
    obs_data_set_int(settings, "duration", durationSeconds * 1000);
    obs_data_set_int(settings, "replays", 2);
    obs_data_set_int(settings, "speed_percent", 100);

    obs_source_t* replaySource = obs_source_create(m_replaySourceKind.toUtf8().constData(),
                                                   replayInputName.toUtf8().constData(),
                                                   settings, nullptr);
    obs_data_release(settings);

    if (!replaySource) {
        obs_source_release(cameraSource);
        blog(LOG_ERROR, "[FreeMix] Failed to create replay source");
        return false;
    }

    obs_scene_t* scene = obs_scene_create(replaySceneName.toUtf8().constData());
    if (scene) {
        obs_scene_add(scene, replaySource);
        obs_scene_release(scene);
    }

    obs_source_release(replaySource);
    obs_source_release(cameraSource);

    emit replayCreated(replayName);
    blog(LOG_INFO, "[FreeMix] Created replay angle: %s from %s (%ds)", replayName.toUtf8().constData(), cameraScene.toUtf8().constData(), durationSeconds);
    return true;
}

bool ReplaySourceIntegration::triggerReplay(const QString& replayName)
{
    if (!m_available) return false;

    obs_source_t* source = obs_get_source_by_name(replayName.toUtf8().constData());
    if (!source) return false;

    obs_hotkey_t* hotkey = obs_hotkey_find_by_name("ReplaySource.Replay");
    if (hotkey) {
        obs_hotkey_trigger(hotkey);
    }

    obs_source_release(source);
    emit replayTriggered(replayName);
    return true;
}

bool ReplaySourceIntegration::setReplaySpeed(const QString& replayName, int speedPercent)
{
    if (!m_available) return false;

    obs_source_t* source = obs_get_source_by_name(replayName.toUtf8().constData());
    if (!source) return false;

    obs_data_t* settings = obs_data_create();
    obs_data_set_int(settings, "speed_percent", speedPercent);
    bool success = obs_source_update(source, settings);
    obs_data_release(settings);
    obs_source_release(source);
    return success;
}

bool ReplaySourceIntegration::playReplay(const QString& replayName)
{
    if (!m_available) return false;

    obs_source_t* source = obs_get_source_by_name(replayName.toUtf8().constData());
    if (!source) return false;

    obs_source_media_play_pause(source);
    obs_source_release(source);
    return true;
}

bool ReplaySourceIntegration::pauseReplay(const QString& replayName)
{
    if (!m_available) return false;

    obs_source_t* source = obs_get_source_by_name(replayName.toUtf8().constData());
    if (!source) return false;

    obs_source_media_play_pause(source);
    obs_source_release(source);
    return true;
}

bool ReplaySourceIntegration::stopReplay(const QString& replayName)
{
    if (!m_available) return false;

    obs_source_t* source = obs_get_source_by_name(replayName.toUtf8().constData());
    if (!source) return false;

    obs_source_media_stop(source);
    obs_source_release(source);
    return true;
}

QStringList ReplaySourceIntegration::getReplayAngles() const
{
    QStringList angles;
    // Would need to enumerate scenes and find replay_source inputs
    return angles;
}
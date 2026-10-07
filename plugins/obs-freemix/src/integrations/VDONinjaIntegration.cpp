#include "VDONinjaIntegration.h"
#include "FreeMixPlugin.h"
#include "AudioBusManager.h"
#include "OutputManager.h"

#include <obs-frontend-api.h>
#include <obs.h>
#include <QRandomGenerator>
#include <QUrl>
#include <QDateTime>
#include <QDebug>

VDONinjaIntegration::VDONinjaIntegration(FreeMixPlugin* plugin, QObject* parent)
    : QObject(parent), m_plugin(plugin)
{
}

VDONinjaIntegration::~VDONinjaIntegration()
{
    shutdown();
}

bool VDONinjaIntegration::initialize()
{
    const char* kinds = obs_get_input_kind_list();
    if (kinds && strstr(kinds, "browser_source")) {
        m_available = true;
        blog(LOG_INFO, "[FreeMix] VDO.Ninja integration available (browser_source)");
    } else {
        m_available = false;
        blog(LOG_WARNING, "[FreeMix] browser_source not available for VDO.Ninja");
    }
    emit availabilityChanged(m_available);
    return m_available;
}

void VDONinjaIntegration::shutdown()
{
    for (auto it = m_calls.begin(); it != m_calls.end(); ++it) {
        removeCall(it.key());
    }
    m_calls.clear();
    m_available = false;
}

bool VDONinjaIntegration::isAvailable() const
{
    return m_available;
}

QString VDONinjaIntegration::generateCallId(const QString& prefix)
{
    return prefix + generateRandomId();
}

QString VDONinjaIntegration::getViewUrl(const QString& callId, bool cleanOutput)
{
    QString url = QString("https://vdo.ninja/?view=%1").arg(callId);
    if (cleanOutput) {
        url += "&cleanoutput";
    }
    return url;
}

QString VDONinjaIntegration::getGuestUrl(const QString& callId, const QString& label)
{
    QString encodedLabel = QUrl::toPercentEncoding(label);
    return QString("https://vdo.ninja/?push=%1&webcam&label=%2").arg(callId, encodedLabel);
}

QString VDONinjaIntegration::getGuestReturnUrl(const QString& callId, const QString& label)
{
    QString encodedLabel = QUrl::toPercentEncoding(label);
    QString returnId = callId + "_ret";
    return QString("https://vdo.ninja/?push=%1&webcam&label=%2&view=%3&mixminus=1").arg(callId, encodedLabel, returnId);
}

QString VDONinjaIntegration::getReturnUrl(const QString& callId, const QString& label)
{
    QString encodedLabel = QUrl::toPercentEncoding(label);
    QString returnId = callId + "_ret";
    return QString("https://vdo.ninja/?push=%1&webcam&label=%2&mixminus=1").arg(returnId, encodedLabel);
}

bool VDONinjaIntegration::createBrowserSourceForCall(const QString& callId, const QString& sourceName, int width, int height)
{
    if (!m_available) return false;

    QString viewUrl = getViewUrl(callId);

    obs_data_t* settings = obs_data_create();
    obs_data_set_string(settings, "url", viewUrl.toUtf8().constData());
    obs_data_set_int(settings, "width", width);
    obs_data_set_int(settings, "height", height);
    obs_data_set_bool(settings, "reroute_audio", true);
    obs_data_set_bool(settings, "shutdown", false);
    obs_data_set_bool(settings, "restart_when_active", false);

    obs_source_t* source = obs_source_create("browser_source", sourceName.toUtf8().constData(), settings, nullptr);
    obs_data_release(settings);

    if (!source) {
        blog(LOG_ERROR, "[FreeMix] Failed to create browser source for VDO.Ninja call");
        return false;
    }

    obs_source_release(source);
    emit callCreated(callId, sourceName);
    return true;
}

bool VDONinjaIntegration::startCall(const QString& callId)
{
    Q_UNUSED(callId);
    return true;
}

bool VDONinjaIntegration::stopCall(const QString& callId)
{
    Q_UNUSED(callId);
    return true;
}

bool VDONinjaIntegration::createCall(const QString& callId, const QString& guestName, const QString& returnVideoSource)
{
    if (!m_available) return false;
    if (m_calls.contains(callId)) return false;

    CallGuest guest;
    guest.id = QUuid::createUuid().toString(QUuid::WithoutBraces);
    guest.name = guestName;
    guest.callId = callId;
    guest.sourceName = QString("FreeMix Call: %1").arg(guestName);
    guest.videoSourceName = QString("FreeMix Call Video: %1").arg(guestName);
    guest.audioSourceName = QString("FreeMix Call Audio: %1").arg(guestName);
    guest.returnVideoSource = returnVideoSource;
    guest.returnAudioBus = m_settings.defaultReturnAudioBus;
    guest.qualityProfile = m_settings.qualityProfile;
    guest.connectionState = "connecting";

    if (!createBrowserSourceForCall(callId, guest.videoSourceName)) {
        return false;
    }

    AudioBusManager* audioBus = m_plugin->audioBusManager();
    if (audioBus) {
        audioBus->configureMixMinusForGuest(guest.audioSourceName);
        audioBus->configureStudioSourcesForReturn();
    }

    m_calls[callId] = guest;
    emit callCreated(callId, guest.videoSourceName);
    return true;
}

bool VDONinjaIntegration::removeCall(const QString& callId)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];

    if (guest.connected) {
        stopCall(callId);
    }

    obs_source_t* videoSrc = obs_get_source_by_name(guest.videoSourceName.toUtf8().constData());
    if (videoSrc) {
        obs_source_remove(videoSrc);
        obs_source_release(videoSrc);
    }

    obs_source_t* audioSrc = obs_get_source_by_name(guest.audioSourceName.toUtf8().constData());
    if (audioSrc) {
        obs_source_remove(audioSrc);
        obs_source_release(audioSrc);
    }

    removeReturnSources(callId);

    m_calls.remove(callId);
    emit callRemoved(callId);
    return true;
}

VDONinjaIntegration::CallGuest* VDONinjaIntegration::getCall(const QString& callId)
{
    return m_calls.contains(callId) ? &m_calls[callId] : nullptr;
}

QVector<VDONinjaIntegration::CallGuest*> VDONinjaIntegration::getAllCalls() const
{
    QVector<CallGuest*> result;
    for (auto it = m_calls.constBegin(); it != m_calls.constEnd(); ++it) {
        result.append(const_cast<CallGuest*>(&it.value()));
    }
    return result;
}

bool VDONinjaIntegration::setGuestReturnVideo(const QString& callId, const QString& videoSource)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];
    if (guest.returnVideoSource == videoSource) return true;

    guest.returnVideoSource = videoSource;

    if (guest.returnVideoEnabled) {
        createReturnVideoSource(callId, videoSource);
    }

    emit returnVideoSourceChanged(callId, videoSource);
    return true;
}

bool VDONinjaIntegration::setGuestReturnAudioBus(const QString& callId, const QString& audioBus)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];
    if (guest.returnAudioBus == audioBus) return true;

    guest.returnAudioBus = audioBus;

    if (guest.returnAudioEnabled) {
        createReturnAudioSource(callId, audioBus);
    }

    emit returnAudioBusChanged(callId, audioBus);
    return true;
}

bool VDONinjaIntegration::setGuestInProgram(const QString& callId, bool inProgram)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];
    if (guest.inProgram == inProgram) return true;

    guest.inProgram = inProgram;

    AudioBusManager* audioBus = m_plugin->audioBusManager();
    if (audioBus && guest.connected) {
        uint32_t tracks = audioBus->getSourceTracks(guest.audioSourceName);
        if (inProgram) {
            tracks |= (1 << 0);
        } else {
            tracks &= ~(1 << 0);
        }
        audioBus->setSourceTracks(guest.audioSourceName, tracks);
    }

    return true;
}

bool VDONinjaIntegration::setGuestInPreview(const QString& callId, bool inPreview)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];
    guest.inPreview = inPreview;
    return true;
}

bool VDONinjaIntegration::setGuestVideoEnabled(const QString& callId, bool enabled)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];
    if (guest.videoEnabled == enabled) return true;

    guest.videoEnabled = enabled;

    obs_source_t* src = obs_get_source_by_name(guest.videoSourceName.toUtf8().constData());
    if (src) {
        obs_source_set_enabled(src, enabled);
        obs_source_release(src);
    }

    return true;
}

bool VDONinjaIntegration::setGuestAudioEnabled(const QString& callId, bool enabled)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];
    if (guest.audioEnabled == enabled) return true;

    guest.audioEnabled = enabled;

    obs_source_t* src = obs_get_source_by_name(guest.audioSourceName.toUtf8().constData());
    if (src) {
        obs_source_set_muted(src, !enabled);
        obs_source_release(src);
    }

    return true;
}

bool VDONinjaIntegration::setGuestReturnVideoEnabled(const QString& callId, bool enabled)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];
    if (guest.returnVideoEnabled == enabled) return true;

    guest.returnVideoEnabled = enabled;

    if (enabled) {
        createReturnVideoSource(callId, guest.returnVideoSource);
    } else {
        QString retVideoName = generateReturnVideoSourceName(callId);
        obs_source_t* src = obs_get_source_by_name(retVideoName.toUtf8().constData());
        if (src) {
            obs_source_remove(src);
            obs_source_release(src);
        }
    }

    return true;
}

bool VDONinjaIntegration::setGuestReturnAudioEnabled(const QString& callId, bool enabled)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];
    if (guest.returnAudioEnabled == enabled) return true;

    guest.returnAudioEnabled = enabled;

    if (enabled) {
        createReturnAudioSource(callId, guest.returnAudioBus);
    } else {
        QString retAudioName = generateReturnAudioSourceName(callId);
        obs_source_t* src = obs_get_source_by_name(retAudioName.toUtf8().constData());
        if (src) {
            obs_source_remove(src);
            obs_source_release(src);
        }
    }

    return true;
}

bool VDONinjaIntegration::setGuestReturnVolumes(const QString& callId, float videoVol, float audioVol)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];
    guest.returnVideoVolume = qBound(0.0f, videoVol, 1.0f);
    guest.returnAudioVolume = qBound(0.0f, audioVol, 1.0f);

    QString retVideoName = generateReturnVideoSourceName(callId);
    obs_source_t* videoSrc = obs_get_source_by_name(retVideoName.toUtf8().constData());
    if (videoSrc) {
        obs_source_set_volume(videoSrc, guest.returnVideoVolume);
        obs_source_release(videoSrc);
    }

    QString retAudioName = generateReturnAudioSourceName(callId);
    obs_source_t* audioSrc = obs_get_source_by_name(retAudioName.toUtf8().constData());
    if (audioSrc) {
        obs_source_set_volume(audioSrc, guest.returnAudioVolume);
        obs_source_release(audioSrc);
    }

    return true;
}

bool VDONinjaIntegration::updateGuestConnectionState(const QString& callId, const QString& state)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];
    if (guest.connectionState == state) return true;

    QString oldState = guest.connectionState;
    guest.connectionState = state;
    guest.lastStatsUpdate = QDateTime::currentMSecsSinceEpoch();

    if (oldState != "connected" && state == "connected") {
        guest.connected = true;
        emit guestConnected(callId);

        AudioBusManager* audioBus = m_plugin->audioBusManager();
        if (audioBus) {
            audioBus->configureMixMinusForGuest(guest.audioSourceName);
        }

        if (guest.returnVideoEnabled) {
            createReturnVideoSource(callId, guest.returnVideoSource);
        }
        if (guest.returnAudioEnabled) {
            createReturnAudioSource(callId, guest.returnAudioBus);
        }
    } else if (oldState == "connected" && state != "connected") {
        guest.connected = false;
        emit guestDisconnected(callId);
        removeReturnSources(callId);
    }

    emit guestStateChanged(callId, state);
    return true;
}

bool VDONinjaIntegration::updateGuestStats(const QString& callId, const QMap<QString, QVariant>& stats)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];
    guest.stats = stats;
    guest.lastStatsUpdate = QDateTime::currentMSecsSinceEpoch();
    emit guestStatsUpdated(callId, stats);
    return true;
}

void VDONinjaIntegration::setSettings(const CallSettings& settings)
{
    m_settings = settings;
}

bool VDONinjaIntegration::createReturnVideoSource(const QString& callId, const QString& videoSource)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];
    QString retVideoName = generateReturnVideoSourceName(callId);

    obs_source_t* existing = obs_get_source_by_name(retVideoName.toUtf8().constData());
    if (existing) {
        obs_source_release(existing);
        return true;
    }

    QString sourceToUse = videoSource;
    if (sourceToUse == "PROGRAM") {
        sourceToUse = "PROGRAM";
    } else if (sourceToUse == "PREVIEW") {
        sourceToUse = "PREVIEW";
    } else if (sourceToUse == "CLEANFEED") {
        sourceToUse = "CLEANFEED";
    }

    obs_data_t* settings = obs_data_create();
    obs_data_set_string(settings, "source", sourceToUse.toUtf8().constData());
    obs_data_set_bool(settings, "reroute_audio", false);

    obs_source_t* source = obs_source_create("monitor_capture", retVideoName.toUtf8().constData(), settings, nullptr);
    obs_data_release(settings);

    if (!source) {
        blog(LOG_ERROR, "[FreeMix] Failed to create return video monitor for call %s", callId.toUtf8().constData());
        return false;
    }

    obs_source_set_volume(source, guest.returnVideoVolume);
    obs_source_release(source);

    blog(LOG_INFO, "[FreeMix] Created return video source '%s' for call %s from %s",
         retVideoName.toUtf8().constData(), callId.toUtf8().constData(), videoSource.toUtf8().constData());
    return true;
}

bool VDONinjaIntegration::createReturnAudioSource(const QString& callId, const QString& audioBus)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];
    QString retAudioName = generateReturnAudioSourceName(callId);

    obs_source_t* existing = obs_get_source_by_name(retAudioName.toUtf8().constData());
    if (existing) {
        obs_source_release(existing);
        return true;
    }

    AudioBusManager* busManager = m_plugin->audioBusManager();
    if (!busManager) return false;

    int trackIndex = 1;
    if (audioBus == "Aux A" || audioBus == "Aux A (Mix-Minus Retorno)") {
        trackIndex = 2;
    } else if (audioBus == "Aux B" || audioBus == "Aux B (Fones / Direção)") {
        trackIndex = 3;
    }

    obs_data_t* settings = obs_data_create();
    obs_data_set_int(settings, "monitor_type", 2); // OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT

    obs_source_t* source = obs_source_create("audio_monitor", retAudioName.toUtf8().constData(), settings, nullptr);
    obs_data_release(settings);

    if (!source) {
        blog(LOG_ERROR, "[FreeMix] Failed to create return audio monitor for call %s", callId.toUtf8().constData());
        return false;
    }

    obs_source_set_audio_mixers(source, (1 << (trackIndex - 1)));
    obs_source_set_volume(source, guest.returnAudioVolume);
    obs_source_release(source);

    blog(LOG_INFO, "[FreeMix] Created return audio source '%s' for call %s from bus %s (track %d)",
         retAudioName.toUtf8().constData(), callId.toUtf8().constData(), audioBus.toUtf8().constData(), trackIndex);
    return true;
}

void VDONinjaIntegration::removeReturnSources(const QString& callId)
{
    QString retVideoName = generateReturnVideoSourceName(callId);
    obs_source_t* videoSrc = obs_get_source_by_name(retVideoName.toUtf8().constData());
    if (videoSrc) {
        obs_source_remove(videoSrc);
        obs_source_release(videoSrc);
    }

    QString retAudioName = generateReturnAudioSourceName(callId);
    obs_source_t* audioSrc = obs_get_source_by_name(retAudioName.toUtf8().constData());
    if (audioSrc) {
        obs_source_remove(audioSrc);
        obs_source_release(audioSrc);
    }
}

bool VDONinjaIntegration::sendTalkback(const QString& callId, bool enable, float duckLevel)
{
    if (!m_calls.contains(callId)) return false;

    CallGuest& guest = m_calls[callId];
    QString talkbackName = QString("Talkback: %1").arg(guest.name);

    obs_source_t* src = obs_get_source_by_name(talkbackName.toUtf8().constData());

    if (enable) {
        if (!src) {
            obs_data_t* settings = obs_data_create();
            obs_data_set_string(settings, "device_id", "default");
            obs_data_set_int(settings, "sample_rate", 48000);

            src = obs_source_create("wasapi_input_capture", talkbackName.toUtf8().constData(), settings, nullptr);
            obs_data_release(settings);

            if (src) {
                obs_source_set_audio_mixers(src, (1 << 3));
                obs_source_set_volume(src, 1.0f);
            }
        }
    } else if (src) {
        obs_source_remove(src);
        obs_source_release(src);
        src = nullptr;
    }

    if (src) obs_source_release(src);

    if (enable && duckLevel > 0.0f && m_plugin->audioBusManager()) {
        m_plugin->audioBusManager()->duckReturnBuses(duckLevel);
    } else if (!enable && m_plugin->audioBusManager()) {
        m_plugin->audioBusManager()->restoreReturnBuses();
    }

    emit talkbackStateChanged(callId, enable);
    return true;
}

bool VDONinjaIntegration::sendTalkbackToAll(bool enable, float duckLevel)
{
    bool success = true;
    for (auto it = m_calls.begin(); it != m_calls.end(); ++it) {
        if (it.value().connected) {
            success &= sendTalkback(it.key(), enable, duckLevel);
        }
    }
    return success;
}

bool VDONinjaIntegration::sendTalkbackToGroup(const QStringList& callIds, bool enable, float duckLevel)
{
    bool success = true;
    for (const QString& callId : callIds) {
        if (m_calls.contains(callId) && m_calls[callId].connected) {
            success &= sendTalkback(callId, enable, duckLevel);
        }
    }
    return success;
}

QString VDONinjaIntegration::generateRandomId(int length)
{
    const QString chars = "abcdefghjkmnpqrstuvwxyz23456789";
    QString result;
    result.reserve(length);
    for (int i = 0; i < length; ++i) {
        result += chars[QRandomGenerator::global()->bounded(chars.length())];
    }
    return result;
}

QString VDONinjaIntegration::generateReturnVideoSourceName(const QString& callId) const
{
    return QString("FreeMix Return Video: %1").arg(callId);
}

QString VDONinjaIntegration::generateReturnAudioSourceName(const QString& callId) const
{
    return QString("FreeMix Return Audio: %1").arg(callId);
}

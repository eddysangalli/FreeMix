#include "AudioBusManager.h"
#include "../FreeMixPlugin.h"
#include <QDebug>

AudioBusManager::AudioBusManager(FreeMixPlugin* plugin, QObject* parent)
    : QObject(parent)
    , m_plugin(plugin)
{
}

AudioBusManager::~AudioBusManager()
{
    shutdown();
}

bool AudioBusManager::initialize()
{
    setupDefaultBuses();
    return true;
}

void AudioBusManager::shutdown()
{
    m_buses.clear();
    m_guestConfigs.clear();
    m_originalReturnVolumes.clear();
}

void AudioBusManager::setupDefaultBuses()
{
    m_buses.clear();

    AudioBus master;
    master.trackIndex = 1;
    master.name = "Master (PGM)";
    master.description = "Transmiss\u00e3o principal, grava\u00e7\u00e3o e sa\u00eddas de programa";
    master.isMixMinus = false;
    m_buses.append(master);

    AudioBus auxA;
    auxA.trackIndex = 2;
    auxA.name = "Aux A (Mix-Minus Retorno)";
    auxA.description = "Retorno para convidados remotos com voz pr\u00f3pria exclu\u00edda";
    auxA.isMixMinus = true;
    m_buses.append(auxA);

    AudioBus auxB;
    auxB.trackIndex = 3;
    auxB.name = "Aux B (Fones / Dire\u00e7\u00e3o)";
    auxB.description = "Monitora\u00e7\u00e3o isolada da dire\u00e7\u00e3o e operadores";
    auxB.isMixMinus = false;
    m_buses.append(auxB);

    AudioBus auxC;
    auxC.trackIndex = 4;
    auxC.name = "Aux C (Comunica\u00e7\u00e3o Interna)";
    auxC.description = "Barramento para talkback e comunica\u00e7\u00e3o de produ\u00e7\u00e3o";
    auxC.isMixMinus = false;
    m_buses.append(auxC);

    AudioBus auxD;
    auxD.trackIndex = 5;
    auxD.name = "Aux D (Reserva)";
    auxD.description = "Barramento auxiliar reservado";
    auxD.isMixMinus = false;
    m_buses.append(auxD);

    AudioBus auxE;
    auxE.trackIndex = 6;
    auxE.name = "Aux E (Reserva)";
    auxE.description = "Barramento auxiliar reservado";
    auxE.isMixMinus = false;
    m_buses.append(auxE);
}

bool AudioBusManager::setSourceTracks(const QString& sourceName, uint32_t tracksBitmask)
{
    obs_source_t* src = obs_get_source_by_name(sourceName.toUtf8().constData());
    if (!src) return false;

    obs_source_set_audio_mixers(src, tracksBitmask);
    obs_source_release(src);

    emit routingUpdated(sourceName, tracksBitmask);
    return true;
}

uint32_t AudioBusManager::getSourceTracks(const QString& sourceName) const
{
    obs_source_t* src = obs_get_source_by_name(sourceName.toUtf8().constData());
    if (!src) return 0;

    uint32_t mixers = obs_source_get_audio_mixers(src);
    obs_source_release(src);
    return mixers;
}

bool AudioBusManager::toggleSourceBus(const QString& sourceName, int busTrackIndex)
{
    if (busTrackIndex < 1 || busTrackIndex > 6) return false;

    uint32_t current = getSourceTracks(sourceName);
    uint32_t bit = (1 << (busTrackIndex - 1));
    uint32_t updated = current ^ bit;

    return setSourceTracks(sourceName, updated);
}

bool AudioBusManager::configureMixMinusForGuest(const QString& guestSourceName)
{
    uint32_t guestTracks = (1 << 0) | (1 << 2);
    qInfo() << "[FreeMix AudioBusManager] Configurando Mix-Minus (N-1) para convidado:" << guestSourceName;
    return setSourceTracks(guestSourceName, guestTracks);
}

void AudioBusManager::configureStudioSourcesForReturn()
{
    obs_enum_sources([](void* param, obs_source_t* source) {
        AudioBusManager* self = static_cast<AudioBusManager*>(param);
        if (!source) return true;
        uint32_t flags = obs_source_get_output_flags(source);
        if (flags & OBS_SOURCE_AUDIO) {
            const char* name = obs_source_get_name(source);
            if (name) {
                QString srcName = QString::fromUtf8(name);
                if (!srcName.contains("call", Qt::CaseInsensitive) &&
                    !srcName.contains("convidado", Qt::CaseInsensitive) &&
                    !srcName.contains("talkback", Qt::CaseInsensitive) &&
                    !srcName.contains("return", Qt::CaseInsensitive)) {
                    uint32_t current = obs_source_get_audio_mixers(source);
                    uint32_t updated = current | (1 << 0) | (1 << 1) | (1 << 2);
                    obs_source_set_audio_mixers(source, updated);
                    self->emit routingUpdated(srcName, updated);
                }
            }
        }
        return true;
    }, this);
}

bool AudioBusManager::configureGuestAudio(const QString& guestSourceName, const GuestAudioConfig& config)
{
    m_guestConfigs[guestSourceName] = config;

    uint32_t tracks = 0;
    if (config.inProgram) tracks |= (1 << 0);
    if (config.inReturn) tracks |= (1 << 1);
    tracks |= (1 << 2);

    bool result = setSourceTracks(guestSourceName, tracks);

    if (config.returnVolume != 1.0f) {
        obs_source_t* src = obs_get_source_by_name(guestSourceName.toUtf8().constData());
        if (src) {
            obs_source_set_volume(src, config.returnVolume);
            obs_source_release(src);
        }
    }

    emit guestConfigChanged(guestSourceName, config);
    return result;
}

bool AudioBusManager::setGuestInProgram(const QString& guestSourceName, bool inProgram)
{
    if (!m_guestConfigs.contains(guestSourceName)) {
        GuestAudioConfig config;
        config.guestSourceName = guestSourceName;
        m_guestConfigs[guestSourceName] = config;
    }

    GuestAudioConfig& config = m_guestConfigs[guestSourceName];
    if (config.inProgram == inProgram) return true;

    config.inProgram = inProgram;

    uint32_t tracks = getSourceTracks(guestSourceName);
    if (inProgram) {
        tracks |= (1 << 0);
    } else {
        tracks &= ~(1 << 0);
    }

    return setSourceTracks(guestSourceName, tracks);
}

bool AudioBusManager::setGuestInReturn(const QString& guestSourceName, bool inReturn)
{
    if (!m_guestConfigs.contains(guestSourceName)) {
        GuestAudioConfig config;
        config.guestSourceName = guestSourceName;
        m_guestConfigs[guestSourceName] = config;
    }

    GuestAudioConfig& config = m_guestConfigs[guestSourceName];
    if (config.inReturn == inReturn) return true;

    config.inReturn = inReturn;

    uint32_t tracks = getSourceTracks(guestSourceName);
    if (inReturn) {
        tracks |= (1 << 1);
    } else {
        tracks &= ~(1 << 1);
    }

    return setSourceTracks(guestSourceName, tracks);
}

bool AudioBusManager::setGuestReturnVolume(const QString& guestSourceName, float volume)
{
    if (!m_guestConfigs.contains(guestSourceName)) return false;

    GuestAudioConfig& config = m_guestConfigs[guestSourceName];
    config.returnVolume = qBound(0.0f, volume, 1.0f);

    obs_source_t* src = obs_get_source_by_name(guestSourceName.toUtf8().constData());
    if (src) {
        obs_source_set_volume(src, config.returnVolume);
        obs_source_release(src);
    }

    emit guestConfigChanged(guestSourceName, config);
    return true;
}

bool AudioBusManager::setGuestReturnBus(const QString& guestSourceName, const QString& busName)
{
    if (!m_guestConfigs.contains(guestSourceName)) return false;

    GuestAudioConfig& config = m_guestConfigs[guestSourceName];
    if (config.returnAudioBus == busName) return true;

    int oldTrack = busTrackIndexFromName(config.returnAudioBus);
    int newTrack = busTrackIndexFromName(busName);

    if (oldTrack > 0) {
        uint32_t tracks = getSourceTracks(guestSourceName);
        tracks &= ~(1 << (oldTrack - 1));
        setSourceTracks(guestSourceName, tracks);
    }

    config.returnAudioBus = busName;

    if (newTrack > 0 && config.inReturn) {
        uint32_t tracks = getSourceTracks(guestSourceName);
        tracks |= (1 << (newTrack - 1));
        setSourceTracks(guestSourceName, tracks);
    }

    emit guestConfigChanged(guestSourceName, config);
    return true;
}

AudioBusManager::GuestAudioConfig AudioBusManager::getGuestConfig(const QString& guestSourceName) const
{
    return m_guestConfigs.value(guestSourceName, GuestAudioConfig());
}

bool AudioBusManager::activateTalkback(const QString& guestSourceName, float duckLevel)
{
    if (!m_guestConfigs.contains(guestSourceName)) {
        GuestAudioConfig config;
        config.guestSourceName = guestSourceName;
        m_guestConfigs[guestSourceName] = config;
    }

    GuestAudioConfig& config = m_guestConfigs[guestSourceName];
    if (config.talkbackActive) return true;

    config.talkbackActive = true;
    config.talkbackDuckLevel = duckLevel;

    QString talkbackSourceName = QString("Talkback: %1").arg(guestSourceName);
    obs_source_t* src = obs_get_source_by_name(talkbackSourceName.toUtf8().constData());

    if (!src) {
        obs_data_t* settings = obs_data_create();
        obs_data_set_string(settings, "device_id", "default");
        obs_data_set_int(settings, "sample_rate", 48000);

        src = obs_source_create("wasapi_input_capture", talkbackSourceName.toUtf8().constData(), settings, nullptr);
        obs_data_release(settings);

        if (src) {
            obs_source_set_audio_mixers(src, (1 << 3));
            obs_source_set_volume(src, 1.0f);
        }
    }

    if (src) obs_source_release(src);

    if (duckLevel > 0.0f) {
        duckReturnBuses(duckLevel);
    }

    emit talkbackStateChanged(guestSourceName, true);
    return true;
}

bool AudioBusManager::deactivateTalkback(const QString& guestSourceName)
{
    if (!m_guestConfigs.contains(guestSourceName)) return false;

    GuestAudioConfig& config = m_guestConfigs[guestSourceName];
    if (!config.talkbackActive) return true;

    config.talkbackActive = false;

    QString talkbackSourceName = QString("Talkback: %1").arg(guestSourceName);
    obs_source_t* src = obs_get_source_by_name(talkbackSourceName.toUtf8().constData());
    if (src) {
        obs_source_remove(src);
        obs_source_release(src);
    }

    restoreReturnBuses();

    emit talkbackStateChanged(guestSourceName, false);
    return true;
}

bool AudioBusManager::activateGroupTalkback(const QStringList& guestSourceNames, float duckLevel)
{
    bool success = true;
    for (const QString& name : guestSourceNames) {
        success &= activateTalkback(name, duckLevel);
    }
    return success;
}

bool AudioBusManager::deactivateGroupTalkback(const QStringList& guestSourceNames)
{
    bool success = true;
    for (const QString& name : guestSourceNames) {
        success &= deactivateTalkback(name);
    }
    return true;
}

bool AudioBusManager::setReturnBusVolume(int busTrackIndex, float volume)
{
    if (busTrackIndex < 2 || busTrackIndex > 6) return false;

    volume = qBound(0.0f, volume, 1.0f);

    for (AudioBus& bus : m_buses) {
        if (bus.trackIndex == busTrackIndex) {
            bus.volume = volume;
            break;
        }
    }

    obs_enum_sources([](void* param, obs_source_t* source) {
        if (!source) return true;
        uint32_t mixers = obs_source_get_audio_mixers(source);
        if (mixers & (1 << (busTrackIndex - 1))) {
            float* vol = static_cast<float*>(param);
            obs_source_set_volume(source, *vol);
        }
        return true;
    }, &volume);

    emit returnBusVolumeChanged(busTrackIndex, volume);
    return true;
}

bool AudioBusManager::setReturnBusMuted(int busTrackIndex, bool muted)
{
    if (busTrackIndex < 2 || busTrackIndex > 6) return false;

    for (AudioBus& bus : m_buses) {
        if (bus.trackIndex == busTrackIndex) {
            bus.muted = muted;
            break;
        }
    }

    float vol = muted ? 0.0f : 1.0f;
    obs_enum_sources([](void* param, obs_source_t* source) {
        if (!source) return true;
        uint32_t mixers = obs_source_get_audio_mixers(source);
        if (mixers & (1 << (busTrackIndex - 1))) {
            float* v = static_cast<float*>(param);
            obs_source_set_volume(source, *v);
        }
        return true;
    }, &vol);

    emit returnBusMutedChanged(busTrackIndex, muted);
    return true;
}

float AudioBusManager::getReturnBusVolume(int busTrackIndex) const
{
    for (const AudioBus& bus : m_buses) {
        if (bus.trackIndex == busTrackIndex) {
            return bus.volume;
        }
    }
    return 1.0f;
}

bool AudioBusManager::isReturnBusMuted(int busTrackIndex) const
{
    for (const AudioBus& bus : m_buses) {
        if (bus.trackIndex == busTrackIndex) {
            return bus.muted;
        }
    }
    return false;
}

void AudioBusManager::duckReturnBuses(float duckLevel)
{
    m_originalReturnVolumes.clear();

    for (const AudioBus& bus : m_buses) {
        if (bus.trackIndex >= 2 && bus.trackIndex <= 3) {
            m_originalReturnVolumes[bus.trackIndex] = bus.volume;
        }
    }

    for (int trackIdx = 2; trackIdx <= 3; ++trackIdx) {
        float originalVol = m_originalReturnVolumes.value(trackIdx, 1.0f);
        float duckedVol = originalVol * duckLevel;
        setReturnBusVolume(trackIdx, duckedVol);
    }
}

void AudioBusManager::restoreReturnBuses()
{
    for (int trackIdx = 2; trackIdx <= 3; ++trackIdx) {
        if (m_originalReturnVolumes.contains(trackIdx)) {
            setReturnBusVolume(trackIdx, m_originalReturnVolumes[trackIdx]);
        }
    }
    m_originalReturnVolumes.clear();
}

int AudioBusManager::busTrackIndexFromName(const QString& busName) const
{
    for (const AudioBus& bus : m_buses) {
        if (bus.name == busName || bus.name.contains(busName, Qt::CaseInsensitive)) {
            return bus.trackIndex;
        }
    }
    return 0;
}

QString AudioBusManager::busNameFromTrackIndex(int trackIndex) const
{
    for (const AudioBus& bus : m_buses) {
        if (bus.trackIndex == trackIndex) {
            return bus.name;
        }
    }
    return QString();
}
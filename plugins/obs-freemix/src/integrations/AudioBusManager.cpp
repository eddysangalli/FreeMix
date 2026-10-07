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
}

void AudioBusManager::setupDefaultBuses()
{
    m_buses.clear();

    AudioBus master;
    master.trackIndex = 1;
    master.name = "Master (PGM)";
    master.description = "Transmissão principal, gravação e saídas de programa";
    master.isMixMinus = false;
    m_buses.append(master);

    AudioBus auxA;
    auxA.trackIndex = 2;
    auxA.name = "Aux A (Mix-Minus Retorno)";
    auxA.description = "Retorno para convidados remotos com voz própria excluída";
    auxA.isMixMinus = true;
    m_buses.append(auxA);

    AudioBus auxB;
    auxB.trackIndex = 3;
    auxB.name = "Aux B (Fones / Direção)";
    auxB.description = "Monitoração isolada da direção e operadores";
    auxB.isMixMinus = false;
    m_buses.append(auxB);
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
    // Garante que o Convidado vá para Master (Track 1 = bit 0) e Fones (Track 3 = bit 2),
    // mas NÃO vá para Aux A (Track 2 = bit 1).
    uint32_t guestTracks = (1 << 0) | (1 << 2); // Bits 0 e 2 ativados, Bit 1 desativado
    qInfo() << "[FreeMix AudioBusManager] Configurando Mix-Minus (N-1) para convidado:" << guestSourceName;
    return setSourceTracks(guestSourceName, guestTracks);
}

void AudioBusManager::configureStudioSourcesForReturn()
{
    // Percorre as fontes de áudio e garante que microfones do estúdio e VTs enviem para Master (Track 1) e Aux A (Track 2)
    obs_enum_sources([](void* /*param*/, obs_source_t* source) {
        if (!source) return true;
        uint32_t flags = obs_source_get_output_flags(source);
        if (flags & OBS_SOURCE_AUDIO) {
            const char* name = obs_source_get_name(source);
            if (name) {
                QString srcName = QString::fromUtf8(name);
                if (!srcName.contains("call", Qt::CaseInsensitive) && !srcName.contains("convidado", Qt::CaseInsensitive)) {
                    uint32_t current = obs_source_get_audio_mixers(source);
                    uint32_t updated = current | (1 << 0) | (1 << 1) | (1 << 2);
                    obs_source_set_audio_mixers(source, updated);
                }
            }
        }
        return true;
    }, this);
}

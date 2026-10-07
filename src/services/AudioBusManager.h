#pragma once

#include <QObject>
#include <QString>
#include <QMap>
#include <QVector>
#include <obs.h>

class FreeMixPlugin;

struct AudioBus {
    int trackIndex;       // 1 = Master, 2 = Aux A (Mix-Minus), 3 = Aux B (Fones), etc.
    QString name;         // "Master", "Aux A", "Aux B"
    QString description;
    float volume = 1.0f;
    bool muted = false;
    bool isMixMinus = false;
};

struct GuestAudioConfig {
    QString guestSourceName;
    QString returnAudioBus;      // "Aux A", "Aux B", etc.
    bool inProgram = true;
    bool inReturn = true;
    float returnVolume = 1.0f;
    bool talkbackActive = false;
    float talkbackDuckLevel = 0.3f;
};

class AudioBusManager : public QObject
{
    Q_OBJECT

public:
    explicit AudioBusManager(FreeMixPlugin* plugin, QObject* parent = nullptr);
    ~AudioBusManager() override;

    bool initialize();
    void shutdown();

    QVector<AudioBus> buses() const { return m_buses; }

    // Roteamento de faixas por fonte (Track 1 a 6)
    bool setSourceTracks(const QString& sourceName, uint32_t tracksBitmask);
    uint32_t getSourceTracks(const QString& sourceName) const;

    bool toggleSourceBus(const QString& sourceName, int busTrackIndex);

    // Mix-Minus (N-1 Real)
    // Garante que a fonte do convidado vá para o Master (Trilha 1) e Fones (Trilha 3), mas NÃO volte no Aux A (Trilha 2)
    bool configureMixMinusForGuest(const QString& guestSourceName);

    // Ajusta todas as fontes de estúdio/VT para enviar para Master e Aux A
    void configureStudioSourcesForReturn();

    // Per-guest audio routing
    bool configureGuestAudio(const QString& guestSourceName, const GuestAudioConfig& config);
    bool setGuestInProgram(const QString& guestSourceName, bool inProgram);
    bool setGuestInReturn(const QString& guestSourceName, bool inReturn);
    bool setGuestReturnVolume(const QString& guestSourceName, float volume);
    bool setGuestReturnBus(const QString& guestSourceName, const QString& busName);
    GuestAudioConfig getGuestConfig(const QString& guestSourceName) const;

    // Talkback with ducking
    bool activateTalkback(const QString& guestSourceName, float duckLevel = 0.3f);
    bool deactivateTalkback(const QString& guestSourceName);
    bool activateGroupTalkback(const QStringList& guestSourceNames, float duckLevel = 0.3f);
    bool deactivateGroupTalkback(const QStringList& guestSourceNames);

    // Return bus volume control (independent of program)
    bool setReturnBusVolume(int busTrackIndex, float volume);
    bool setReturnBusMuted(int busTrackIndex, bool muted);
    float getReturnBusVolume(int busTrackIndex) const;
    bool isReturnBusMuted(int busTrackIndex) const;

    // Ducking for talkback
    void duckReturnBuses(float duckLevel);
    void restoreReturnBuses();

signals:
    void busChanged(int trackIndex, float volume, bool muted);
    void routingUpdated(const QString& sourceName, uint32_t tracks);
    void guestConfigChanged(const QString& guestSourceName, const GuestAudioConfig& config);
    void talkbackStateChanged(const QString& guestSourceName, bool active);
    void returnBusVolumeChanged(int busTrackIndex, float volume);
    void returnBusMutedChanged(int busTrackIndex, bool muted);

private:
    FreeMixPlugin* m_plugin;
    QVector<AudioBus> m_buses;
    QMap<QString, GuestAudioConfig> m_guestConfigs;
    QMap<int, float> m_originalReturnVolumes;

    void setupDefaultBuses();
    int busTrackIndexFromName(const QString& busName) const;
    QString busNameFromTrackIndex(int trackIndex) const;
};

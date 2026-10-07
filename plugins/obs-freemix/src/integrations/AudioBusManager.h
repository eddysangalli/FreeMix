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

signals:
    void busChanged(int trackIndex, float volume, bool muted);
    void routingUpdated(const QString& sourceName, uint32_t tracks);

private:
    FreeMixPlugin* m_plugin;
    QVector<AudioBus> m_buses;

    void setupDefaultBuses();
};

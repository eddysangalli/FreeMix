#pragma once

#include <QObject>
#include <QString>
#include <QVector>
#include <QMap>
#include <obs.h>

class FreeMixPlugin;

enum class OutputType {
    Projector,
    VirtualCam,
    Stream,
    MultiStream,
    DeckLink,
    NDI,
    OMT
};

enum class OutputState {
    Stopped,
    Starting,
    Active,
    Reconnecting,
    Failed,
    Unavailable
};

struct OutputChannel {
    QString id;
    QString name;
    OutputType type;
    QString source; // PROGRAM, PREVIEW, CLEANFEED, MULTIVIEW ou nome de entrada
    QString dest;   // Monitor index (-1 para janela), URL, device name
    QString resolution;
    QString fps;
    QString audioRoute; // Master, Aux A, Aux B, Mute
    bool alpha = false; // Canal alfa (Fill + Key)
    OutputState state = OutputState::Stopped;
    QString diagnostic;
    obs_output_t* obsOutput = nullptr;
};

class OutputManager : public QObject
{
    Q_OBJECT

public:
    explicit OutputManager(FreeMixPlugin* plugin, QObject* parent = nullptr);
    ~OutputManager() override;

    bool initialize();
    void shutdown();

    QVector<OutputChannel> outputs() const { return m_channels; }
    OutputChannel* getOutput(const QString& id);

    bool startOutput(const QString& id);
    bool stopOutput(const QString& id);
    void startAll();
    void stopAll();

    // Roteamento dinâmico
    bool setOutputSource(const QString& id, const QString& source);
    bool setOutputDestination(const QString& id, const QString& dest);
    bool setOutputAudio(const QString& id, const QString& audioRoute);

    // Compartilhamento de encoder para múltiplos destinos RTMP/SRT (modelo obs-multi-rtmp)
    bool configureMultiStreamTarget(const QString& name, const QString& serverUrl, const QString& streamKey, bool shareEncoder = true);

signals:
    void outputStateChanged(const QString& id, OutputState state, const QString& message);
    void diagnosticUpdated(const QString& id, const QString& diag);

private:
    FreeMixPlugin* m_plugin;
    QVector<OutputChannel> m_channels;

    void setupDefaultChannels();
    bool startProjectorOutput(OutputChannel& ch);
    bool startVirtualCamOutput(OutputChannel& ch);
    bool startStreamOutput(OutputChannel& ch);
    bool startDeckLinkOutput(OutputChannel& ch);
    bool startNDIOutput(OutputChannel& ch);
    bool startOMTOutput(OutputChannel& ch);
};

#pragma once

#include <QObject>

class FreeMixPlugin;

class ReplaySourceIntegration : public QObject
{
    Q_OBJECT

public:
    explicit ReplaySourceIntegration(FreeMixPlugin* plugin, QObject* parent = nullptr);
    ~ReplaySourceIntegration() override;

    bool initialize();
    void shutdown();

    bool isAvailable() const;
    bool createReplayAngle(const QString& cameraScene, const QString& replayName, int durationSeconds);
    bool triggerReplay(const QString& replayName);
    bool setReplaySpeed(const QString& replayName, int speedPercent);
    bool playReplay(const QString& replayName);
    bool pauseReplay(const QString& replayName);
    bool stopReplay(const QString& replayName);
    QStringList getReplayAngles() const;

signals:
    void availabilityChanged(bool available);
    void replayCreated(const QString& replayName);
    void replayTriggered(const QString& replayName);

private:
    FreeMixPlugin* m_plugin;
    bool m_available = false;
    QString m_replaySourceKind = "replay_source";

    bool findReplaySourceKind();
};
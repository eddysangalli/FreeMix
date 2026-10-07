#pragma once

#include <QObject>

class FreeMixPlugin;

class SourceRecordIntegration : public QObject
{
    Q_OBJECT

public:
    explicit SourceRecordIntegration(FreeMixPlugin* plugin, QObject* parent = nullptr);
    ~SourceRecordIntegration() override;

    bool initialize();
    void shutdown();

    bool isAvailable() const;
    bool startISORecording(const QString& sceneName, const QString& outputPath);
    bool stopISORecording(const QString& sceneName);
    bool isRecording(const QString& sceneName) const;
    QStringList getRecordingScenes() const;

signals:
    void availabilityChanged(bool available);
    void recordingStarted(const QString& sceneName);
    void recordingStopped(const QString& sceneName);
    void recordingError(const QString& sceneName, const QString& error);

private:
    FreeMixPlugin* m_plugin;
    bool m_available = false;
    QString m_filterName = "Gravação ISO";

    bool findFilter(const QString& sceneName);
    bool createFilter(const QString& sceneName, const QString& outputPath);
    bool updateFilterSettings(const QString& sceneName, const QString& outputPath);
    void removeFilter(const QString& sceneName);
};
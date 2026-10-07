#pragma once

#include <QObject>
#include <QString>
#include <QVector>
#include <obs.h>

class FreeMixPlugin;

struct CanvasMix {
    QString id;
    QString name;
    uint32_t width = 1920;
    uint32_t height = 1080;
    QString currentProgramScene;
    QString currentPreviewScene;
    bool studioMode = false;
};

class CanvasMixManager : public QObject
{
    Q_OBJECT

public:
    explicit CanvasMixManager(FreeMixPlugin* plugin, QObject* parent = nullptr);
    ~CanvasMixManager() override;

    bool initialize();
    void shutdown();

    QVector<CanvasMix> canvases() const { return m_canvases; }
    CanvasMix* getCanvas(const QString& id);

    bool createCanvasMix(const QString& id, const QString& name, uint32_t width, uint32_t height);
    bool setProgramScene(const QString& canvasId, const QString& sceneName);
    bool setPreviewScene(const QString& canvasId, const QString& sceneName);
    bool transition(const QString& canvasId, const QString& transitionName, int durationMs = 300);

signals:
    void canvasProgramChanged(const QString& canvasId, const QString& sceneName);
    void canvasPreviewChanged(const QString& canvasId, const QString& sceneName);

private:
    FreeMixPlugin* m_plugin;
    QVector<CanvasMix> m_canvases;

    void setupDefaultCanvases();
};

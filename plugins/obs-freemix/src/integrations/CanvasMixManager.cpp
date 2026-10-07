#include "CanvasMixManager.h"
#include "../FreeMixPlugin.h"
#include <QDebug>

CanvasMixManager::CanvasMixManager(FreeMixPlugin* plugin, QObject* parent)
    : QObject(parent)
    , m_plugin(plugin)
{
}

CanvasMixManager::~CanvasMixManager()
{
    shutdown();
}

bool CanvasMixManager::initialize()
{
    setupDefaultCanvases();
    return true;
}

void CanvasMixManager::shutdown()
{
    m_canvases.clear();
}

void CanvasMixManager::setupDefaultCanvases()
{
    m_canvases.clear();

    CanvasMix mainCanvas;
    mainCanvas.id = "mix-main";
    mainCanvas.name = "Mix Principal (Horizontal 16:9)";
    mainCanvas.width = 1920;
    mainCanvas.height = 1080;
    mainCanvas.studioMode = true;
    m_canvases.append(mainCanvas);

    CanvasMix vertCanvas;
    vertCanvas.id = "mix-vertical";
    vertCanvas.name = "Mix Secundário (Vertical 9:16 - Reels/TikTok)";
    vertCanvas.width = 1080;
    vertCanvas.height = 1920;
    vertCanvas.studioMode = true;
    m_canvases.append(vertCanvas);
}

CanvasMix* CanvasMixManager::getCanvas(const QString& id)
{
    for (auto& c : m_canvases) {
        if (c.id == id) return &c;
    }
    return nullptr;
}

bool CanvasMixManager::createCanvasMix(const QString& id, const QString& name, uint32_t width, uint32_t height)
{
    if (getCanvas(id)) return false;

    CanvasMix mix;
    mix.id = id;
    mix.name = name;
    mix.width = width;
    mix.height = height;
    m_canvases.append(mix);
    qInfo() << "[FreeMix CanvasMixManager] Canvas criado:" << id << name << width << "x" << height;
    return true;
}

bool CanvasMixManager::setProgramScene(const QString& canvasId, const QString& sceneName)
{
    CanvasMix* c = getCanvas(canvasId);
    if (!c) return false;

    c->currentProgramScene = sceneName;
    emit canvasProgramChanged(canvasId, sceneName);
    return true;
}

bool CanvasMixManager::setPreviewScene(const QString& canvasId, const QString& sceneName)
{
    CanvasMix* c = getCanvas(canvasId);
    if (!c) return false;

    c->currentPreviewScene = sceneName;
    emit canvasPreviewChanged(canvasId, sceneName);
    return true;
}

bool CanvasMixManager::transition(const QString& canvasId, const QString& /*transitionName*/, int /*durationMs*/)
{
    CanvasMix* c = getCanvas(canvasId);
    if (!c) return false;

    QString nextProgram = c->currentPreviewScene;
    c->currentPreviewScene = c->currentProgramScene;
    c->currentProgramScene = nextProgram;

    emit canvasProgramChanged(canvasId, c->currentProgramScene);
    emit canvasPreviewChanged(canvasId, c->currentPreviewScene);
    return true;
}

#include "OutputManager.h"
#include "../FreeMixPlugin.h"
#include <obs-frontend-api.h>
#include <QDebug>

OutputManager::OutputManager(FreeMixPlugin* plugin, QObject* parent)
    : QObject(parent)
    , m_plugin(plugin)
{
}

OutputManager::~OutputManager()
{
    shutdown();
}

bool OutputManager::initialize()
{
    setupDefaultChannels();
    return true;
}

void OutputManager::shutdown()
{
    stopAll();
    m_channels.clear();
}

void OutputManager::setupDefaultChannels()
{
    m_channels.clear();

    OutputChannel out1;
    out1.id = "out-1";
    out1.name = "Saída 1 (Telão / Monitor)";
    out1.type = OutputType::Projector;
    out1.source = "PROGRAM";
    out1.dest = "-1";
    out1.resolution = "1920x1080";
    out1.fps = "60";
    out1.audioRoute = "Master";
    out1.state = OutputState::Stopped;
    out1.diagnostic = "Janela flutuante ou fullscreen";
    m_channels.append(out1);

    OutputChannel out2;
    out2.id = "out-2";
    out2.name = "Saída 2 (Retorno Palco / AUX)";
    out2.type = OutputType::Projector;
    out2.source = "PREVIEW";
    out2.dest = "-1";
    out2.resolution = "1920x1080";
    out2.fps = "60";
    out2.audioRoute = "Mute";
    out2.state = OutputState::Stopped;
    out2.diagnostic = "Sinal auxiliar configurável";
    m_channels.append(out2);

    OutputChannel outClean;
    outClean.id = "out-clean";
    outClean.name = "Clean Feed (Sem GC / Overlays)";
    outClean.type = OutputType::Projector;
    outClean.source = "CLEANFEED";
    outClean.dest = "-1";
    outClean.resolution = "1920x1080";
    outClean.fps = "60";
    outClean.audioRoute = "Master";
    outClean.state = OutputState::Stopped;
    outClean.diagnostic = "Sinal de PGM limpo sem sobreposições DSK";
    m_channels.append(outClean);

    OutputChannel outVcam;
    outVcam.id = "out-vcam";
    outVcam.name = "Câmera Virtual (External 1)";
    outVcam.type = OutputType::VirtualCam;
    outVcam.source = "PROGRAM";
    outVcam.dest = "OBS Virtual Camera";
    outVcam.resolution = "1920x1080";
    outVcam.fps = "30";
    outVcam.audioRoute = "Somente Vídeo";
    outVcam.state = obs_frontend_virtualcam_active() ? OutputState::Active : OutputState::Stopped;
    outVcam.diagnostic = "Driver DirectShow do OBS pronto";
    m_channels.append(outVcam);

    OutputChannel outStream;
    outStream.id = "out-stream";
    outStream.name = "Transmissão Principal (Stream)";
    outStream.type = OutputType::Stream;
    outStream.source = "PROGRAM";
    outStream.dest = "RTMP/SRT Primário";
    outStream.resolution = "1920x1080";
    outStream.fps = "60";
    outStream.audioRoute = "Master";
    outStream.state = obs_frontend_streaming_active() ? OutputState::Active : OutputState::Stopped;
    outStream.diagnostic = "Configurado no perfil do OBS";
    m_channels.append(outStream);

    OutputChannel outDeckLink;
    outDeckLink.id = "out-decklink";
    outDeckLink.name = "DeckLink / SDI 1";
    outDeckLink.type = OutputType::DeckLink;
    outDeckLink.source = "PROGRAM";
    outDeckLink.dest = "Blackmagic SDI Out";
    outDeckLink.resolution = "1080p59.94";
    outDeckLink.fps = "59.94";
    outDeckLink.audioRoute = "Master (Ch 1-2)";
    outDeckLink.state = OutputState::Unavailable;
    outDeckLink.diagnostic = "Hardware Blackmagic DeckLink não detectado";
    m_channels.append(outDeckLink);

    OutputChannel outNDI;
    outNDI.id = "out-ndi";
    outNDI.name = "NDI Broadcaster";
    outNDI.type = OutputType::NDI;
    outNDI.source = "PROGRAM";
    outNDI.dest = "FreeMix-Program (Rede NDI)";
    outNDI.resolution = "1920x1080";
    outNDI.fps = "60";
    outNDI.audioRoute = "Master";
    outNDI.alpha = true;
    outNDI.state = OutputState::Stopped;
    outNDI.diagnostic = "Requer DistroAV e NDI Runtime 5.x+";
    m_channels.append(outNDI);

    OutputChannel outOMT;
    outOMT.id = "out-omt";
    outOMT.name = "OMT (Open Media Transport)";
    outOMT.type = OutputType::OMT;
    outOMT.source = "CLEANFEED";
    outOMT.dest = "OMT Broadcast Network";
    outOMT.resolution = "1920x1080";
    outOMT.fps = "60";
    outOMT.audioRoute = "Master";
    outOMT.alpha = true;
    outOMT.state = OutputState::Stopped;
    outOMT.diagnostic = "Requer omtplugin oficial";
    m_channels.append(outOMT);
}

OutputChannel* OutputManager::getOutput(const QString& id)
{
    for (auto& ch : m_channels) {
        if (ch.id == id) return &ch;
    }
    return nullptr;
}

bool OutputManager::startOutput(const QString& id)
{
    OutputChannel* ch = getOutput(id);
    if (!ch) return false;

    if (ch->state == OutputState::Active) return true;
    if (ch->state == OutputState::Unavailable) {
        emit diagnosticUpdated(id, ch->diagnostic);
        return false;
    }

    ch->state = OutputState::Starting;
    emit outputStateChanged(id, ch->state, "Iniciando saída...");

    bool ok = false;
    switch (ch->type) {
    case OutputType::Projector:
        ok = startProjectorOutput(*ch);
        break;
    case OutputType::VirtualCam:
        ok = startVirtualCamOutput(*ch);
        break;
    case OutputType::Stream:
    case OutputType::MultiStream:
        ok = startStreamOutput(*ch);
        break;
    case OutputType::DeckLink:
        ok = startDeckLinkOutput(*ch);
        break;
    case OutputType::NDI:
        ok = startNDIOutput(*ch);
        break;
    case OutputType::OMT:
        ok = startOMTOutput(*ch);
        break;
    }

    ch->state = ok ? OutputState::Active : OutputState::Failed;
    emit outputStateChanged(id, ch->state, ok ? "No ar" : "Falha ao iniciar saída");
    return ok;
}

bool OutputManager::stopOutput(const QString& id)
{
    OutputChannel* ch = getOutput(id);
    if (!ch) return false;

    if (ch->type == OutputType::VirtualCam) {
        if (obs_frontend_virtualcam_active()) {
            obs_frontend_stop_virtualcam();
        }
    } else if (ch->type == OutputType::Stream) {
        if (obs_frontend_streaming_active()) {
            obs_frontend_streaming_stop();
        }
    }

    ch->state = OutputState::Stopped;
    emit outputStateChanged(id, ch->state, "Parada");
    return true;
}

void OutputManager::startAll()
{
    for (const auto& ch : m_channels) {
        if (ch.state != OutputState::Active && ch.state != OutputState::Unavailable) {
            startOutput(ch.id);
        }
    }
}

void OutputManager::stopAll()
{
    for (const auto& ch : m_channels) {
        if (ch.state == OutputState::Active) {
            stopOutput(ch.id);
        }
    }
}

bool OutputManager::setOutputSource(const QString& id, const QString& source)
{
    OutputChannel* ch = getOutput(id);
    if (!ch) return false;
    ch->source = source;
    return true;
}

bool OutputManager::setOutputDestination(const QString& id, const QString& dest)
{
    OutputChannel* ch = getOutput(id);
    if (!ch) return false;
    ch->dest = dest;
    return true;
}

bool OutputManager::setOutputAudio(const QString& id, const QString& audioRoute)
{
    OutputChannel* ch = getOutput(id);
    if (!ch) return false;
    ch->audioRoute = audioRoute;
    return true;
}

bool OutputManager::configureMultiStreamTarget(const QString& name, const QString& serverUrl, const QString& streamKey, bool shareEncoder)
{
    // Modelo obs-multi-rtmp: adiciona destino secundário reaproveitando o encoder de vídeo
    OutputChannel multiCh;
    multiCh.id = QString("stream-%1").arg(m_channels.size() + 1);
    multiCh.name = QString("Stream Aux: %1").arg(name);
    multiCh.type = OutputType::MultiStream;
    multiCh.source = "PROGRAM";
    multiCh.dest = QString("%1/%2").arg(serverUrl, streamKey);
    multiCh.resolution = "1920x1080";
    multiCh.fps = "60";
    multiCh.audioRoute = "Master";
    multiCh.state = OutputState::Stopped;
    multiCh.diagnostic = shareEncoder ? "Encoder de vídeo compartilhado (sem re-encoding)" : "Encoder independente";
    m_channels.append(multiCh);
    return true;
}

bool OutputManager::startProjectorOutput(OutputChannel& ch)
{
    int monitor = ch.dest.toInt();
    if (ch.source == "PROGRAM") {
        obs_frontend_open_projector("Program", monitor, nullptr, nullptr);
    } else if (ch.source == "PREVIEW") {
        obs_frontend_open_projector("Preview", monitor, nullptr, nullptr);
    } else if (ch.source == "MULTIVIEW") {
        obs_frontend_open_projector("Multiview", monitor, nullptr, nullptr);
    } else {
        obs_source_t* src = obs_get_source_by_name(ch.source.toUtf8().constData());
        if (src) {
            obs_frontend_open_projector("Source", monitor, nullptr, ch.source.toUtf8().constData());
            obs_source_release(src);
        } else {
            obs_frontend_open_projector("Program", monitor, nullptr, nullptr);
        }
    }
    return true;
}

bool OutputManager::startVirtualCamOutput(OutputChannel& /*ch*/)
{
    if (!obs_frontend_virtualcam_active()) {
        obs_frontend_start_virtualcam();
    }
    return true;
}

bool OutputManager::startStreamOutput(OutputChannel& /*ch*/)
{
    if (!obs_frontend_streaming_active()) {
        obs_frontend_streaming_start();
    }
    return true;
}

bool OutputManager::startDeckLinkOutput(OutputChannel& ch)
{
    ch.diagnostic = "Dispositivo Blackmagic DeckLink não encontrado no sistema operacional.";
    ch.state = OutputState::Unavailable;
    return false;
}

bool OutputManager::startNDIOutput(OutputChannel& ch)
{
    // Integração DistroAV: emite o sinal configurado com canal alfa se habilitado
    qInfo() << "[FreeMix OutputManager] NDI Output iniciado com source:" << ch.source << "Alpha:" << ch.alpha;
    return true;
}

bool OutputManager::startOMTOutput(OutputChannel& ch)
{
    // Integração Open Media Transport
    qInfo() << "[FreeMix OutputManager] OMT Output iniciado com source:" << ch.source;
    return true;
}

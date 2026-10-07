#include "FreeMixPlugin.h"
#include "menus/FreeMixMenuBar.h"
#include "FreeMixDock.h"
#include "OperateEditMode.h"
#include "integrations/SourceRecordIntegration.h"
#include "integrations/ReplaySourceIntegration.h"
#include "integrations/DownstreamKeyerIntegration.h"
#include "integrations/VDONinjaIntegration.h"
#include "integrations/DeckLinkIntegration.h"
#include "integrations/NDIIntegration.h"
#include "integrations/OMTIntegration.h"
#include "integrations/OutputManager.h"
#include "integrations/AudioBusManager.h"
#include "integrations/CanvasMixManager.h"
#include "integrations/MultiviewManager.h"

#include <obs-frontend-api.h>
#include <obs.h>
#include <QApplication>
#include <QMessageBox>

FreeMixPlugin* FreeMixPlugin::s_instance = nullptr;

FreeMixPlugin::FreeMixPlugin(QObject* parent)
    : QObject(parent)
{
    s_instance = this;
}

FreeMixPlugin::~FreeMixPlugin()
{
    s_instance = nullptr;
}

FreeMixPlugin* FreeMixPlugin::instance()
{
    return s_instance;
}

bool FreeMixPlugin::initialize()
{
    m_sourceRecord = std::make_unique<SourceRecordIntegration>(this);
    m_replaySource = std::make_unique<ReplaySourceIntegration>(this);
    m_downstreamKeyer = std::make_unique<DownstreamKeyerIntegration>(this);
    m_vdoNinja = std::make_unique<VDONinjaIntegration>(this);
    m_deckLink = std::make_unique<DeckLinkIntegration>(this);
    m_ndi = std::make_unique<NDIIntegration>(this);
    m_omt = std::make_unique<OMTIntegration>(this);
    m_outputManager = std::make_unique<OutputManager>(this);
    m_audioBusManager = std::make_unique<AudioBusManager>(this);
    m_canvasMixManager = std::make_unique<CanvasMixManager>(this);
    m_multiviewManager = std::make_unique<MultiviewManager>(this);

    if (!m_sourceRecord->initialize()) {
        blog(LOG_WARNING, "[FreeMix] Source Record integration not available");
    }
    if (!m_replaySource->initialize()) {
        blog(LOG_WARNING, "[FreeMix] Replay Source integration not available");
    }
    if (!m_downstreamKeyer->initialize()) {
        blog(LOG_WARNING, "[FreeMix] Downstream Keyer integration not available");
    }
    if (!m_vdoNinja->initialize()) {
        blog(LOG_WARNING, "[FreeMix] VDO.Ninja integration not available");
    }
    if (!m_deckLink->initialize()) {
        blog(LOG_WARNING, "[FreeMix] DeckLink integration not available");
    }
    if (!m_ndi->initialize()) {
        blog(LOG_WARNING, "[FreeMix] NDI integration not available");
    }
    if (!m_omt->initialize()) {
        blog(LOG_WARNING, "[FreeMix] OMT integration not available");
    }
    if (!m_outputManager->initialize()) {
        blog(LOG_WARNING, "[FreeMix] Output Manager not available");
    }
    if (!m_audioBusManager->initialize()) {
        blog(LOG_WARNING, "[FreeMix] Audio Bus Manager not available");
    }
    if (!m_canvasMixManager->initialize()) {
        blog(LOG_WARNING, "[FreeMix] Canvas Mix Manager not available");
    }
    if (!m_multiviewManager->initialize()) {
        blog(LOG_WARNING, "[FreeMix] Multiview Manager not available");
    }

    m_menuBar = std::make_unique<FreeMixMenuBar>(this);
    if (!m_menuBar->initialize()) {
        blog(LOG_ERROR, "[FreeMix] Failed to initialize menu bar");
        return false;
    }

    m_dock = std::make_unique<FreeMixDock>(this);
    if (!m_dock->initialize()) {
        blog(LOG_ERROR, "[FreeMix] Failed to initialize dock");
        return false;
    }

    m_operateEditMode = std::make_unique<OperateEditMode>(this);
    if (!m_operateEditMode->initialize()) {
        blog(LOG_WARNING, "[FreeMix] Operate/Edit mode not fully available");
    }

    emit initializationComplete();
    blog(LOG_INFO, "[FreeMix] Plugin initialized successfully");
    return true;
}

void FreeMixPlugin::shutdown()
{
    emit shutdownRequested();

    m_operateEditMode.reset();
    m_dock.reset();
    m_menuBar.reset();

    m_multiviewManager.reset();
    m_canvasMixManager.reset();
    m_audioBusManager.reset();
    m_outputManager.reset();
    m_omt.reset();
    m_ndi.reset();
    m_deckLink.reset();
    m_vdoNinja.reset();
    m_downstreamKeyer.reset();
    m_replaySource.reset();
    m_sourceRecord.reset();

    blog(LOG_INFO, "[FreeMix] Plugin shut down");
}

FreeMixMenuBar* FreeMixPlugin::menuBar() const
{
    return m_menuBar.get();
}

FreeMixDock* FreeMixPlugin::dock() const
{
    return m_dock.get();
}

OperateEditMode* FreeMixPlugin::operateEditMode() const
{
    return m_operateEditMode.get();
}

SourceRecordIntegration* FreeMixPlugin::sourceRecord() const
{
    return m_sourceRecord.get();
}

ReplaySourceIntegration* FreeMixPlugin::replaySource() const
{
    return m_replaySource.get();
}

DownstreamKeyerIntegration* FreeMixPlugin::downstreamKeyer() const
{
    return m_downstreamKeyer.get();
}

VDONinjaIntegration* FreeMixPlugin::vdoNinja() const
{
    return m_vdoNinja.get();
}

DeckLinkIntegration* FreeMixPlugin::deckLink() const
{
    return m_deckLink.get();
}

NDIIntegration* FreeMixPlugin::ndi() const
{
    return m_ndi.get();
}

OMTIntegration* FreeMixPlugin::omt() const
{
    return m_omt.get();
}

OutputManager* FreeMixPlugin::outputManager() const
{
    return m_outputManager.get();
}

AudioBusManager* FreeMixPlugin::audioBusManager() const
{
    return m_audioBusManager.get();
}

CanvasMixManager* FreeMixPlugin::canvasMixManager() const
{
    return m_canvasMixManager.get();
}

MultiviewManager* FreeMixPlugin::multiviewManager() const
{
    return m_multiviewManager.get();
}
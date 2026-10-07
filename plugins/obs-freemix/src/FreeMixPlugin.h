#pragma once

#include <obs-frontend-api.h>
#include <obs-module.h>
#include <QObject>
#include <memory>

class FreeMixMenuBar;
class FreeMixDock;
class OperateEditMode;
class SourceRecordIntegration;
class ReplaySourceIntegration;
class DownstreamKeyerIntegration;
class VDONinjaIntegration;
class DeckLinkIntegration;
class NDIIntegration;
class OMTIntegration;
class OutputManager;
class AudioBusManager;
class CanvasMixManager;
class MultiviewManager;

class FreeMixPlugin : public QObject
{
    Q_OBJECT

public:
    explicit FreeMixPlugin(QObject* parent = nullptr);
    ~FreeMixPlugin() override;

    bool initialize();
    void shutdown();

    static FreeMixPlugin* instance();

    FreeMixMenuBar* menuBar() const;
    FreeMixDock* dock() const;
    OperateEditMode* operateEditMode() const;
    SourceRecordIntegration* sourceRecord() const;
    ReplaySourceIntegration* replaySource() const;
    DownstreamKeyerIntegration* downstreamKeyer() const;
    VDONinjaIntegration* vdoNinja() const;
    DeckLinkIntegration* deckLink() const;
    NDIIntegration* ndi() const;
    OMTIntegration* omt() const;
    OutputManager* outputManager() const;
    AudioBusManager* audioBusManager() const;
    CanvasMixManager* canvasMixManager() const;
    MultiviewManager* multiviewManager() const;

signals:
    void initializationComplete();
    void shutdownRequested();

private:
    std::unique_ptr<FreeMixMenuBar> m_menuBar;
    std::unique_ptr<FreeMixDock> m_dock;
    std::unique_ptr<OperateEditMode> m_operateEditMode;
    std::unique_ptr<SourceRecordIntegration> m_sourceRecord;
    std::unique_ptr<ReplaySourceIntegration> m_replaySource;
    std::unique_ptr<DownstreamKeyerIntegration> m_downstreamKeyer;
    std::unique_ptr<VDONinjaIntegration> m_vdoNinja;
    std::unique_ptr<DeckLinkIntegration> m_deckLink;
    std::unique_ptr<NDIIntegration> m_ndi;
    std::unique_ptr<OMTIntegration> m_omt;
    std::unique_ptr<OutputManager> m_outputManager;
    std::unique_ptr<AudioBusManager> m_audioBusManager;
    std::unique_ptr<CanvasMixManager> m_canvasMixManager;
    std::unique_ptr<MultiviewManager> m_multiviewManager;

    static FreeMixPlugin* s_instance;
};
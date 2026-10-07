#include "FreeMixMenuBar.h"
#include "FreeMixPlugin.h"
#include "dialogs/AddInputDialog.h"
#include "dialogs/InputPropertiesDialog.h"
#include "dialogs/GeneralSettingsDialog.h"
#include "dialogs/ModuleSettingsDialog.h"
#include "dialogs/OutputsDialog.h"

#include <obs-frontend-api.h>
#include <obs.h>
#include <QMainWindow>
#include <QMenuBar>
#include <QMessageBox>
#include <QApplication>
#include <QDesktopServices>
#include <QUrl>

FreeMixMenuBar::FreeMixMenuBar(FreeMixPlugin* plugin, QObject* parent)
    : QObject(parent), m_plugin(plugin)
{
}

FreeMixMenuBar::~FreeMixMenuBar()
{
    shutdown();
}

bool FreeMixMenuBar::initialize()
{
    QMainWindow* mainWindow = obs_frontend_get_main_window();
    if (!mainWindow) {
        blog(LOG_ERROR, "[FreeMix] Main window not available");
        return false;
    }

    m_menuBar = mainWindow->menuBar();
    if (!m_menuBar) {
        blog(LOG_ERROR, "[FreeMix] Menu bar not available");
        return false;
    }

    createMenus();
    connectActions();
    updateMenuTexts();

    blog(LOG_INFO, "[FreeMix] Menu bar initialized");
    return true;
}

void FreeMixMenuBar::shutdown()
{
    if (m_menuBar) {
        m_menuBar->clear();
    }
    m_menuProducao = nullptr;
    m_menuEntradas = nullptr;
    m_menuAudio = nullptr;
    m_menuSaidas = nullptr;
    m_menuLayout = nullptr;
    m_menuFerramentas = nullptr;
    m_menuAjuda = nullptr;
    m_actionOperateEditMode = nullptr;
}

QMenuBar* FreeMixMenuBar::menuBar() const
{
    return m_menuBar;
}

void FreeMixMenuBar::createMenus()
{
    m_menuProducao = m_menuBar->addMenu(tr("&Produção"));
    m_menuEntradas = m_menuBar->addMenu(tr("&Entradas"));
    m_menuAudio = m_menuBar->addMenu(tr("&Áudio"));
    m_menuSaidas = m_menuBar->addMenu(tr("&Saídas"));
    m_menuLayout = m_menuBar->addMenu(tr("&Layout"));
    m_menuFerramentas = m_menuBar->addMenu(tr("&Ferramentas"));
    m_menuAjuda = m_menuBar->addMenu(tr("A&juda"));

    createProducaoMenu();
    createEntradasMenu();
    createAudioMenu();
    createSaidasMenu();
    createLayoutMenu();
    createFerramentasMenu();
    createAjudaMenu();
}

void FreeMixMenuBar::createProducaoMenu()
{
    auto* actNew = m_menuProducao->addAction(tr("&Nova Produção"), this, &FreeMixMenuBar::newProductionRequested);
    actNew->setShortcut(QKeySequence::New);
    actNew->setShortcutContext(Qt::WindowShortcut);

    auto* actOpen = m_menuProducao->addAction(tr("&Abrir Produção..."), this, &FreeMixMenuBar::openProductionRequested);
    actOpen->setShortcut(QKeySequence::Open);

    auto* actSave = m_menuProducao->addAction(tr("&Salvar Produção"), this, &FreeMixMenuBar::saveProductionRequested);
    actSave->setShortcut(QKeySequence::Save);

    auto* actSaveAs = m_menuProducao->addAction(tr("Salvar Produção &Como..."), this, &FreeMixMenuBar::saveProductionAsRequested);
    actSaveAs->setShortcut(QKeySequence::SaveAs);

    m_menuProducao->addSeparator();

    auto* actTemplates = m_menuProducao->addAction(tr("&Modelos"), this, []() {
        blog(LOG_INFO, "[FreeMix] Templates menu triggered");
    });

    m_menuProducao->addSeparator();

    auto* actBackup = m_menuProducao->addAction(tr("&Backup da Produção"), this, []() {
        blog(LOG_INFO, "[FreeMix] Backup menu triggered");
    });

    m_menuProducao->addSeparator();

    auto* actSettings = m_menuProducao->addAction(tr("&Configurações..."), this, &FreeMixMenuBar::generalSettingsRequested);
    actSettings->setShortcut(QKeySequence(Qt::ControlModifier | Qt::Key_Comma));

    m_menuProducao->addSeparator();

    auto* actExit = m_menuProducao->addAction(tr("Sai&r do FreeMix"), qApp, &QApplication::quit);
    actExit->setShortcut(QKeySequence::Quit);
}

void FreeMixMenuBar::createEntradasMenu()
{
    auto* actAdd = m_menuEntradas->addAction(tr("&Adicionar Entrada..."), this, &FreeMixMenuBar::addInputRequested);
    actAdd->setShortcut(QKeySequence(Qt::ControlModifier | Qt::Key_I));

    m_menuEntradas->addSeparator();

    auto* actProps = m_menuEntradas->addAction(tr("&Propriedades da Entrada..."), this, [this]() {
        const char* name = obs_frontend_get_current_scene();
        if (name) {
            emit inputPropertiesRequested(QString::fromUtf8(name));
        }
    });
    actProps->setShortcut(QKeySequence(Qt::ControlModifier | Qt::Key_P));

    auto* actFilters = m_menuEntradas->addAction(tr("&Filtros da Entrada..."), this, [this]() {
        const char* name = obs_frontend_get_current_scene();
        if (name) {
            emit inputFiltersRequested(QString::fromUtf8(name));
        }
    });

    m_menuEntradas->addSeparator();

    auto* actDuplicate = m_menuEntradas->addAction(tr("&Duplicar Entrada"), this, [this]() {
        const char* name = obs_frontend_get_current_scene();
        if (name) {
            emit duplicateInputRequested(QString::fromUtf8(name));
        }
    });
    actDuplicate->setShortcut(QKeySequence(Qt::ControlModifier | Qt::Key_D));

    auto* actRemove = m_menuEntradas->addAction(tr("&Remover Entrada"), this, [this]() {
        const char* name = obs_frontend_get_current_scene();
        if (name) {
            emit removeInputRequested(QString::fromUtf8(name));
        }
    });
    actRemove->setShortcut(QKeySequence::Delete);

    m_menuEntradas->addSeparator();

    auto* actCategories = m_menuEntradas->addAction(tr("&Categorias e Cores"), this, []() {
        blog(LOG_INFO, "[FreeMix] Categories menu triggered");
    });
}

void FreeMixMenuBar::createAudioMenu()
{
    auto* actSettings = m_menuAudio->addAction(tr("Configurações de &Áudio..."), this, &FreeMixMenuBar::audioSettingsRequested);
    actSettings->setShortcut(QKeySequence(Qt::ControlModifier | Qt::ShiftModifier | Qt::Key_A));

    auto* actAdvanced = m_menuAudio->addAction(tr("Mixer de Áudio &Avançado..."), this, &FreeMixMenuBar::audioAdvancedRequested);
    actAdvanced->setShortcut(QKeySequence(Qt::ControlModifier | Qt::ShiftModifier | Qt::Key_M));

    m_menuAudio->addSeparator();

    auto* actBuses = m_menuAudio->addAction(tr("&Roteamento de Barramentos (Mix-Minus)"), this, []() {
        blog(LOG_INFO, "[FreeMix] Bus routing menu triggered");
    });

    auto* actMonitor = m_menuAudio->addAction(tr("&Monitoramento"), this, []() {
        blog(LOG_INFO, "[FreeMix] Monitoring menu triggered");
    });
}

void FreeMixMenuBar::createSaidasMenu()
{
    auto* actStream = m_menuSaidas->addAction(tr("&Transmissão..."), this, &FreeMixMenuBar::streamingSettingsRequested);
    actStream->setShortcut(QKeySequence(Qt::ControlModifier | Qt::ShiftModifier | Qt::Key_S));

    auto* actRecord = m_menuSaidas->addAction(tr("&Gravação..."), this, &FreeMixMenuBar::recordingSettingsRequested);
    actRecord->setShortcut(QKeySequence(Qt::ControlModifier | Qt::ShiftModifier | Qt::Key_R));

    auto* actOutputs = m_menuSaidas->addAction(tr("Central de &Saídas (Outputs & Routing)..."), this, []() {
        OutputsDialog dlg;
        dlg.exec();
    });
    actOutputs->setShortcut(QKeySequence(Qt::ControlModifier | Qt::ShiftModifier | Qt::Key_O));

    auto* actVirtualCam = m_menuSaidas->addAction(tr("Câmera &Virtual..."), this, &FreeMixMenuBar::virtualCamSettingsRequested);
    actVirtualCam->setShortcut(QKeySequence(Qt::ControlModifier | Qt::ShiftModifier | Qt::Key_V));

    m_menuSaidas->addSeparator();

    auto* actStartStream = m_menuSaidas->addAction(tr("Iniciar &Transmissão"), []() {
        obs_frontend_streaming_start();
    });

    auto* actStopStream = m_menuSaidas->addAction(tr("Parar Trans&missão"), []() {
        obs_frontend_streaming_stop();
    });

    m_menuSaidas->addSeparator();

    auto* actStartRecord = m_menuSaidas->addAction(tr("Iniciar &Gravação"), []() {
        obs_frontend_recording_start();
    });

    auto* actStopRecord = m_menuSaidas->addAction(tr("Parar G&ravação"), []() {
        obs_frontend_recording_stop();
    });

    m_menuSaidas->addSeparator();

    auto* actStartVirtualCam = m_menuSaidas->addAction(tr("Iniciar Câmera &Virtual"), []() {
        obs_frontend_virtualcam_start();
    });

    auto* actStopVirtualCam = m_menuSaidas->addAction(tr("Parar Câmera Vir&tual"), []() {
        obs_frontend_virtualcam_stop();
    });
}

void FreeMixMenuBar::createLayoutMenu()
{
    m_actionOperateEditMode = m_menuLayout->addAction(tr("Modo &Editar"), this, [this](bool checked) {
        emit operateEditModeToggled(checked);
    });
    m_actionOperateEditMode->setCheckable(true);
    m_actionOperateEditMode->setChecked(false);
    m_actionOperateEditMode->setShortcut(QKeySequence(Qt::ControlModifier | Qt::Key_E));
    m_actionOperateEditMode->setToolTip(tr("Alterna entre Modo Operar (bloqueado) e Modo Editar (transformações livres)"));

    m_menuLayout->addSeparator();

    auto* actPreview = m_menuLayout->addAction(tr("&Pré-visualização"), []() {
        blog(LOG_INFO, "[FreeMix] Preview layout menu triggered");
    });

    auto* actProgram = m_menuLayout->addAction(tr("&Programa"), []() {
        blog(LOG_INFO, "[FreeMix] Program layout menu triggered");
    });

    m_menuLayout->addSeparator();

    auto* actMultiview = m_menuLayout->addAction(tr("Visualização &Múltipla..."), []() {
        obs_frontend_open_multiview();
    });

    m_menuLayout->addSeparator();

    auto* actSettings = m_menuLayout->addAction(tr("Configurações de &Layout..."), this, &FreeMixMenuBar::layoutSettingsRequested);
}

void FreeMixMenuBar::createFerramentasMenu()
{
    auto* actReplay = m_menuFerramentas->addAction(tr("&Replay / Repetição Instantânea..."), this, &FreeMixMenuBar::replaySettingsRequested);
    actReplay->setShortcut(QKeySequence(Qt::ControlModifier | Qt::ShiftModifier | Qt::Key_R));

    auto* actCall = m_menuFerramentas->addAction(tr("FreeMix &Call (Convidados Remotos)..."), this, &FreeMixMenuBar::freemixCallSettingsRequested);
    actCall->setShortcut(QKeySequence(Qt::ControlModifier | Qt::ShiftModifier | Qt::Key_C));

    auto* actMultiCorder = m_menuFerramentas->addAction(tr("Gravação ISO / &MultiCorder..."), this, &FreeMixMenuBar::multiCorderSettingsRequested);
    actMultiCorder->setShortcut(QKeySequence(Qt::ControlModifier | Qt::ShiftModifier | Qt::Key_M));

    auto* actPlaylist = m_menuFerramentas->addAction(tr("&Playlist / Lista de Reprodução..."), this, &FreeMixMenuBar::playlistSettingsRequested);
    actPlaylist->setShortcut(QKeySequence(Qt::ControlModifier | Qt::ShiftModifier | Qt::Key_P));

    auto* actOverlays = m_menuFerramentas->addAction(tr("&Overlays / Downstream Keyer..."), this, &FreeMixMenuBar::overlaySettingsRequested);
    actOverlays->setShortcut(QKeySequence(Qt::ControlModifier | Qt::ShiftModifier | Qt::Key_O));

    m_menuFerramentas->addSeparator();

    auto* actShortcuts = m_menuFerramentas->addAction(tr("&Atalhos de Teclado..."), this, &FreeMixMenuBar::shortcutsSettingsRequested);
    actShortcuts->setShortcut(QKeySequence(Qt::ControlModifier | Qt::Key_K));

    auto* actComponents = m_menuFerramentas->addAction(tr("&Componentes e Integrações..."), this, &FreeMixMenuBar::componentsSettingsRequested);

    m_menuFerramentas->addSeparator();

    auto* actAutoConfig = m_menuFerramentas->addAction(tr("Assistente de &Configuração..."), []() {
        obs_frontend_show_auto_configuration();
    });
}

void FreeMixMenuBar::createAjudaMenu()
{
    auto* actDocs = m_menuAjuda->addAction(tr("&Documentação FreeMix"), this, &FreeMixMenuBar::helpDocumentationRequested);
    auto* actGitHub = m_menuAjuda->addAction(tr("Repositório &GitHub"), this, &FreeMixMenuBar::helpGitHubRequested);
    auto* actDiscord = m_menuAjuda->addAction(tr("Comunidade &Discord"), this, &FreeMixMenuBar::helpDiscordRequested);

    m_menuAjuda->addSeparator();

    auto* actWhatsNew = m_menuAjuda->addAction(tr("&Novidades"), []() {
        blog(LOG_INFO, "[FreeMix] Whats new menu triggered");
    });

    m_menuAjuda->addSeparator();

    auto* actLogs = m_menuAjuda->addAction(tr("Arquivos de &Registro"), this, &FreeMixMenuBar::showLogsRequested);

    m_menuAjuda->addSeparator();

    auto* actUpdates = m_menuAjuda->addAction(tr("Verificar &Atualizações..."), this, &FreeMixMenuBar::checkUpdatesRequested);

    auto* actRepair = m_menuAjuda->addAction(tr("Verificar &Integridade dos Arquivos..."), this, &FreeMixMenuBar::repairInstallationRequested);

    m_menuAjuda->addSeparator();

    auto* actSafeMode = m_menuAjuda->addAction(tr("Reiniciar em Modo de &Segurança (sem plugins)"), []() {
        obs_frontend_restart_safe_mode();
    });

    auto* actNormalMode = m_menuAjuda->addAction(tr("Reiniciar no Modo &Normal"), []() {
        obs_frontend_restart_normal_mode();
    });

    m_menuAjuda->addSeparator();

    auto* actAbout = m_menuAjuda->addAction(tr("&Sobre FreeMix..."), this, &FreeMixMenuBar::helpAboutRequested);
}

void FreeMixMenuBar::connectActions()
{
}

void FreeMixMenuBar::updateMenuTexts()
{
}
#include "FreeMixMainWindow.h"
#include "VideoDisplayWidget.h"
#include "../app/FreeMixApp.h"
#include "../services/OutputManager.h"
#include "../services/AudioBusManager.h"
#include "../services/ProjectManager.h"
#include "../services/InputManager.h"
#include <QFileDialog>

#include <QMenuBar>
#include <QMenu>
#include <QToolBar>
#include <QStatusBar>
#include <QHBoxLayout>
#include <QVBoxLayout>
#include <QGridLayout>
#include <QGroupBox>
#include <QTime>
#include <QMessageBox>

FreeMixMainWindow::FreeMixMainWindow(QWidget *parent)
    : QMainWindow(parent)
{
    setWindowTitle("FreeMix Studio — Produção Broadcast");
    resize(1600, 900);
    setMinimumSize(1280, 720);

    setupUI();

    m_clockTimer = new QTimer(this);
    connect(m_clockTimer, &QTimer::timeout, this, &FreeMixMainWindow::onUpdateClock);
    m_clockTimer->start(1000);
    onUpdateClock();
}

FreeMixMainWindow::~FreeMixMainWindow() = default;

void FreeMixMainWindow::setupUI()
{
    createMenuBar();

    auto *centralWidget = new QWidget(this);
    setCentralWidget(centralWidget);

    auto *mainLayout = new QVBoxLayout(centralWidget);
    mainLayout->setContentsMargins(6, 6, 6, 6);
    mainLayout->setSpacing(6);

    // 1. Barra Superior de Controle de Saídas e Status
    createTopBar();

    // 2. Monitores Centrais (Preview, Transições, Program)
    createCentralMonitors();

    // 3. Mesa de Corte e Mixer Integrado
    createProductionConsole();

    // 4. Barra de Status Inferior
    createStatusBar();
}

void FreeMixMainWindow::createMenuBar()
{
    auto *menuBar = this->menuBar();

    auto *menuProducao = menuBar->addMenu("&Produção");
    menuProducao->addAction("Novo Projeto...", this, [this](){
        if (auto *app = FreeMixApp::instance()) {
            app->projectManager()->newProject();
            setWindowTitle("FreeMix Studio — Nova Produção");
        }
    });
    menuProducao->addAction("Abrir Projeto...", this, [this](){
        QString path = QFileDialog::getOpenFileName(this, "Abrir Projeto FreeMix", "", "Projetos FreeMix (*.fmx)");
        if (!path.isEmpty()) {
            if (auto *app = FreeMixApp::instance()) {
                app->projectManager()->loadProject(path);
                setWindowTitle("FreeMix Studio — " + QFileInfo(path).baseName());
            }
        }
    });
    menuProducao->addAction("Salvar Projeto", this, [this](){
        if (auto *app = FreeMixApp::instance()) {
            QString path = app->projectManager()->currentFilePath();
            if (path.isEmpty()) {
                path = QFileDialog::getSaveFileName(this, "Salvar Projeto FreeMix", "producao.fmx", "Projetos FreeMix (*.fmx)");
            }
            if (!path.isEmpty()) {
                app->projectManager()->saveProject(path);
                setWindowTitle("FreeMix Studio — " + QFileInfo(path).baseName());
            }
        }
    });
    menuProducao->addSeparator();
    menuProducao->addAction("Sair", this, &QWidget::close);

    auto *menuEntradas = menuBar->addMenu("&Entradas");
    menuEntradas->addAction("+ Adicionar Entrada...", this, [this](){
        AddInputDialog dlg(nullptr, this);
        dlg.exec();
    });
    menuEntradas->addAction("Gerenciador de Mídias", this, [](){});
    menuEntradas->addAction("FreeMix Call (Convidados WebRTC)", this, [](){});

    auto *menuAudio = menuBar->addMenu("&Áudio");
    menuAudio->addAction("Matriz de Áudio & Mix-Minus...", this, &FreeMixMainWindow::onOpenAudioDialog);
    menuAudio->addAction("Filtros & Processadores Master...", this, [](){});

    auto *menuSaidas = menuBar->addMenu("&Saídas");
    menuSaidas->addAction("Central de Saídas & MultiStream...", this, &FreeMixMainWindow::onOpenOutputsDialog);
    menuSaidas->addAction("Configurar NDI / OMT...", this, [](){});
    menuSaidas->addAction("Configurar DeckLink SDI...", this, [](){});

    auto *menuGraficos = menuBar->addMenu("&Gráficos");
    menuGraficos->addAction("Central de Gráficos & GCs...", this, [this](){
        if (auto *app = FreeMixApp::instance()) {
            GraphicsStudioDialog dlg(app->graphicsManager(), this);
            dlg.exec();
        }
    });
    menuGraficos->addAction("Retirar Todos os GCs (Clear All)", this, [this](){
        if (auto *app = FreeMixApp::instance()) {
            if (auto *gm = app->graphicsManager()) gm->clearAll();
        }
    });

    auto *menuConfig = menuBar->addMenu("&Configurações");
    menuConfig->addAction("Preferências Gerais...", this, &FreeMixMainWindow::onOpenSettings);
}

void FreeMixMainWindow::createTopBar()
{
    auto *topBar = new QWidget(this);
    topBar->setStyleSheet("background-color: #0e141c; border-radius: 4px; padding: 4px;");
    auto *layout = new QHBoxLayout(topBar);
    layout->setContentsMargins(8, 4, 8, 4);

    auto *lblBrand = new QLabel("<b>FREEMIX</b> STUDIO", topBar);
    lblBrand->setStyleSheet("font-size: 14px; color: #00e676; letter-spacing: 1px;");
    layout->addWidget(lblBrand);

    layout->addSpacing(16);

    // Botões de Saída Rápida
    m_btnFullscreen = new QPushButton("FULLSCREEN", topBar);
    m_btnFullscreen->setStyleSheet("background-color: #1a2533; color: #dce3ed; font-weight: bold; padding: 4px 10px; border-radius: 3px; border: 1px solid #2e4159;");
    connect(m_btnFullscreen, &QPushButton::clicked, this, &FreeMixMainWindow::onFullscreenClicked);
    layout->addWidget(m_btnFullscreen);

    m_btnMultiview = new QPushButton("MULTIVIEW", topBar);
    m_btnMultiview->setStyleSheet("background-color: #1a2533; color: #dce3ed; font-weight: bold; padding: 4px 10px; border-radius: 3px; border: 1px solid #2e4159;");
    connect(m_btnMultiview, &QPushButton::clicked, this, &FreeMixMainWindow::onMultiviewClicked);
    layout->addWidget(m_btnMultiview);

    layout->addStretch();

    // Relógio e Informações
    m_lblClock = new QLabel("00:00:00", topBar);
    m_lblClock->setStyleSheet("font-size: 15px; font-weight: bold; color: #ffffff; font-family: monospace;");
    layout->addWidget(m_lblClock);

    layout->addSpacing(12);

    m_btnStream = new QPushButton("STREAM", topBar);
    m_btnStream->setStyleSheet("background-color: #1b2636; color: #00e676; font-weight: bold; padding: 5px 14px; border: 1px solid #00e676; border-radius: 3px;");
    connect(m_btnStream, &QPushButton::clicked, this, &FreeMixMainWindow::onOpenOutputsDialog);
    layout->addWidget(m_btnStream);

    m_btnRecord = new QPushButton("REC", topBar);
    m_btnRecord->setStyleSheet("background-color: #1b2636; color: #ff5252; font-weight: bold; padding: 5px 14px; border: 1px solid #ff5252; border-radius: 3px;");
    layout->addWidget(m_btnRecord);

    qobject_cast<QVBoxLayout*>(centralWidget()->layout())->addWidget(topBar);
}

void FreeMixMainWindow::createCentralMonitors()
{
    auto *monitorsContainer = new QWidget(this);
    auto *layout = new QHBoxLayout(monitorsContainer);
    layout->setContentsMargins(0, 0, 0, 0);
    layout->setSpacing(8);

    // Monitor PREVIEW (Laranja)
    auto *prevBox = new QGroupBox("PREVIEW", monitorsContainer);
    prevBox->setStyleSheet("QGroupBox { border: 2px solid #f7931e; border-radius: 4px; font-weight: bold; color: #f7931e; margin-top: 18px; } QGroupBox::title { subcontrol-origin: margin; left: 10px; }");
    auto *prevLayout = new QVBoxLayout(prevBox);
    m_previewDisplay = new VideoDisplayWidget(prevBox);
    prevLayout->addWidget(m_previewDisplay);
    layout->addWidget(prevBox, 1);

    // Console Central de Transição (T-Bar, Cut, Fade)
    auto *transBox = new QWidget(monitorsContainer);
    transBox->setFixedWidth(130);
    transBox->setStyleSheet("background-color: #101620; border: 1px solid #202d3d; border-radius: 4px;");
    auto *transLayout = new QVBoxLayout(transBox);
    transLayout->setContentsMargins(8, 12, 8, 12);
    transLayout->setSpacing(8);

    auto *btnCut = new QPushButton("CUT", transBox);
    btnCut->setStyleSheet("background-color: #26354a; color: white; font-weight: bold; height: 36px; border-radius: 3px; font-size: 13px;");
    connect(btnCut, &QPushButton::clicked, this, &FreeMixMainWindow::onCutClicked);
    transLayout->addWidget(btnCut);

    auto *btnFade = new QPushButton("FADE", transBox);
    btnFade->setStyleSheet("background-color: #1e2c3e; color: #00e676; font-weight: bold; height: 32px; border-radius: 3px;");
    connect(btnFade, &QPushButton::clicked, this, &FreeMixMainWindow::onFadeClicked);
    transLayout->addWidget(btnFade);

    auto *btnZoom = new QPushButton("ZOOM", transBox);
    btnZoom->setStyleSheet("background-color: #1e2c3e; color: #dce3ed; height: 26px; border-radius: 3px;");
    transLayout->addWidget(btnZoom);

    transLayout->addSpacing(10);

    // T-Bar Horizontal
    auto *lblTBar = new QLabel("T-BAR", transBox);
    lblTBar->setAlignment(Qt::AlignCenter);
    lblTBar->setStyleSheet("color: #8fa0b5; font-size: 10px;");
    transLayout->addWidget(lblTBar);

    m_tbarSlider = new QSlider(Qt::Horizontal, transBox);
    m_tbarSlider->setRange(0, 100);
    m_tbarSlider->setValue(0);
    connect(m_tbarSlider, &QSlider::valueChanged, this, &FreeMixMainWindow::onTBarChanged);
    transLayout->addWidget(m_tbarSlider);

    transLayout->addStretch();

    auto *btnFtb = new QPushButton("FTB", transBox);
    btnFtb->setStyleSheet("background-color: #381216; color: #ff5252; font-weight: bold; height: 28px; border: 1px solid #751f28;");
    transLayout->addWidget(btnFtb);

    layout->addWidget(transBox);

    // Monitor PROGRAM (Verde)
    auto *progBox = new QGroupBox("PROGRAM (NO AR)", monitorsContainer);
    progBox->setStyleSheet("QGroupBox { border: 2px solid #00e676; border-radius: 4px; font-weight: bold; color: #00e676; margin-top: 18px; } QGroupBox::title { subcontrol-origin: margin; left: 10px; }");
    auto *progLayout = new QVBoxLayout(progBox);
    m_programDisplay = new VideoDisplayWidget(progBox);
    progLayout->addWidget(m_programDisplay);
    layout->addWidget(progBox, 1);

    qobject_cast<QVBoxLayout*>(centralWidget()->layout())->addWidget(monitorsContainer, 3);
}

void FreeMixMainWindow::createProductionConsole()
{
    auto *consoleContainer = new QWidget(this);
    consoleContainer->setStyleSheet("background-color: #0b0f14; border: 1px solid #1c2633; border-radius: 4px;");
    auto *layout = new QHBoxLayout(consoleContainer);
    layout->setContentsMargins(6, 6, 6, 6);

    // Painel de Entradas (Mesa de Corte)
    auto *inputsPanel = new QWidget(consoleContainer);
    auto *inputsLayout = new QVBoxLayout(inputsPanel);
    inputsLayout->setContentsMargins(0, 0, 0, 0);

    auto *lblInputs = new QLabel("ENTRADAS DE VÍDEO & MÍDIAS", inputsPanel);
    lblInputs->setStyleSheet("font-weight: bold; color: #8fa0b5; font-size: 11px;");
    inputsLayout->addWidget(lblInputs);

    // Grade de canais rápidos
    auto *gridWidget = new QWidget(inputsPanel);
    auto *gridLayout = new QGridLayout(gridWidget);
    gridLayout->setSpacing(6);

    for (int i = 0; i < 4; ++i) {
        auto *tile = new QPushButton(QString("Entrada %1\n[Ao Vivo]").arg(i + 1), gridWidget);
        tile->setMinimumSize(110, 65);
        tile->setStyleSheet("background-color: #17212d; color: #dce3ed; border: 1px solid #28394e; border-radius: 3px; text-align: center;");
        gridLayout->addWidget(tile, 0, i);
    }
    inputsLayout->addWidget(gridWidget);
    layout->addWidget(inputsPanel, 4);

    // Mixer de Áudio (Master & Fones)
    auto *mixerPanel = new QWidget(consoleContainer);
    mixerPanel->setFixedWidth(200);
    mixerPanel->setStyleSheet("background-color: #0d1218; border-left: 1px solid #1f2c3b; padding: 4px;");
    auto *mixerLayout = new QHBoxLayout(mixerPanel);

    // Faixa MASTER
    auto *masterBox = new QVBoxLayout();
    auto *lblMaster = new QLabel("MASTER", mixerPanel);
    lblMaster->setStyleSheet("color: #00e676; font-weight: bold; font-size: 10px;");
    lblMaster->setAlignment(Qt::AlignCenter);
    masterBox->addWidget(lblMaster);

    auto *masterSlider = new QSlider(Qt::Vertical, mixerPanel);
    masterSlider->setRange(0, 100);
    masterSlider->setValue(85);
    masterBox->addWidget(masterSlider, 1, Qt::AlignHCenter);
    mixerLayout->addLayout(masterBox);

    // Faixa FONES
    auto *phonesBox = new QVBoxLayout();
    auto *lblPhones = new QLabel("FONES", mixerPanel);
    lblPhones->setStyleSheet("color: #29b6f6; font-weight: bold; font-size: 10px;");
    lblPhones->setAlignment(Qt::AlignCenter);
    phonesBox->addWidget(lblPhones);

    auto *phonesSlider = new QSlider(Qt::Vertical, mixerPanel);
    phonesSlider->setRange(0, 100);
    phonesSlider->setValue(75);
    phonesBox->addWidget(phonesSlider, 1, Qt::AlignHCenter);
    mixerLayout->addLayout(phonesBox);

    layout->addWidget(mixerPanel, 1);

    qobject_cast<QVBoxLayout*>(centralWidget()->layout())->addWidget(consoleContainer, 2);
}

void FreeMixMainWindow::createStatusBar()
{
    auto *statusBar = this->statusBar();
    m_lblFps = new QLabel("FPS: 60.00", statusBar);
    m_lblCpu = new QLabel("CPU: 3.2%", statusBar);

    statusBar->addPermanentWidget(m_lblFps);
    statusBar->addPermanentWidget(m_lblCpu);
    statusBar->showMessage("Pronto para transmissão.");
}

void FreeMixMainWindow::onCutClicked()
{
    if (auto *app = FreeMixApp::instance()) {
        if (auto *mgr = app->inputManager()) mgr->executeCut();
    }
}

void FreeMixMainWindow::onFadeClicked()
{
    if (auto *app = FreeMixApp::instance()) {
        if (auto *mgr = app->inputManager()) mgr->executeFade(300);
    }
}

void FreeMixMainWindow::onTBarChanged(int value)
{
    if (auto *app = FreeMixApp::instance()) {
        if (auto *mgr = app->inputManager()) {
            mgr->setTBarPosition(static_cast<float>(value) / 100.0f);
        }
    }
}

void FreeMixMainWindow::onFullscreenClicked()
{
    OutputsDialog dlg(this);
    dlg.exec();
}

void FreeMixMainWindow::onMultiviewClicked()
{
    OutputsDialog dlg(this);
    dlg.exec();
}

#include "dialogs/OutputsDialog.h"
#include "dialogs/AudioMatrixDialog.h"
#include "dialogs/GeneralSettingsDialog.h"
#include "dialogs/AddInputDialog.h"
#include "dialogs/GraphicsStudioDialog.h"

void FreeMixMainWindow::onOpenSettings()
{
    GeneralSettingsDialog dlg(nullptr, this);
    dlg.exec();
}

void FreeMixMainWindow::onOpenOutputsDialog()
{
    OutputsDialog dlg(this);
    dlg.exec();
}

void FreeMixMainWindow::onOpenAudioDialog()
{
    AudioMatrixDialog dlg(this);
    dlg.exec();
}

void FreeMixMainWindow::onUpdateClock()
{
    m_lblClock->setText(QTime::currentTime().toString("hh:mm:ss"));
}

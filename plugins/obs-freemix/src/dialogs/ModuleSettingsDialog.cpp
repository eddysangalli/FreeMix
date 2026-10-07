#include "ModuleSettingsDialog.h"
#include "FreeMixPlugin.h"

#include <QTabWidget>
#include <QVBoxLayout>
#include <QFormLayout>
#include <QComboBox>
#include <QSpinBox>
#include <QDoubleSpinBox>
#include <QCheckBox>
#include <QLineEdit>
#include <QPushButton>
#include <QDialogButtonBox>
#include <QLabel>
#include <QGroupBox>
#include <QScrollArea>
#include <QHBoxLayout>
#include <QMessageBox>

ModuleSettingsDialog::ModuleSettingsDialog(FreeMixPlugin* plugin, QWidget* parent)
    : QDialog(parent), m_plugin(plugin)
{
    setWindowTitle(tr("Configurações dos Módulos"));
    setMinimumSize(700, 550);
    setModal(true);
    setupUI();
}

ModuleSettingsDialog::~ModuleSettingsDialog()
{
}

void ModuleSettingsDialog::setupUI()
{
    auto* mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(0);

    m_tabWidget = new QTabWidget();
    m_tabWidget->setObjectName("ModuleSettings_TabWidget");
    mainLayout->addWidget(m_tabWidget);

    createReplayTab();
    createCallTab();
    createMultiCorderTab();
    createPlaylistTab();
    createOverlaysTab();

    m_buttonBox = new QDialogButtonBox(QDialogButtonBox::Ok | QDialogButtonBox::Apply | QDialogButtonBox::Cancel);
    m_buttonBox->setObjectName("ModuleSettings_ButtonBox");
    mainLayout->addWidget(m_buttonBox);

    connect(m_buttonBox->button(QDialogButtonBox::Ok), &QPushButton::clicked, this, &ModuleSettingsDialog::onOkClicked);
    connect(m_buttonBox->button(QDialogButtonBox::Apply), &QPushButton::clicked, this, &ModuleSettingsDialog::onApplyClicked);
    connect(m_buttonBox->button(QDialogButtonBox::Cancel), &QPushButton::clicked, this, &QDialog::reject);
}

QWidget* ModuleSettingsDialog::createScrollTab(const QString& title, QWidget* content)
{
    QScrollArea* scroll = new QScrollArea();
    scroll->setWidget(content);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    m_tabWidget->addTab(scroll, title);
    return scroll;
}

void ModuleSettingsDialog::createReplayTab()
{
    QWidget* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(16);

    auto* group = new QGroupBox(tr("Configurações Gerais do Replay"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(10);

    QComboBox* bufferSource = new QComboBox();
    bufferSource->addItem(tr("Selecione uma câmera..."), "");
    bufferSource->setObjectName("replay_buffer_source");
    groupLayout->addRow(tr("Fonte do &Buffer:"), bufferSource);

    QSpinBox* bufferDuration = new QSpinBox();
    bufferDuration->setRange(5, 3600);
    bufferDuration->setSuffix(" s");
    bufferDuration->setValue(30);
    bufferDuration->setObjectName("replay_buffer_duration");
    groupLayout->addRow(tr("Duração do &Buffer:"), bufferDuration);

    QSpinBox* maxReplays = new QSpinBox();
    maxReplays->setRange(1, 100);
    maxReplays->setValue(2);
    maxReplays->setObjectName("replay_max_replays");
    groupLayout->addRow(tr("Máximo de &Lances:"), maxReplays);

    QCheckBox* autoStart = new QCheckBox(tr("Iniciar buffer automaticamente ao abrir o FreeMix"));
    autoStart->setObjectName("replay_auto_start");
    groupLayout->addRow(autoStart);

    layout->addWidget(group);

    auto* playbackGroup = new QGroupBox(tr("Reprodução"));
    auto* playbackLayout = new QFormLayout(playbackGroup);
    playbackLayout->setSpacing(10);

    QDoubleSpinBox* defaultSpeed = new QDoubleSpinBox();
    defaultSpeed->setRange(10, 500);
    defaultSpeed->setDecimals(1);
    defaultSpeed->setSuffix(" %");
    defaultSpeed->setValue(100);
    defaultSpeed->setObjectName("replay_default_speed");
    playbackLayout->addRow(tr("Velocidade &Padrão:"), defaultSpeed);

    QComboBox* transition = new QComboBox();
    transition->addItems({"Cut", "Fade", "Stinger"});
    transition->setObjectName("replay_transition");
    playbackLayout->addRow(tr("Transição ao &Entrar no Ar:"), transition);

    QDoubleSpinBox* transitionDuration = new QDoubleSpinBox();
    transitionDuration->setRange(0, 5);
    transitionDuration->setDecimals(2);
    transitionDuration->setSuffix(" s");
    transitionDuration->setValue(0.5);
    transitionDuration->setObjectName("replay_transition_duration");
    playbackLayout->addRow(tr("Duração da Transição:"), transitionDuration);

    layout->addWidget(playbackGroup);

    auto* hotkeyGroup = new QGroupBox(tr("Atalhos de Replay"));
    auto* hotkeyLayout = new QFormLayout(hotkeyGroup);
    hotkeyLayout->setSpacing(8);

    QKeySequenceEdit* grabKey = new QKeySequenceEdit(QKeySequence("Ctrl+Shift+G"));
    grabKey->setObjectName("replay_hk_grab");
    hotkeyLayout->addRow(tr("Capturar &Lance:"), grabKey);

    QKeySequenceEdit* playKey = new QKeySequenceEdit(QKeySequence("Ctrl+Shift+P"));
    playKey->setObjectName("replay_hk_play");
    hotkeyLayout->addRow(tr("&Reproduzir:"), playKey);

    QKeySequenceEdit* undoKey = new QKeySequenceEdit(QKeySequence("Ctrl+Z"));
    undoKey->setObjectName("replay_hk_undo");
    hotkeyLayout->addRow(tr("&Desfazer:"), undoKey);

    layout->addWidget(hotkeyGroup);
    layout->addStretch();

    createScrollTab(tr("Replay"), page);
}

void ModuleSettingsDialog::createCallTab()
{
    QWidget* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(16);

    auto* group = new QGroupBox(tr("Configurações do FreeMix Call"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(10);

    QComboBox* stunServer = new QComboBox();
    stunServer->addItems({"stun.l.google.com:19302", "stun1.l.google.com:19302", "stun2.l.google.com:19302", "Personalizado..."});
    stunServer->setEditable(true);
    stunServer->setObjectName("call_stun_server");
    groupLayout->addRow(tr("Servidor &STUN:"), stunServer);

    QLineEdit* turnServer = new QLineEdit();
    turnServer->setPlaceholderText(tr("turn:server:port?transport=udp"));
    turnServer->setObjectName("call_turn_server");
    groupLayout->addRow(tr("Servidor &TURN:"), turnServer);

    QLineEdit* turnUser = new QLineEdit();
    turnUser->setPlaceholderText(tr("Usuário TURN"));
    turnUser->setObjectName("call_turn_user");
    groupLayout->addRow(tr("Usuário TURN:"), turnUser);

    QLineEdit* turnPass = new QLineEdit();
    turnPass->setEchoMode(QLineEdit::Password);
    turnPass->setPlaceholderText(tr("Senha TURN"));
    turnPass->setObjectName("call_turn_pass");
    groupLayout->addRow(tr("Senha TURN:"), turnPass);

    QCheckBox* preferH264 = new QCheckBox(tr("Preferir H.264 (melhor compatibilidade)"));
    preferH264->setObjectName("call_prefer_h264");
    preferH264->setChecked(true);
    groupLayout->addRow(preferH264);

    QCheckBox* enableSimulcast = new QCheckBox(tr("Habilitar Simulcast (múltiplas qualidades)"));
    enableSimulcast->setObjectName("call_simulcast");
    groupLayout->addRow(enableSimulcast);

    layout->addWidget(group);

    auto* defaultsGroup = new QGroupBox(tr("Padrões para Novas Chamadas"));
    auto* defaultsLayout = new QFormLayout(defaultsGroup);
    defaultsLayout->setSpacing(10);

    QSpinBox* defaultWidth = new QSpinBox();
    defaultWidth->setRange(640, 3840);
    defaultWidth->setValue(1920);
    defaultWidth->setObjectName("call_default_width");
    defaultsLayout->addRow(tr("Largura &Padrão:"), defaultWidth);

    QSpinBox* defaultHeight = new QSpinBox();
    defaultHeight->setRange(360, 2160);
    defaultHeight->setValue(1080);
    defaultHeight->setObjectName("call_default_height");
    defaultsLayout->addRow(tr("Altura &Padrão:"), defaultHeight);

    QSpinBox* defaultBitrate = new QSpinBox();
    defaultBitrate->setRange(500, 20000);
    defaultBitrate->setSuffix(" Kbps");
    defaultBitrate->setValue(4000);
    defaultBitrate->setObjectName("call_default_bitrate");
    defaultsLayout->addRow(tr("Taxa de Bits &Padrão:"), defaultBitrate);

    QCheckBox* rerouteAudio = new QCheckBox(tr("Roteamento de áudio separado (Mix-Minus)"));
    rerouteAudio->setObjectName("call_reroute_audio");
    rerouteAudio->setChecked(true);
    defaultsLayout->addRow(rerouteAudio);

    QCheckBox* autoReturn = new QCheckBox(tr("Enviar retorno de programa automaticamente"));
    autoReturn->setObjectName("call_auto_return");
    autoReturn->setChecked(true);
    defaultsLayout->addRow(autoReturn);

    layout->addWidget(defaultsGroup);
    layout->addStretch();

    createScrollTab(tr("FreeMix Call"), page);
}

void ModuleSettingsDialog::createMultiCorderTab()
{
    QWidget* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(16);

    auto* group = new QGroupBox(tr("Gravação ISO / MultiCorder"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(10);

    QLineEdit* isoPath = new QLineEdit();
    isoPath->setPlaceholderText(tr("Pasta para gravações ISO"));
    isoPath->setObjectName("mc_path");
    auto* pathLayout = new QHBoxLayout();
    pathLayout->addWidget(isoPath);
    QPushButton* browseBtn = new QPushButton(tr("Explorar..."));
    browseBtn->setObjectName("mc_browse");
    pathLayout->addWidget(browseBtn);
    groupLayout->addRow(tr("&Pasta de Saída:"), pathLayout);

    QComboBox* isoFormat = new QComboBox();
    isoFormat->addItems({"mp4", "mkv", "mov"});
    isoFormat->setObjectName("mc_format");
    groupLayout->addRow(tr("&Formato:"), isoFormat);

    QComboBox* isoEncoder = new QComboBox();
    isoEncoder->addItems({"NVENC", "AMF", "QuickSync", "x264", "Mesmo da transmissão"});
    isoEncoder->setObjectName("mc_encoder");
    groupLayout->addRow(tr("&Codificador:"), isoEncoder);

    QSpinBox* isoBitrate = new QSpinBox();
    isoBitrate->setRange(1000, 50000);
    isoBitrate->setSuffix(" Kbps");
    isoBitrate->setValue(10000);
    isoBitrate->setObjectName("mc_bitrate");
    groupLayout->addRow(tr("Taxa de &Bits:"), isoBitrate);

    QComboBox* namingPattern = new QComboBox();
    namingPattern->addItems({"%nome% %data% %hora%", "%data% %hora% %nome%", "ISO_%nome%_%contador%"});
    namingPattern->setObjectName("mc_naming");
    groupLayout->addRow(tr("Padrão de &Nome:"), namingPattern);

    layout->addWidget(group);

    auto* tracksGroup = new QGroupBox(tr("Faixas de Áudio por Gravação"));
    auto* tracksLayout = new QFormLayout(tracksGroup);
    tracksLayout->setSpacing(8);

    QCheckBox* track1 = new QCheckBox(tr("Faixa 1: Master (Programa)"));
    track1->setObjectName("mc_track_1");
    track1->setChecked(true);
    tracksLayout->addRow(track1);

    QCheckBox* track2 = new QCheckBox(tr("Faixa 2: Limpa (sem gráficos/voz)"));
    track2->setObjectName("mc_track_2");
    track2->setChecked(true);
    tracksLayout->addRow(track2);

    QCheckBox* track3 = new QCheckBox(tr("Faixa 3: Aux A (Retorno Convidado)"));
    track3->setObjectName("mc_track_3");
    tracksLayout->addRow(track3);

    QCheckBox* track4 = new QCheckBox(tr("Faixa 4: Aux B (Fones Operador)"));
    track4->setObjectName("mc_track_4");
    tracksLayout->addRow(track4);

    layout->addWidget(tracksGroup);

    auto* actionGroup = new QGroupBox(tr("Ações"));
    auto* actionLayout = new QHBoxLayout(actionGroup);
    actionLayout->setSpacing(8);

    QPushButton* startBtn = new QPushButton(tr("Iniciar Gravação ISO"));
    startBtn->setObjectName("mc_start");
    actionLayout->addWidget(startBtn);

    QPushButton* stopBtn = new QPushButton(tr("Parar Gravação ISO"));
    stopBtn->setObjectName("mc_stop");
    stopBtn->setEnabled(false);
    actionLayout->addWidget(stopBtn);

    QPushButton* openFolderBtn = new QPushButton(tr("Abrir Pasta"));
    openFolderBtn->setObjectName("mc_open_folder");
    actionLayout->addWidget(openFolderBtn);

    layout->addWidget(actionGroup);
    layout->addStretch();

    createScrollTab(tr("MultiCorder"), page);
}

void ModuleSettingsDialog::createPlaylistTab()
{
    QWidget* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(16);

    auto* group = new QGroupBox(tr("Playlist / Lista de Reprodução"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(10);

    QComboBox* playlistSource = new QComboBox();
    playlistSource->addItems({"Media Playlist (VLC)", "FFmpeg Playlist"});
    playlistSource->setObjectName("pl_source");
    groupLayout->addRow(tr("Tipo de &Playlist:"), playlistSource);

    QCheckBox* loopPlaylist = new QCheckBox(tr("Repetir lista automaticamente"));
    loopPlaylist->setObjectName("pl_loop");
    groupLayout->addRow(loopPlaylist);

    QCheckBox* autoPlay = new QCheckBox(tr("Reproduzir automaticamente ao carregar"));
    autoPlay->setObjectName("pl_autoplay");
    groupLayout->addRow(autoPlay);

    QCheckBox* crossfade = new QCheckBox(tr("Crossfade entre itens"));
    crossfade->setObjectName("pl_crossfade");
    groupLayout->addRow(crossfade);

    QDoubleSpinBox* crossfadeDuration = new QDoubleSpinBox();
    crossfadeDuration->setRange(0, 10);
    crossfadeDuration->setDecimals(2);
    crossfadeDuration->setSuffix(" s");
    crossfadeDuration->setValue(1.0);
    crossfadeDuration->setObjectName("pl_crossfade_dur");
    groupLayout->addRow(tr("Duração do Crossfade:"), crossfadeDuration);

    layout->addWidget(group);

    auto* controlsGroup = new QGroupBox(tr("Controles de Playlist"));
    auto* controlsLayout = new QFormLayout(controlsGroup);
    controlsLayout->setSpacing(8);

    QKeySequenceEdit* playPause = new QKeySequenceEdit(QKeySequence("Space"));
    playPause->setObjectName("pl_hk_play");
    controlsLayout->addRow(tr("Play/Pause:"), playPause);

    QKeySequenceEdit* nextItem = new QKeySequenceEdit(QKeySequence("Right"));
    nextItem->setObjectName("pl_hk_next");
    controlsLayout->addRow(tr("Próximo:"), nextItem);

    QKeySequenceEdit* prevItem = new QKeySequenceEdit(QKeySequence("Left"));
    prevItem->setObjectName("pl_hk_prev");
    controlsLayout->addRow(tr("Anterior:"), prevItem);

    QKeySequenceEdit* stopItem = new QKeySequenceEdit(QKeySequence("Ctrl+."));
    stopItem->setObjectName("pl_hk_stop");
    controlsLayout->addRow(tr("Parar:"), stopItem);

    layout->addWidget(controlsGroup);
    layout->addStretch();

    createScrollTab(tr("Playlist"), page);
}

void ModuleSettingsDialog::createOverlaysTab()
{
    QWidget* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(16);

    auto* group = new QGroupBox(tr("Downstream Keyer (Overlays)"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(10);

    for (int i = 1; i <= 4; ++i) {
        auto* dskGroup = new QGroupBox(tr("Canal DSK %1").arg(i));
        auto* dskLayout = new QFormLayout(dskGroup);
        dskLayout->setSpacing(8);

        QCheckBox* enabled = new QCheckBox(tr("Habilitar canal"));
        enabled->setObjectName(QString("dsk%1_enabled").arg(i));
        dskLayout->addRow(enabled);

        QComboBox* source = new QComboBox();
        source->addItem(tr("Nenhum"), "");
        source->setObjectName(QString("dsk%1_source").arg(i));
        dskLayout->addRow(tr("Fonte:"), source);

        QComboBox* transition = new QComboBox();
        transition->addItems({"Cut", "Fade", "Stinger"});
        transition->setObjectName(QString("dsk%1_transition").arg(i));
        dskLayout->addRow(tr("Transição:"), transition);

        QDoubleSpinBox* duration = new QDoubleSpinBox();
        duration->setRange(0, 5);
        duration->setDecimals(2);
        duration->setSuffix(" s");
        duration->setValue(0.3);
        duration->setObjectName(QString("dsk%1_duration").arg(i));
        dskLayout->addRow(tr("Duração:"), duration);

        QKeySequenceEdit* toggleKey = new QKeySequenceEdit();
        toggleKey->setObjectName(QString("dsk%1_hk_toggle").arg(i));
        dskLayout->addRow(tr("Atalho Liga/Desliga:"), toggleKey);

        groupLayout->addRow(dskGroup);
    }

    layout->addWidget(group);

    auto* gcGroup = new QGroupBox(tr("GC / Gráficos (CasparCG / SPX-GC)"));
    auto* gcLayout = new QFormLayout(gcGroup);
    gcLayout->setSpacing(10);

    QLineEdit* casparHost = new QLineEdit("127.0.0.1");
    casparHost->setObjectName("gc_caspar_host");
    gcLayout->addRow(tr("Host CasparCG:"), casparHost);

    QSpinBox* casparPort = new QSpinBox();
    casparPort->setRange(1, 65535);
    casparPort->setValue(5250);
    casparPort->setObjectName("gc_caspar_port");
    gcLayout->addRow(tr("Porta CasparCG:"), casparPort);

    QCheckBox* autoConnect = new QCheckBox(tr("Conectar automaticamente ao iniciar"));
    autoConnect->setObjectName("gc_auto_connect");
    gcLayout->addRow(autoConnect);

    layout->addWidget(gcGroup);
    layout->addStretch();

    createScrollTab(tr("Overlays"), page);
}

void ModuleSettingsDialog::onApplyClicked()
{
    collectAndEmitSettings();
}

void ModuleSettingsDialog::onOkClicked()
{
    collectAndEmitSettings();
    accept();
}

void ModuleSettingsDialog::collectAndEmitSettings()
{
    QMap<QString, QVariant> settings;
    emit settingsApplied(settings);
}
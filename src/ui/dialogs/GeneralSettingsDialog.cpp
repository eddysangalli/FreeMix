#include "GeneralSettingsDialog.h"

#include <QListWidget>
#include <QStackedWidget>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QPushButton>
#include <QDialogButtonBox>
#include <QLabel>
#include <QFormLayout>
#include <QComboBox>
#include <QSpinBox>
#include <QDoubleSpinBox>
#include <QCheckBox>
#include <QLineEdit>
#include <QGroupBox>
#include <QScrollArea>
#include <QKeySequenceEdit>
#include <QMessageBox>

GeneralSettingsDialog::GeneralSettingsDialog(FreeMixPlugin* plugin, QWidget* parent)
    : QDialog(parent), m_plugin(plugin)
{
    setWindowTitle(tr("Configurações do FreeMix"));
    setMinimumSize(800, 600);
    setModal(true);
    setupUI();
}

GeneralSettingsDialog::~GeneralSettingsDialog()
{
}

void GeneralSettingsDialog::setupUI()
{
    auto* mainLayout = new QHBoxLayout(this);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(0);

    m_navList = new QListWidget();
    m_navList->setFixedWidth(200);
    m_navList->setObjectName("Settings_NavList");
    createNavigation();
    mainLayout->addWidget(m_navList);

    m_pages = new QStackedWidget();
    m_pages->setObjectName("Settings_Pages");
    mainLayout->addWidget(m_pages, 1);

    createVideoPage();
    createAudioPage();
    createStreamingPage();
    createRecordingPage();
    createOutputsPage();
    createInterfacePage();
    createShortcutsPage();
    createComponentsPage();

    m_buttonBox = new QDialogButtonBox(QDialogButtonBox::Ok | QDialogButtonBox::Apply | QDialogButtonBox::Cancel);
    m_buttonBox->setObjectName("Settings_ButtonBox");

    auto* buttonLayout = new QHBoxLayout();
    buttonLayout->addStretch();
    buttonLayout->addWidget(m_buttonBox);
    buttonLayout->setContentsMargins(10, 10, 10, 10);

    auto* centralWidget = new QWidget();
    auto* centralLayout = new QVBoxLayout(centralWidget);
    centralLayout->setContentsMargins(0, 0, 0, 0);
    centralLayout->addWidget(m_pages);
    centralLayout->addLayout(buttonLayout);

    mainLayout->addWidget(centralWidget, 1);

    connect(m_navList, &QListWidget::currentItemChanged, this, &GeneralSettingsDialog::onNavigationChanged);
    connect(m_buttonBox->button(QDialogButtonBox::Ok), &QPushButton::clicked, this, &GeneralSettingsDialog::onOkClicked);
    connect(m_buttonBox->button(QDialogButtonBox::Apply), &QPushButton::clicked, this, &GeneralSettingsDialog::onApplyClicked);
    connect(m_buttonBox->button(QDialogButtonBox::Cancel), &QPushButton::clicked, this, &QDialog::reject);

    m_navList->setCurrentRow(0);
}

void GeneralSettingsDialog::createNavigation()
{
    QStringList pages = {
        tr("Vídeo e Formato"),
        tr("Áudio e Dispositivos"),
        tr("Transmissão"),
        tr("Gravação"),
        tr("Saídas"),
        tr("Interface e Layout"),
        tr("Atalhos"),
        tr("Componentes e Integrações")
    };

    for (const QString& page : pages) {
        QListWidgetItem* item = new QListWidgetItem(page);
        m_navList->addItem(item);
    }
}

void GeneralSettingsDialog::createPage(const QString& name, QWidget* page)
{
    QScrollArea* scroll = new QScrollArea();
    scroll->setWidget(page);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    m_pages->addWidget(scroll);
    m_pagesMap[name] = scroll;
}

void GeneralSettingsDialog::createVideoPage()
{
    QWidget* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(16);

    auto* group = new QGroupBox(tr("Configurações de Vídeo da Produção"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(10);

    QComboBox* baseRes = new QComboBox();
    baseRes->addItems({"1920x1080", "1280x720", "3840x2160", "2560x1440", "Personalizado..."});
    baseRes->setObjectName("video_base_res");
    groupLayout->addRow(tr("Resolução &Base (Canvas):"), baseRes);

    QComboBox* outputRes = new QComboBox();
    outputRes->addItems({"1920x1080", "1280x720", "3840x2160", "2560x1440", "Igual à base"});
    outputRes->setObjectName("video_output_res");
    groupLayout->addRow(tr("Resolução de &Saída (Escalonada):"), outputRes);

    QDoubleSpinBox* fps = new QDoubleSpinBox();
    fps->setRange(1, 240);
    fps->setDecimals(2);
    fps->setValue(60);
    fps->setObjectName("video_fps");
    groupLayout->addRow(tr("Taxa de &Quadros (FPS):"), fps);

    QComboBox* fpsType = new QComboBox();
    fpsType->addItems({"Comum (NTSC)", "Inteiro", "Racional", "Personalizado"});
    fpsType->setObjectName("video_fps_type");
    groupLayout->addRow(tr("Tipo de FPS:"), fpsType);

    QComboBox* colorFormat = new QComboBox();
    colorFormat->addItems({"NV12", "I420", "I444", "P010", "RGBA"});
    colorFormat->setObjectName("video_color_format");
    groupLayout->addRow(tr("Formato de &Cor:"), colorFormat);

    QComboBox* colorSpace = new QComboBox();
    colorSpace->addItems({"709 (Padrão)", "601", "2020", "P3 D65"});
    colorSpace->setObjectName("video_color_space");
    groupLayout->addRow(tr("Espaço de &Cor:"), colorSpace);

    QComboBox* colorRange = new QComboBox();
    colorRange->addItems({"Parcial (Vídeo)", "Completo (PC)"});
    colorRange->setObjectName("video_color_range");
    groupLayout->addRow(tr("Intervalo de &Cor:"), colorRange);

    layout->addWidget(group);
    layout->addStretch();

    createPage(tr("Vídeo e Formato"), page);
}

void GeneralSettingsDialog::createAudioPage()
{
    QWidget* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(16);

    auto* group = new QGroupBox(tr("Dispositivos de Áudio"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(10);

    QComboBox* sampleRate = new QComboBox();
    sampleRate->addItems({"48000", "44100", "96000"});
    sampleRate->setObjectName("audio_sample_rate");
    groupLayout->addRow(tr("Taxa de &Amostragem:"), sampleRate);

    QComboBox* channels = new QComboBox();
    channels->addItems({"Estéreo", "Mono", "5.1 Surround", "7.1 Surround"});
    channels->setObjectName("audio_channels");
    groupLayout->addRow(tr("&Canais:"), channels);

    QComboBox* desktopDevice = new QComboBox();
    desktopDevice->addItem(tr("Padrão"), "");
    desktopDevice->setObjectName("audio_desktop_device");
    groupLayout->addRow(tr("Áudio do &Desktop:"), desktopDevice);

    QComboBox* desktopDevice2 = new QComboBox();
    desktopDevice2->addItem(tr("Padrão"), "");
    desktopDevice2->setObjectName("audio_desktop_device_2");
    groupLayout->addRow(tr("Áudio do &Desktop 2:"), desktopDevice2);

    QComboBox* micDevice = new QComboBox();
    micDevice->addItem(tr("Padrão"), "");
    micDevice->setObjectName("audio_mic_device");
    groupLayout->addRow(tr("&Microfone / Auxiliar:"), micDevice);

    QComboBox* monitoring = new QComboBox();
    monitoring->addItems({tr("Monitorar e Saída"), tr("Apenas Monitorar"), tr("Desativado")});
    monitoring->setObjectName("audio_monitoring");
    groupLayout->addRow(tr("Monitoramento &Padrão:"), monitoring);

    layout->addWidget(group);

    auto* busGroup = new QGroupBox(tr("Barramentos de Áudio (Mix-Minus)"));
    auto* busLayout = new QFormLayout(busGroup);
    busLayout->setSpacing(10);

    QCheckBox* enableBuses = new QCheckBox(tr("Habilitar barramentos Aux A / Aux B para convidados"));
    enableBuses->setObjectName("audio_enable_buses");
    busLayout->addRow(enableBuses);

    QComboBox* auxASource = new QComboBox();
    auxASource->addItem(tr("Master"), "master");
    auxASource->setObjectName("audio_aux_a_source");
    busLayout->addRow(tr("Fonte Aux A (Retorno Convidado):"), auxASource);

    QComboBox* auxBSource = new QComboBox();
    auxBSource->addItem(tr("Master"), "master");
    auxBSource->setObjectName("audio_aux_b_source");
    busLayout->addRow(tr("Fonte Aux B (Fones Operador):"), auxBSource);

    layout->addWidget(busGroup);
    layout->addStretch();

    createPage(tr("Áudio e Dispositivos"), page);
}

void GeneralSettingsDialog::createStreamingPage()
{
    QWidget* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(16);

    auto* group = new QGroupBox(tr("Serviço de Transmissão"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(10);

    QComboBox* service = new QComboBox();
    service->addItems({"YouTube", "Twitch", "Facebook", "Twitter/X", "Trovo", "Rumble", "Kick", "Personalizado..."});
    service->setObjectName("stream_service");
    groupLayout->addRow(tr("&Serviço:"), service);

    QComboBox* server = new QComboBox();
    server->setEditable(true);
    server->setObjectName("stream_server");
    groupLayout->addRow(tr("Ser&vidor:"), server);

    QLineEdit* streamKey = new QLineEdit();
    streamKey->setEchoMode(QLineEdit::Password);
    streamKey->setObjectName("stream_key");
    streamKey->setPlaceholderText(tr("Chave de transmissão"));
    groupLayout->addRow(tr("&Chave de Transmissão:"), streamKey);

    QCheckBox* showKey = new QCheckBox(tr("Mostrar chave"));
    showKey->setObjectName("stream_show_key");
    connect(showKey, &QCheckBox::toggled, [streamKey](bool checked) {
        streamKey->setEchoMode(checked ? QLineEdit::Normal : QLineEdit::Password);
    });
    groupLayout->addRow(showKey);

    QCheckBox* useAuth = new QCheckBox(tr("Conectar conta (OAuth)"));
    useAuth->setObjectName("stream_use_auth");
    groupLayout->addRow(useAuth);

    layout->addWidget(group);

    auto* encGroup = new QGroupBox(tr("Codificador de Transmissão"));
    auto* encLayout = new QFormLayout(encGroup);
    encLayout->setSpacing(10);

    QComboBox* encoder = new QComboBox();
    encoder->addItems({"NVENC (NVIDIA)", "AMF (AMD)", "QuickSync (Intel)", "Apple VT (macOS)", "x264 (CPU)", "SVT-AV1 (CPU)", "AOM-AV1 (CPU)"});
    encoder->setObjectName("stream_encoder");
    encLayout->addRow(tr("&Codificador:"), encoder);

    QCheckBox* preferHw = new QCheckBox(tr("Preferir codificação por hardware"));
    preferHw->setObjectName("stream_prefer_hw");
    preferHw->setChecked(true);
    encLayout->addRow(preferHw);

    QComboBox* preset = new QComboBox();
    preset->addItems({"max-quality", "quality", "balanced", "performance", "max-performance"});
    preset->setObjectName("stream_preset");
    encLayout->addRow(tr("Pre&definição:"), preset);

    QSpinBox* bitrate = new QSpinBox();
    bitrate->setRange(100, 100000);
    bitrate->setSuffix(" Kbps");
    bitrate->setValue(6000);
    bitrate->setObjectName("stream_bitrate");
    encLayout->addRow(tr("Taxa de &Bits:"), bitrate);

    QComboBox* rateControl = new QComboBox();
    rateControl->addItems({"CBR", "VBR", "CQP", "Lossless"});
    rateControl->setObjectName("stream_rate_control");
    encLayout->addRow(tr("Controle de &Taxa:"), rateControl);

    QSpinBox* keyframeInterval = new QSpinBox();
    keyframeInterval->setRange(0, 10);
    keyframeInterval->setSuffix(" s (0 = automático)");
    keyframeInterval->setValue(2);
    keyframeInterval->setObjectName("stream_keyframe_interval");
    encLayout->addRow(tr("Intervalo de &Keyframe:"), keyframeInterval);

    QComboBox* profile = new QComboBox();
    profile->addItems({"high", "main", "baseline"});
    profile->setObjectName("stream_profile");
    encLayout->addRow(tr("&Perfil:"), profile);

    layout->addWidget(encGroup);
    layout->addStretch();

    createPage(tr("Transmissão"), page);
}

void GeneralSettingsDialog::createRecordingPage()
{
    QWidget* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(16);

    auto* group = new QGroupBox(tr("Configurações de Gravação"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(10);

    QLineEdit* path = new QLineEdit();
    path->setPlaceholderText(tr("Pasta de gravações"));
    path->setObjectName("rec_path");
    auto* pathLayout = new QHBoxLayout();
    pathLayout->addWidget(path);
    QPushButton* browseBtn = new QPushButton(tr("Explorar..."));
    browseBtn->setObjectName("rec_browse");
    pathLayout->addWidget(browseBtn);
    groupLayout->addRow(tr("&Caminho:"), pathLayout);

    QComboBox* format = new QComboBox();
    format->addItems({"mp4", "mkv", "mov", "flv", "ts"});
    format->setObjectName("rec_format");
    groupLayout->addRow(tr("&Formato:"), format);

    QComboBox* encoder = new QComboBox();
    encoder->addItems({"NVENC (NVIDIA)", "AMF (AMD)", "QuickSync (Intel)", "Apple VT (macOS)", "x264 (CPU)", "SVT-AV1 (CPU)", "AOM-AV1 (CPU)"});
    encoder->setObjectName("rec_encoder");
    groupLayout->addRow(tr("&Codificador:"), encoder);

    QComboBox* preset = new QComboBox();
    preset->addItems({"max-quality", "quality", "balanced", "performance", "max-performance"});
    preset->setObjectName("rec_preset");
    groupLayout->addRow(tr("Pre&definição:"), preset);

    QSpinBox* bitrate = new QSpinBox();
    bitrate->setRange(0, 100000);
    bitrate->setSuffix(" Kbps (0 = CQP/Lossless)");
    bitrate->setValue(0);
    bitrate->setObjectName("rec_bitrate");
    groupLayout->addRow(tr("Taxa de &Bits:"), bitrate);

    QComboBox* rateControl = new QComboBox();
    rateControl->addItems({"CQP", "CBR", "VBR", "Lossless"});
    rateControl->setObjectName("rec_rate_control");
    groupLayout->addRow(tr("Controle de &Taxa:"), rateControl);

    QCheckBox* recordWhenStreaming = new QCheckBox(tr("Gravar automaticamente ao transmitir"));
    recordWhenStreaming->setObjectName("rec_auto_record");
    groupLayout->addRow(recordWhenStreaming);

    QCheckBox* keepRecording = new QCheckBox(tr("Continuar gravando quando a transmissão parar"));
    keepRecording->setObjectName("rec_keep_recording");
    groupLayout->addRow(keepRecording);

    layout->addWidget(group);

    auto* tracksGroup = new QGroupBox(tr("Faixas de Áudio (Multitrack)"));
    auto* tracksLayout = new QFormLayout(tracksGroup);
    tracksLayout->setSpacing(10);

    for (int i = 1; i <= 6; ++i) {
        QCheckBox* track = new QCheckBox(tr("Faixa %1").arg(i));
        track->setObjectName(QString("rec_track_%1").arg(i));
        track->setChecked(i <= 2);
        tracksLayout->addRow(track);
    }

    layout->addWidget(tracksGroup);
    layout->addStretch();

    createPage(tr("Gravação"), page);
}

void GeneralSettingsDialog::createOutputsPage()
{
    QWidget* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(16);

    auto* group = new QGroupBox(tr("Saídas Adicionais"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(10);

    QCheckBox* virtualCam = new QCheckBox(tr("Habilitar Câmera Virtual"));
    virtualCam->setObjectName("out_virtual_cam");
    groupLayout->addRow(virtualCam);

    QComboBox* vcType = new QComboBox();
    vcType->addItems({tr("Programa"), tr("Pré-visualização"), tr("Multiview")});
    vcType->setObjectName("out_vc_type");
    groupLayout->addRow(tr("Fonte da Câmera Virtual:"), vcType);

    QCheckBox* replayBuffer = new QCheckBox(tr("Habilitar Buffer de Replay"));
    replayBuffer->setObjectName("out_replay_buffer");
    groupLayout->addRow(replayBuffer);

    QSpinBox* replayTime = new QSpinBox();
    replayTime->setRange(5, 3600);
    replayTime->setSuffix(" s");
    replayTime->setValue(30);
    replayTime->setObjectName("out_replay_time");
    groupLayout->addRow(tr("Duração do Replay:"), replayTime);

    QCheckBox* autoReplay = new QCheckBox(tr("Iniciar replay automaticamente ao transmitir"));
    autoReplay->setObjectName("out_auto_replay");
    groupLayout->addRow(autoReplay);

    layout->addWidget(group);
    layout->addStretch();

    createPage(tr("Saídas"), page);
}

void GeneralSettingsDialog::createInterfacePage()
{
    QWidget* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(16);

    auto* group = new QGroupBox(tr("Tema e Aparência"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(10);

    QComboBox* theme = new QComboBox();
    theme->addItems({"Mesa de Corte (FreeMix)", "Yami", "Yami Acri", "Yami Classic", "Yami Grey", "Yami Light", "Yami Rachni", "Acri", "Dark", "Light", "Rachni"});
    theme->setObjectName("ui_theme");
    groupLayout->addRow(tr("&Tema:"), theme);

    QComboBox* language = new QComboBox();
    language->addItems({"Português (Brasil)", "English", "Español", "Français", "Deutsch", "Italiano", "日本語", "中文 (简体)", "中文 (繁體)", "한국어"});
    language->setObjectName("ui_language");
    groupLayout->addRow(tr("&Idioma:"), language);

    QCheckBox* showLabels = new QCheckBox(tr("Mostrar rótulos PREVIEW / PROGRAM"));
    showLabels->setObjectName("ui_show_labels");
    showLabels->setChecked(true);
    groupLayout->addRow(showLabels);

    QCheckBox* alwaysOnTop = new QCheckBox(tr("Manter janela sempre no topo"));
    alwaysOnTop->setObjectName("ui_always_on_top");
    groupLayout->addRow(alwaysOnTop);

    layout->addWidget(group);

    auto* layoutGroup = new QGroupBox(tr("Layout da Mesa"));
    auto* layoutGroupLayout = new QFormLayout(layoutGroup);
    layoutGroupLayout->setSpacing(10);

    QSpinBox* previewWidth = new QSpinBox();
    previewWidth->setRange(320, 3840);
    previewWidth->setSuffix(" px");
    previewWidth->setValue(960);
    previewWidth->setObjectName("layout_preview_width");
    layoutGroupLayout->addRow(tr("Largura do Preview:"), previewWidth);

    QSpinBox* mixerWidth = new QSpinBox();
    mixerWidth->setRange(170, 800);
    mixerWidth->setSuffix(" px");
    mixerWidth->setValue(280);
    mixerWidth->setObjectName("layout_mixer_width");
    layoutGroupLayout->addRow(tr("Largura do Mixer:"), mixerWidth);

    QCheckBox* twoRows = new QCheckBox(tr("Duas fileiras de entradas na resolução de referência"));
    twoRows->setObjectName("layout_two_rows");
    twoRows->setChecked(true);
    layoutGroupLayout->addRow(twoRows);

    layout->addWidget(layoutGroup);
    layout->addStretch();

    createPage(tr("Interface e Layout"), page);
}

void GeneralSettingsDialog::createShortcutsPage()
{
    QWidget* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(16);

    auto* group = new QGroupBox(tr("Atalhos Principais"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(10);

    struct ShortcutDef { QString name; QString key; QString objName; };
    QList<ShortcutDef> shortcuts = {
        {tr("Cortar (Cut)"), "Ctrl+Shift+X", "hk_cut"},
        {tr("Quick Play (Transição)"), "Space", "hk_quick"},
        {tr("FTB (Fade to Black)"), "Ctrl+Shift+B", "hk_ftb"},
        {tr("Iniciar/Parar Gravação"), "Ctrl+R", "hk_record"},
        {tr("Iniciar/Parar Transmissão"), "Ctrl+T", "hk_stream"},
        {tr("Alternar Modo Operar/Editar"), "Ctrl+E", "hk_edit_mode"},
        {tr("Abrir Adicionar Entrada"), "Ctrl+I", "hk_add_input"},
        {tr("Abrir Propriedades"), "Ctrl+P", "hk_properties"},
        {tr("Mixer de Áudio"), "Ctrl+M", "hk_mixer"},
        {tr("Replay - Capturar Lance"), "Ctrl+Shift+G", "hk_replay_grab"},
        {tr("Replay - Reproduzir"), "Ctrl+Shift+P", "hk_replay_play"},
        {tr("FreeMix Call - Nova Chamada"), "Ctrl+Shift+C", "hk_call"},
    };

    for (const auto& sc : shortcuts) {
        QKeySequenceEdit* edit = new QKeySequenceEdit(QKeySequence(sc.key));
        edit->setObjectName(sc.objName);
        groupLayout->addRow(sc.name + ":", edit);
    }

    layout->addWidget(group);
    layout->addStretch();

    createPage(tr("Atalhos"), page);
}

void GeneralSettingsDialog::createComponentsPage()
{
    QWidget* page = new QWidget();
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(16, 16, 16, 16);
    layout->setSpacing(16);

    auto* group = new QGroupBox(tr("Integrações Disponíveis"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(10);

    struct CompDef { QString name; QString objName; bool available; };
    QList<CompDef> comps = {
        {tr("Source Record (MultiCorder / Gravação ISO)"), "comp_source_record", true},
        {tr("Replay Source (Repetição Instantânea)"), "comp_replay_source", true},
        {tr("Downstream Keyer (Overlays)"), "comp_dsk", true},
        {tr("VDO.Ninja (FreeMix Call)"), "comp_vdo_ninja", true},
        {tr("NDI (DistroAV)"), "comp_ndi", false},
        {tr("SRT (Haivision)"), "comp_srt", false},
        {tr("WebRTC (obs-webrtc)"), "comp_webrtc", false},
    };

    for (const auto& comp : comps) {
        QWidget* row = new QWidget();
        auto* rowLayout = new QHBoxLayout(row);
        rowLayout->setContentsMargins(0, 0, 0, 0);
        rowLayout->setSpacing(8);

        QLabel* status = new QLabel(comp.available ? "✓ Disponível" : "✗ Não instalado");
        status->setObjectName(comp.objName + "_status");
        status->setStyleSheet(comp.available ? "color: #00e676;" : "color: #ff5252;");
        status->setFixedWidth(120);

        QLabel* nameLabel = new QLabel(comp.name);
        nameLabel->setObjectName(comp.objName + "_name");

        QPushButton* configBtn = new QPushButton(tr("Configurar"));
        configBtn->setObjectName(comp.objName + "_config");
        configBtn->setEnabled(comp.available);

        rowLayout->addWidget(status);
        rowLayout->addWidget(nameLabel, 1);
        rowLayout->addWidget(configBtn);
        groupLayout->addRow(row);
    }

    layout->addWidget(group);

    auto* depsGroup = new QGroupBox(tr("Dependências do Sistema"));
    auto* depsLayout = new QFormLayout(depsGroup);
    depsLayout->setSpacing(10);

    QLabel* obsVersion = new QLabel("OBS Studio 30.x");
    obsVersion->setObjectName("dep_obs_version");
    depsLayout->addRow(tr("OBS Studio:"), obsVersion);

    QLabel* qtVersion = new QLabel("Qt 6.x");
    qtVersion->setObjectName("dep_qt_version");
    depsLayout->addRow(tr("Qt Framework:"), qtVersion);

    QLabel* pythonVersion = new QLabel("Python 3.x (opcional)");
    pythonVersion->setObjectName("dep_python_version");
    depsLayout->addRow(tr("Python:"), pythonVersion);

    layout->addWidget(depsGroup);
    layout->addStretch();

    createPage(tr("Componentes e Integrações"), page);
}

void GeneralSettingsDialog::onNavigationChanged(QListWidgetItem* current, QListWidgetItem* previous)
{
    Q_UNUSED(previous);
    if (!current) return;
    m_pages->setCurrentIndex(m_navList->row(current));
}

void GeneralSettingsDialog::onApplyClicked()
{
    collectAndEmitSettings();
}

void GeneralSettingsDialog::onOkClicked()
{
    collectAndEmitSettings();
    accept();
}

void GeneralSettingsDialog::collectAndEmitSettings()
{
    QMap<QString, QVariant> settings;
    // Collect all settings from form widgets
    emit settingsApplied(settings);
}
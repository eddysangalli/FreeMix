#include "AudioMatrixDialog.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QHeaderView>
#include <QMessageBox>

AudioMatrixDialog::AudioMatrixDialog(QWidget *parent)
    : QDialog(parent)
{
    setWindowTitle("Matriz de Áudio & Submixes Broadcast — FreeMix");
    resize(960, 520);
    setupUI();
    populateChannelsTable();
}

AudioMatrixDialog::~AudioMatrixDialog() = default;

void AudioMatrixDialog::setupUI()
{
    auto *mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(12, 12, 12, 12);
    mainLayout->setSpacing(10);

    // Cabeçalho explicativo
    auto *lblHeader = new QLabel(
        "<b>Roteamento de Áudio e Barramentos Independentes</b><br>"
        "<span style='color:#8fa0b5;font-size:11px'>"
        "M = Master (Transmissão e Gravação) | "
        "A = Aux A (Retorno de Convidado com Mix-Minus) | "
        "B = Aux B (Fones e Escuta da Direção)</span>",
        this
    );
    mainLayout->addWidget(lblHeader);

    // Tabela da Matriz
    m_table = new QTableWidget(this);
    m_table->setColumnCount(8);
    m_table->setHorizontalHeaderLabels({
        "Canal / Fonte", "Volume & Nível", "M (Master)", "A (Mix-Minus)", "B (Fones)",
        "Monitoração de Fone", "Atraso (Lipsync)", "Efeitos & Plugins"
    });
    m_table->horizontalHeader()->setSectionResizeMode(0, QHeaderView::Stretch);
    m_table->horizontalHeader()->setSectionResizeMode(1, QHeaderView::ResizeToContents);
    m_table->horizontalHeader()->setSectionResizeMode(2, QHeaderView::Fixed);
    m_table->horizontalHeader()->setSectionResizeMode(3, QHeaderView::Fixed);
    m_table->horizontalHeader()->setSectionResizeMode(4, QHeaderView::Fixed);
    m_table->horizontalHeader()->setSectionResizeMode(5, QHeaderView::ResizeToContents);
    m_table->horizontalHeader()->setSectionResizeMode(6, QHeaderView::ResizeToContents);
    m_table->horizontalHeader()->setSectionResizeMode(7, QHeaderView::ResizeToContents);
    m_table->setColumnWidth(2, 45);
    m_table->setColumnWidth(3, 45);
    m_table->setColumnWidth(4, 45);
    m_table->verticalHeader()->setVisible(false);
    m_table->setStyleSheet(
        "QTableWidget { background-color: #101620; gridline-color: #1f2b3a; border: 1px solid #1f2b3a; }"
        "QHeaderView::section { background-color: #17212e; color: #dce3ed; padding: 6px; border: 1px solid #1f2b3a; font-weight: bold; font-size: 11px; }"
    );
    mainLayout->addWidget(m_table);

    // Barra inferior de botões
    auto *botLayout = new QHBoxLayout();
    m_btnResetDelays = new QPushButton("Zerar Todos os Atrasos (0 ms)", this);
    m_btnResetDelays->setStyleSheet("background-color: #1c2736; color: #dce3ed; padding: 6px 12px; border-radius: 3px; border: 1px solid #2f435c;");
    connect(m_btnResetDelays, &QPushButton::clicked, this, &AudioMatrixDialog::onResetDelays);
    botLayout->addWidget(m_btnResetDelays);

    botLayout->addStretch();

    m_btnClose = new QPushButton("Concluir", this);
    m_btnClose->setStyleSheet("background-color: #00e676; color: #0b1118; font-weight: bold; padding: 6px 18px; border-radius: 3px;");
    connect(m_btnClose, &QPushButton::clicked, this, &QDialog::accept);
    botLayout->addWidget(m_btnClose);

    mainLayout->addLayout(botLayout);
}

void AudioMatrixDialog::populateChannelsTable()
{
    m_channels.clear();

    // Canais padrão broadcast
    m_channels.append({"Microfone Principal (Apresentador)", 0.0f, false, true, false, true, 2, 0, 0.5f});
    m_channels.append({"Microfone Convidado (Estúdio)", -1.5f, false, true, true, true, 2, 0, 0.5f});
    m_channels.append({"FreeMix Call (Convidado Remoto)", 0.0f, false, true, false, true, 1, 60, 0.5f});
    m_channels.append({"Áudio de Vídeos e VTs (Media Player)", -3.0f, false, true, true, true, 0, 0, 0.5f});
    m_channels.append({"Música de Fundo / BG", -12.0f, false, true, true, false, 0, 0, 0.5f});

    m_table->setRowCount(m_channels.size());

    for (int row = 0; row < m_channels.size(); ++row) {
        const auto &ch = m_channels[row];

        // 0. Nome do Canal
        auto *item = new QTableWidgetItem(ch.name);
        item->setFlags(Qt::ItemIsEnabled | Qt::ItemIsSelectable);
        m_table->setItem(row, 0, item);

        // 1. Volume & Mute
        auto *volWidget = new QWidget();
        auto *volLayout = new QHBoxLayout(volWidget);
        volLayout->setContentsMargins(4, 2, 4, 2);
        volLayout->setSpacing(4);

        auto *btnMute = new QPushButton(ch.muted ? "MUTED" : "LIGADO");
        btnMute->setStyleSheet(ch.muted
            ? "background-color: #d32f2f; color: white; font-weight: bold; border-radius: 2px; padding: 3px 6px; font-size: 10px;"
            : "background-color: #1e2c3d; color: #00e676; font-weight: bold; border-radius: 2px; padding: 3px 6px; font-size: 10px;");
        connect(btnMute, &QPushButton::clicked, [this, row]() { onMuteToggled(row); });
        volLayout->addWidget(btnMute);

        auto *lblDb = new QLabel(QString("%1 dB").arg(ch.volumeDb, 0, 'f', 1));
        lblDb->setStyleSheet("color: #8fa0b5; font-size: 11px;");
        volLayout->addWidget(lblDb);
        m_table->setCellWidget(row, 1, volWidget);

        // 2. Barramento Master (M)
        auto *btnM = new QPushButton("M");
        btnM->setCheckable(true);
        btnM->setChecked(ch.routeMaster);
        btnM->setStyleSheet(ch.routeMaster
            ? "background-color: #00e676; color: #0b1118; font-weight: bold; border-radius: 2px; max-width: 32px;"
            : "background-color: #1b2533; color: #52667d; border-radius: 2px; max-width: 32px;");
        connect(btnM, &QPushButton::clicked, [this, row]() { onRouteMasterToggled(row); });
        m_table->setCellWidget(row, 2, btnM);

        // 3. Barramento Aux A (Convidado / Mix-Minus)
        auto *btnA = new QPushButton("A");
        btnA->setCheckable(true);
        btnA->setChecked(ch.routeAuxA);
        btnA->setStyleSheet(ch.routeAuxA
            ? "background-color: #ff9100; color: #0b1118; font-weight: bold; border-radius: 2px; max-width: 32px;"
            : "background-color: #1b2533; color: #52667d; border-radius: 2px; max-width: 32px;");
        connect(btnA, &QPushButton::clicked, [this, row]() { onRouteAuxAToggled(row); });
        m_table->setCellWidget(row, 3, btnA);

        // 4. Barramento Aux B (Fones / Direção)
        auto *btnB = new QPushButton("B");
        btnB->setCheckable(true);
        btnB->setChecked(ch.routeAuxB);
        btnB->setStyleSheet(ch.routeAuxB
            ? "background-color: #29b6f6; color: #0b1118; font-weight: bold; border-radius: 2px; max-width: 32px;"
            : "background-color: #1b2533; color: #52667d; border-radius: 2px; max-width: 32px;");
        connect(btnB, &QPushButton::clicked, [this, row]() { onRouteAuxBToggled(row); });
        m_table->setCellWidget(row, 4, btnB);

        // 5. Monitoração
        auto *cmbMon = new QComboBox();
        cmbMon->addItems({"Desativada", "Somente Fone (Mudo no PGM)", "Fone e Transmissão (PGM)"});
        cmbMon->setCurrentIndex(ch.monitorType);
        cmbMon->setStyleSheet("background-color: #17212e; color: #dce3ed; border: 1px solid #28394e; padding: 2px; font-size: 11px;");
        connect(cmbMon, QOverload<int>::of(&QComboBox::currentIndexChanged), [this, row](int idx) { onMonitorChanged(row, idx); });
        m_table->setCellWidget(row, 5, cmbMon);

        // 6. Lipsync Delay (ms)
        auto *spnDelay = new QSpinBox();
        spnDelay->setRange(-500, 5000);
        spnDelay->setSingleStep(10);
        spnDelay->setSuffix(" ms");
        spnDelay->setValue(ch.syncOffsetMs);
        spnDelay->setStyleSheet("background-color: #17212e; color: #00e676; font-weight: bold; border: 1px solid #28394e; font-size: 11px;");
        connect(spnDelay, QOverload<int>::of(&QSpinBox::valueChanged), [this, row](int v) { onSyncOffsetChanged(row, v); });
        m_table->setCellWidget(row, 6, spnDelay);

        // 7. Filtros e Plugins
        auto *btnPlug = new QPushButton("⚙ Filtros / VST");
        btnPlug->setStyleSheet("background-color: #1e2c3d; color: #dce3ed; border: 1px solid #334861; border-radius: 3px; font-size: 11px; padding: 3px 8px;");
        connect(btnPlug, &QPushButton::clicked, [this, row]() { onOpenPluginsClicked(row); });
        m_table->setCellWidget(row, 7, btnPlug);
    }
}

void AudioMatrixDialog::onMuteToggled(int row)
{
    if (row < 0 || row >= m_channels.size()) return;
    m_channels[row].muted = !m_channels[row].muted;
    populateChannelsTable();
}

void AudioMatrixDialog::onRouteMasterToggled(int row)
{
    if (row < 0 || row >= m_channels.size()) return;
    m_channels[row].routeMaster = !m_channels[row].routeMaster;
    populateChannelsTable();
}

void AudioMatrixDialog::onRouteAuxAToggled(int row)
{
    if (row < 0 || row >= m_channels.size()) return;
    m_channels[row].routeAuxA = !m_channels[row].routeAuxA;
    populateChannelsTable();
}

void AudioMatrixDialog::onRouteAuxBToggled(int row)
{
    if (row < 0 || row >= m_channels.size()) return;
    m_channels[row].routeAuxB = !m_channels[row].routeAuxB;
    populateChannelsTable();
}

void AudioMatrixDialog::onMonitorChanged(int row, int index)
{
    if (row < 0 || row >= m_channels.size()) return;
    m_channels[row].monitorType = index;
}

void AudioMatrixDialog::onSyncOffsetChanged(int row, int value)
{
    if (row < 0 || row >= m_channels.size()) return;
    m_channels[row].syncOffsetMs = value;
}

void AudioMatrixDialog::onOpenPluginsClicked(int row)
{
    if (row < 0 || row >= m_channels.size()) return;
    QMessageBox::information(this, "Filtros & Processadores de Áudio",
        QString("Gerenciamento de plugins para: %1\n\n"
                "- Compressor dinâmico broadcast\n"
                "- Limiter (-1.0 dBFS True Peak)\n"
                "- Redutor de Ruído AI\n"
                "- Plugins VST 2.x").arg(m_channels[row].name));
}

void AudioMatrixDialog::onResetDelays()
{
    for (auto &ch : m_channels) ch.syncOffsetMs = 0;
    populateChannelsTable();
}

void AudioMatrixDialog::refreshChannels()
{
    populateChannelsTable();
}

#include "OutputsDialog.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QHeaderView>
#include <QScreen>
#include <QGuiApplication>
#include <QMessageBox>
#include <obs-frontend-api.h>

OutputsDialog::OutputsDialog(QWidget* parent)
    : QDialog(parent)
{
    setWindowTitle(tr("Central de Saídas (Outputs & Routing) - FreeMix"));
    resize(860, 480);
    populateDefaultOutputs();
    setupUi();
    refreshOutputsTable();
}

OutputsDialog::~OutputsDialog()
{
}

void OutputsDialog::populateDefaultOutputs()
{
    m_outputs.clear();
    m_outputs.append({ "out-1", tr("Saída 1 (Telão / Monitor)"), "projector", "PROGRAM", "-1", "1920x1080", "stopped", nullptr });
    m_outputs.append({ "out-2", tr("Saída 2 (Retorno Palco / AUX)"), "projector", "PREVIEW", "-1", "1920x1080", "stopped", nullptr });
    m_outputs.append({ "out-clean", tr("Clean Feed (Sem DSK/GC)"), "projector", "CLEANFEED", "-1", "1920x1080", "stopped", nullptr });
    m_outputs.append({ "out-vcam", tr("Câmera Virtual (External 1)"), "vcam", "PROGRAM", tr("OBS Virtual Camera"), "1920x1080", "stopped", nullptr });
    m_outputs.append({ "out-stream", tr("Transmissão Principal (Stream)"), "stream", "PROGRAM", tr("RTMP/SRT Primário"), "1920x1080", "stopped", nullptr });
    m_outputs.append({ "out-decklink", tr("DeckLink / SDI 1"), "decklink", "PROGRAM", tr("Blackmagic SDI Out"), "1080p59.94", "unavailable", nullptr });
    m_outputs.append({ "out-ndi", tr("NDI Broadcaster"), "ndi", "PROGRAM", tr("Rede NDI (DistroAV)"), "1920x1080", "stopped", nullptr });
    m_outputs.append({ "out-omt", tr("OMT (Open Media Transport)"), "omt", "CLEANFEED", tr("Rede OMT Broadcast"), "1920x1080", "stopped", nullptr });
}

void OutputsDialog::setupUi()
{
    auto* mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(12, 12, 12, 12);
    mainLayout->setSpacing(10);

    // Header buttons
    auto* topLayout = new QHBoxLayout();
    m_btnStartAll = new QPushButton(tr("Ligar Todas"), this);
    m_btnStopAll = new QPushButton(tr("Parar Todas"), this);
    topLayout->addWidget(m_btnStartAll);
    topLayout->addWidget(m_btnStopAll);
    topLayout->addStretch();
    mainLayout->addLayout(topLayout);

    // Table
    m_table = new QTableWidget(this);
    m_table->setColumnCount(6);
    m_table->setHorizontalHeaderLabels({
        tr("Nome / Tipo"),
        tr("Origem"),
        tr("Destino"),
        tr("Resolução"),
        tr("Estado"),
        tr("Ação")
    });
    m_table->horizontalHeader()->setSectionResizeMode(0, QHeaderView::Stretch);
    m_table->horizontalHeader()->setSectionResizeMode(1, QHeaderView::ResizeToContents);
    m_table->horizontalHeader()->setSectionResizeMode(2, QHeaderView::ResizeToContents);
    m_table->horizontalHeader()->setSectionResizeMode(3, QHeaderView::ResizeToContents);
    m_table->horizontalHeader()->setSectionResizeMode(4, QHeaderView::ResizeToContents);
    m_table->horizontalHeader()->setSectionResizeMode(5, QHeaderView::ResizeToContents);
    m_table->setSelectionBehavior(QAbstractItemView::SelectRows);
    m_table->setAlternatingRowColors(true);
    mainLayout->addWidget(m_table, 1);

    // Diagnostic box
    m_diagLabel = new QLabel(this);
    m_diagLabel->setStyleSheet("padding: 6px; background-color: #1a222c; border: 1px solid #2d3848; border-radius: 3px; font-size: 11px;");
    mainLayout->addWidget(m_diagLabel);

    // Bottom close button
    auto* bottomLayout = new QHBoxLayout();
    bottomLayout->addStretch();
    auto* btnClose = new QPushButton(tr("Fechar"), this);
    bottomLayout->addWidget(btnClose);
    mainLayout->addLayout(bottomLayout);

    connect(m_btnStartAll, &QPushButton::clicked, this, &OutputsDialog::onStartAll);
    connect(m_btnStopAll, &QPushButton::clicked, this, &OutputsDialog::onStopAll);
    connect(btnClose, &QPushButton::clicked, this, &QDialog::accept);

    refreshMonitors();
}

void OutputsDialog::refreshMonitors()
{
    const auto screens = QGuiApplication::screens();
    m_diagLabel->setText(tr("<b>Diagnóstico:</b> %1 monitor(es) detectado(s) pelo sistema operacional. Gerenciamento ativo de janelas.").arg(screens.size()));
}

void OutputsDialog::refreshOutputsTable()
{
    m_table->setRowCount(m_outputs.size());

    const auto screens = QGuiApplication::screens();

    for (int i = 0; i < m_outputs.size(); ++i) {
        const auto& item = m_outputs[i];

        // Column 0: Nome
        auto* nameItem = new QTableWidgetItem(QString("%1\n(%2)").arg(item.name, item.type.toUpper()));
        nameItem->setFlags(Qt::ItemIsEnabled | Qt::ItemIsSelectable);
        m_table->setItem(i, 0, nameItem);

        // Column 1: Origem (ComboBox)
        auto* srcCombo = new QComboBox(m_table);
        srcCombo->addItem("PROGRAM", "PROGRAM");
        srcCombo->addItem("PREVIEW", "PREVIEW");
        srcCombo->addItem("CLEANFEED", "CLEANFEED");
        srcCombo->addItem("MULTIVIEW", "MULTIVIEW");
        srcCombo->setCurrentText(item.source);
        connect(srcCombo, QOverload<int>::of(&QComboBox::currentIndexChanged), this, [this, i](int idx) {
            onSourceChanged(i, idx);
        });
        m_table->setCellWidget(i, 1, srcCombo);

        // Column 2: Destino (ComboBox ou Label)
        if (item.type == "projector") {
            auto* destCombo = new QComboBox(m_table);
            destCombo->addItem(tr("Janela Flutuante"), "-1");
            for (int s = 0; s < screens.size(); ++s) {
                const auto geom = screens[s]->geometry();
                destCombo->addItem(tr("Monitor %1 (%2x%3)").arg(s + 1).arg(geom.width()).arg(geom.height()), QString::number(s));
            }
            int curIdx = destCombo->findData(item.dest);
            if (curIdx >= 0) destCombo->setCurrentIndex(curIdx);
            connect(destCombo, QOverload<int>::of(&QComboBox::currentIndexChanged), this, [this, i](int idx) {
                onDestChanged(i, idx);
            });
            m_table->setCellWidget(i, 2, destCombo);
        } else {
            auto* destItem = new QTableWidgetItem(item.dest);
            destItem->setFlags(Qt::ItemIsEnabled | Qt::ItemIsSelectable);
            m_table->setItem(i, 2, destItem);
        }

        // Column 3: Resolução
        auto* resItem = new QTableWidgetItem(item.res);
        resItem->setFlags(Qt::ItemIsEnabled | Qt::ItemIsSelectable);
        m_table->setItem(i, 3, resItem);

        // Column 4: Estado
        QString stateStr = tr("Parada");
        if (item.state == "active") stateStr = tr("● No Ar");
        else if (item.state == "unavailable") stateStr = tr("Indisponível");
        auto* stateItem = new QTableWidgetItem(stateStr);
        stateItem->setFlags(Qt::ItemIsEnabled | Qt::ItemIsSelectable);
        m_table->setItem(i, 4, stateItem);

        // Column 5: Ação
        auto* btnAction = new QPushButton(item.state == "active" ? tr("Parar") : tr("Iniciar"), m_table);
        if (item.state == "unavailable") {
            btnAction->setEnabled(false);
            btnAction->setToolTip(tr("Hardware ou plugin não detectado"));
        } else {
            connect(btnAction, &QPushButton::clicked, this, [this, i]() {
                onToggleOutput(i);
            });
        }
        m_table->setCellWidget(i, 5, btnAction);
    }
}

void OutputsDialog::onToggleOutput(int row)
{
    if (row < 0 || row >= m_outputs.size()) return;
    auto& item = m_outputs[row];

    if (item.state == "active") {
        item.state = "stopped";
        emit outputToggled(item.id, false);
    } else {
        item.state = "active";
        emit outputToggled(item.id, true);
    }
    refreshOutputsTable();
}

void OutputsDialog::onConfigureOutput(int row)
{
    // Abrir opções adicionais de áudio e alpha
}

void OutputsDialog::onSourceChanged(int row, int index)
{
    if (row < 0 || row >= m_outputs.size()) return;
    auto* combo = qobject_cast<QComboBox*>(m_table->cellWidget(row, 1));
    if (combo) {
        m_outputs[row].source = combo->currentData().toString();
        emit outputSourceChanged(m_outputs[row].id, m_outputs[row].source);
    }
}

void OutputsDialog::onDestChanged(int row, int index)
{
    if (row < 0 || row >= m_outputs.size()) return;
    auto* combo = qobject_cast<QComboBox*>(m_table->cellWidget(row, 2));
    if (combo) {
        m_outputs[row].dest = combo->currentData().toString();
    }
}

void OutputsDialog::onStartAll()
{
    for (auto& o : m_outputs) {
        if (o.state != "unavailable") {
            o.state = "active";
            emit outputToggled(o.id, true);
        }
    }
    refreshOutputsTable();
}

void OutputsDialog::onStopAll()
{
    for (auto& o : m_outputs) {
        if (o.state == "active") {
            o.state = "stopped";
            emit outputToggled(o.id, false);
        }
    }
    refreshOutputsTable();
}

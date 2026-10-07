#include "GraphicsStudioDialog.h"
#include "../../services/GraphicsManager.h"

#include <QFileDialog>
#include <QMessageBox>
#include <QGroupBox>
#include <QSplitter>

GraphicsStudioDialog::GraphicsStudioDialog(freemix::GraphicsManager *manager, QWidget *parent)
    : QDialog(parent), m_manager(manager)
{
    setWindowTitle("Central de Gráficos & GCs (Broadcast CG Studio) — FreeMix");
    resize(1120, 620);
    setupUI();
    populateGallery();
}

GraphicsStudioDialog::~GraphicsStudioDialog() = default;

void GraphicsStudioDialog::setupUI()
{
    auto *mainLayout = new QHBoxLayout(this);
    mainLayout->setContentsMargins(10, 10, 10, 10);
    mainLayout->setSpacing(10);

    // 1. Coluna Esquerda: Galeria de Templates
    auto *galleryBox = new QGroupBox("Galeria de Gráficos", this);
    galleryBox->setFixedWidth(280);
    auto *galleryLayout = new QVBoxLayout(galleryBox);

    auto *tabs = new QTabWidget(galleryBox);
    auto *tabAll = new QWidget();
    tabs->addTab(tabAll, "Todas");
    connect(tabs, &QTabWidget::currentChanged, [this, tabs](int idx) {
        QString col = (idx == 0) ? "" : tabs->tabText(idx);
        populateGallery(col);
    });

    m_galleryList = new QListWidget(galleryBox);
    m_galleryList->setStyleSheet("QListWidget { background-color: #101622; border: 1px solid #1f2a3a; font-size: 11px; } QListWidget::item { padding: 8px; border-bottom: 1px solid #1a222e; } QListWidget::item:selected { background-color: #0078d4; color: white; }");
    connect(m_galleryList, &QListWidget::itemClicked, this, &GraphicsStudioDialog::onTemplateSelected);
    galleryLayout->addWidget(m_galleryList);
    mainLayout->addWidget(galleryBox);

    // 2. Coluna Central: Edição de Conteúdo & Fonte de Dados
    auto *editBox = new QGroupBox("Conteúdo & Vínculo com Dados", this);
    auto *editLayout = new QVBoxLayout(editBox);

    m_btnLoadCSV = new QPushButton("📂 Importar Planilha CSV / Dados...", editBox);
    m_btnLoadCSV->setStyleSheet("background-color: #1a2636; color: #00e676; font-weight: bold; border: 1px solid #00e676; padding: 6px 12px; border-radius: 3px;");
    connect(m_btnLoadCSV, &QPushButton::clicked, this, &GraphicsStudioDialog::onLoadCSVClicked);
    editLayout->addWidget(m_btnLoadCSV);

    m_formContainer = new QWidget(editBox);
    m_formLayout = new QFormLayout(m_formContainer);
    m_formLayout->setContentsMargins(0, 10, 0, 10);
    m_formLayout->setSpacing(8);
    editLayout->addWidget(m_formContainer);
    editLayout->addStretch();
    mainLayout->addWidget(editBox, 1);

    // 3. Coluna Direita: Prévia e Operação no Ar
    auto *opsBox = new QGroupBox("Operação no Ar (On-Air)", this);
    opsBox->setFixedWidth(320);
    auto *opsLayout = new QVBoxLayout(opsBox);

    m_lblLayerStatus = new QLabel("CAMADA 3 · FORA DO AR", opsBox);
    m_lblLayerStatus->setAlignment(Qt::AlignCenter);
    m_lblLayerStatus->setStyleSheet("background-color: #121820; color: #8fa0b5; font-weight: bold; padding: 6px; border: 1px solid #202b3a; border-radius: 3px;");
    opsLayout->addWidget(m_lblLayerStatus);

    m_lblPreview = new QLabel("Selecione um gráfico na galeria.", opsBox);
    m_lblPreview->setAlignment(Qt::AlignCenter);
    m_lblPreview->setMinimumHeight(120);
    m_lblPreview->setStyleSheet("background-color: #080c12; color: #8fa0b5; border: 1px dashed #202b3a; border-radius: 4px; padding: 10px;");
    opsLayout->addWidget(m_lblPreview);

    opsLayout->addSpacing(12);

    // Botões táteis de transmissão
    m_btnPrepare = new QPushButton("PREPARAR (PREVIEW)", opsBox);
    m_btnPrepare->setStyleSheet("background-color: #1b2738; color: #dce3ed; font-weight: bold; height: 34px; border: 1px solid #2e435f; border-radius: 3px;");
    connect(m_btnPrepare, &QPushButton::clicked, this, &GraphicsStudioDialog::onPrepareClicked);
    opsLayout->addWidget(m_btnPrepare);

    m_btnTakeIn = new QPushButton("● COLOCAR NO AR (IN)", opsBox);
    m_btnTakeIn->setStyleSheet("background-color: #00c853; color: #0b1118; font-weight: 800; height: 42px; font-size: 13px; border-radius: 3px;");
    connect(m_btnTakeIn, &QPushButton::clicked, this, &GraphicsStudioDialog::onTakeInClicked);
    opsLayout->addWidget(m_btnTakeIn);

    m_btnUpdate = new QPushButton("ATUALIZAR DADOS NO AR", opsBox);
    m_btnUpdate->setStyleSheet("background-color: #1a2533; color: #00e676; font-weight: bold; height: 32px; border: 1px solid #00e676; border-radius: 3px;");
    connect(m_btnUpdate, &QPushButton::clicked, this, &GraphicsStudioDialog::onUpdateClicked);
    opsLayout->addWidget(m_btnUpdate);

    m_btnTakeOut = new QPushButton("RETIRAR (OUT)", opsBox);
    m_btnTakeOut->setStyleSheet("background-color: #2b171c; color: #ff5252; font-weight: bold; height: 34px; border: 1px solid #6b212c; border-radius: 3px;");
    connect(m_btnTakeOut, &QPushButton::clicked, this, &GraphicsStudioDialog::onTakeOutClicked);
    opsLayout->addWidget(m_btnTakeOut);

    opsLayout->addStretch();

    m_btnClearAll = new QPushButton("RETIRAR TODOS OS GCs", opsBox);
    m_btnClearAll->setStyleSheet("background-color: #4a0d14; color: #ffffff; font-weight: bold; height: 32px; border-radius: 3px;");
    connect(m_btnClearAll, &QPushButton::clicked, this, &GraphicsStudioDialog::onClearAllClicked);
    opsLayout->addWidget(m_btnClearAll);

    mainLayout->addWidget(opsBox);
}

void GraphicsStudioDialog::populateGallery(const QString &filterCollection)
{
    m_galleryList->clear();
    if (!m_manager) return;

    for (const auto &t : m_manager->templates()) {
        if (!filterCollection.isEmpty() && t.collection != filterCollection) continue;

        auto *item = new QListWidgetItem(QString("%1\n[%2 · Camada %3]").arg(t.name).arg(t.collection).arg(t.layer));
        item->setData(Qt::UserRole, t.id);
        m_galleryList->addItem(item);
    }

    if (m_galleryList->count() > 0) {
        m_galleryList->setCurrentRow(0);
        onTemplateSelected(m_galleryList->item(0));
    }
}

void GraphicsStudioDialog::onTemplateSelected(QListWidgetItem *item)
{
    if (!item) return;
    QString id = item->data(Qt::UserRole).toString();
    m_selectedTemplateId = id;
    buildFormForTemplate(id);
}

void GraphicsStudioDialog::buildFormForTemplate(const QString &templateId)
{
    // Limpa formulário anterior
    QLayoutItem *child;
    while ((child = m_formLayout->takeAt(0)) != nullptr) {
        delete child->widget();
        delete child;
    }
    m_fieldInputs.clear();

    const auto *t = m_manager ? m_manager->findTemplate(templateId) : nullptr;
    if (!t) return;

    m_lblPreview->setText(QString("<b>%1</b><br><span style='font-size:10px;color:#8fa0b5'>%2</span>").arg(t->name).arg(t->htmlPath));
    m_lblLayerStatus->setText(QString("CAMADA %1 · %2").arg(t->layer).arg(m_manager->isLayerOnAir(t->layer) ? "● NO AR" : "FORA DO AR"));
    m_lblLayerStatus->setStyleSheet(m_manager->isLayerOnAir(t->layer)
        ? "background-color: #10331e; color: #00e676; font-weight: bold; padding: 6px; border: 1px solid #00e676; border-radius: 3px;"
        : "background-color: #121820; color: #8fa0b5; font-weight: bold; padding: 6px; border: 1px solid #202b3a; border-radius: 3px;");

    for (const auto &f : t->fields) {
        auto *input = new QLineEdit(f.defaultValue, m_formContainer);
        input->setStyleSheet("background-color: #141c26; color: #ffffff; border: 1px solid #223142; padding: 6px; border-radius: 3px;");
        m_formLayout->addRow(f.label + ":", input);
        m_fieldInputs[f.key] = input;
    }
}

void GraphicsStudioDialog::onPrepareClicked()
{
    if (m_selectedTemplateId.isEmpty() || !m_manager) return;
    const auto *t = m_manager->findTemplate(m_selectedTemplateId);
    if (!t) return;

    QMap<QString, QString> data;
    for (auto it = m_fieldInputs.begin(); it != m_fieldInputs.end(); ++it) {
        data[it.key()] = it.value()->text();
    }

    m_manager->prepare(t->layer, t->id, data);
    m_lblPreview->setStyleSheet("background-color: #0b1522; color: #00e676; border: 2px solid #0078d4; border-radius: 4px; padding: 10px;");
}

void GraphicsStudioDialog::onTakeInClicked()
{
    if (m_selectedTemplateId.isEmpty() || !m_manager) return;
    const auto *t = m_manager->findTemplate(m_selectedTemplateId);
    if (!t) return;

    onPrepareClicked();
    m_manager->takeIn(t->layer);

    m_lblLayerStatus->setText(QString("CAMADA %1 · ● NO AR").arg(t->layer));
    m_lblLayerStatus->setStyleSheet("background-color: #10331e; color: #00e676; font-weight: bold; padding: 6px; border: 1px solid #00e676; border-radius: 3px;");
}

void GraphicsStudioDialog::onUpdateClicked()
{
    if (m_selectedTemplateId.isEmpty() || !m_manager) return;
    const auto *t = m_manager->findTemplate(m_selectedTemplateId);
    if (!t) return;

    QMap<QString, QString> data;
    for (auto it = m_fieldInputs.begin(); it != m_fieldInputs.end(); ++it) {
        data[it.key()] = it.value()->text();
    }
    m_manager->updateLive(t->layer, data);
}

void GraphicsStudioDialog::onTakeOutClicked()
{
    if (m_selectedTemplateId.isEmpty() || !m_manager) return;
    const auto *t = m_manager->findTemplate(m_selectedTemplateId);
    if (!t) return;

    m_manager->takeOut(t->layer);
    m_lblLayerStatus->setText(QString("CAMADA %1 · FORA DO AR").arg(t->layer));
    m_lblLayerStatus->setStyleSheet("background-color: #121820; color: #8fa0b5; font-weight: bold; padding: 6px; border: 1px solid #202b3a; border-radius: 3px;");
}

void GraphicsStudioDialog::onClearAllClicked()
{
    if (!m_manager) return;
    m_manager->clearAll();
    m_lblLayerStatus->setText("TODAS AS CAMADAS FORA DO AR");
    m_lblLayerStatus->setStyleSheet("background-color: #121820; color: #8fa0b5; font-weight: bold; padding: 6px; border: 1px solid #202b3a; border-radius: 3px;");
}

void GraphicsStudioDialog::onLoadCSVClicked()
{
    QString path = QFileDialog::getOpenFileName(this, "Selecionar Planilha CSV", "", "Arquivos CSV (*.csv)");
    if (path.isEmpty() || !m_manager) return;

    QVector<QString> cols;
    QVector<freemix::DataSourceRecord> recs;
    if (m_manager->loadCSV(path, cols, recs)) {
        if (!recs.isEmpty()) {
            // Preenche os campos do formulário automaticamente com o primeiro registro
            const auto &r = recs[0];
            for (auto it = m_fieldInputs.begin(); it != m_fieldInputs.end(); ++it) {
                if (r.values.contains(it.key())) {
                    it.value()->setText(r.values[it.key()]);
                }
            }
            QMessageBox::information(this, "Planilha Conectada",
                QString("Carregados %1 registros da planilha.\nCampos preenchidos com sucesso!").arg(recs.size()));
        }
    }
}

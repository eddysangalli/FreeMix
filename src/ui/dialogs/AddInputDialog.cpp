#include "AddInputDialog.h"

#include <QListWidget>
#include <QStackedWidget>
#include <QPushButton>
#include <QLineEdit>
#include <QSpinBox>
#include <QComboBox>
#include <QFormLayout>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QLabel>
#include <QMessageBox>
#include <QApplication>

AddInputDialog::AddInputDialog(FreeMixPlugin* plugin, QWidget* parent)
    : QDialog(parent), m_plugin(plugin)
{
    setWindowTitle(tr("Adicionar Entrada"));
    setMinimumSize(700, 450);
    setModal(true);
    setupTypes();
    setupUI();
}

AddInputDialog::~AddInputDialog()
{
}

void AddInputDialog::setupTypes()
{
    m_types["camera"] = {"camera", tr("Câmera / Captura"), "dshow_input",
                         tr("Câmera, placa de captura ou webcam. Ao criar, abre a janela do OBS para escolher dispositivo, resolução e taxa de quadros."), {}};
    m_types["video"] = {"video", tr("Vídeo"), "ffmpeg_source",
                        tr("Arquivo de vídeo. Ao criar, abre a janela do OBS para escolher o arquivo."), {}};
    m_types["audio"] = {"audio", tr("Áudio"), "ffmpeg_source",
                        tr("Arquivo de áudio (trilha, vinheta)."), {}};
    m_types["image"] = {"image", tr("Imagem"), "image_source",
                        tr("Imagem parada (PNG, JPG...)."), {}};
    m_types["photos"] = {"photos", tr("Fotos (Apresentação)"), "slideshow",
                         tr("Sequência de imagens."), {}};
    m_types["colour"] = {"colour", tr("Cor Sólida"), "color_source",
                         tr("Fundo de cor sólida."), {{"color", QVariant("#000000")}}};
    m_types["browser"] = {"web", tr("Navegador / HTML"), "browser_source",
                          tr("Página web ou HTML local: placar, GC. Para convidado remoto use FreeMix Call."),
                          {{"url", QVariant("https://")}}};
    m_types["call"] = {"call", tr("FreeMix Call"), "browser_source",
                       tr("Convidado remoto pela internet (FreeMix Call): o convidado abre um link no celular ou PC e entra com vídeo e áudio direto no mixer."),
                       {{"callid", QVariant("")}}};
    m_types["replay"] = {"replay", tr("Replay Instantâneo"), "replay_source",
                         tr("Abre a janela Replay para criar um ângulo a partir de uma câmera."), {}, true};
    m_types["stream"] = {"stream", tr("Stream / SRT / RTMP"), "ffmpeg_source",
                         tr("Recebe um fluxo de rede (rtmp://, srt://, rtsp://, http://)."), {{"url", QVariant("")}}};
    m_types["ndi"] = {"ndi", tr("NDI"), "ndi_source",
                      tr("Fonte NDI da rede (precisa do plugin DistroAV e do NDI Runtime)."), {}};
    m_types["desktop"] = {"desktop", tr("Captura de Monitor"), "monitor_capture",
                          tr("Captura de um monitor."), {}};
    m_types["window"] = {"window", tr("Captura de Janela"), "window_capture",
                         tr("Captura de uma janela específica."), {}};
    m_types["audioin"] = {"audioin", tr("Entrada de Áudio"), "wasapi_input_capture",
                          tr("Microfone ou entrada da placa de som."), {}};
    m_types["title"] = {"title", tr("Título (Texto Simples)"), "text_gdiplus",
                        tr("Texto simples. Para GC completo use Navegador."), {{"text", QVariant("TÍTULO")}}};
    m_types["blank"] = {"blank", tr("Entrada Vazia"), "",
                        tr("Entrada vazia, para montar com várias fontes em Painéis › Fontes."), {}, false};
}

void AddInputDialog::setupUI()
{
    auto* mainLayout = new QHBoxLayout(this);
    mainLayout->setSpacing(0);
    mainLayout->setContentsMargins(0, 0, 0, 0);

    m_typeList = new QListWidget();
    m_typeList->setFixedWidth(175);
    m_typeList->setObjectName("AddInput_TypeList");
    for (auto it = m_types.constBegin(); it != m_types.constEnd(); ++it) {
        const InputTypeInfo& info = it.value();
        QListWidgetItem* item = new QListWidgetItem(info.label);
        item->setData(Qt::UserRole, info.id);
        item->setToolTip(info.hint);
        m_typeList->addItem(item);
    }
    m_typeList->setCurrentRow(0);
    connect(m_typeList, &QListWidget::currentItemChanged, this, &AddInputDialog::onTypeSelected);
    mainLayout->addWidget(m_typeList);

    auto* rightWidget = new QWidget();
    rightWidget->setObjectName("AddInput_FormArea");
    auto* rightLayout = new QVBoxLayout(rightWidget);
    rightLayout->setContentsMargins(10, 10, 10, 10);
    rightLayout->setSpacing(8);

    QLabel* titleLabel = new QLabel();
    titleLabel->setObjectName("AddInput_TypeTitle");
    titleLabel->setWordWrap(true);
    rightLayout->addWidget(titleLabel);

    m_formStack = new QStackedWidget();
    m_formStack->setObjectName("AddInput_FormStack");
    rightLayout->addWidget(m_formStack, 1);

    auto* nameLayout = new QFormLayout();
    m_nameEdit = new QLineEdit();
    m_nameEdit->setPlaceholderText(tr("Nome da entrada"));
    nameLayout->addRow(tr("&Nome:"), m_nameEdit);

    m_countSpin = new QSpinBox();
    m_countSpin->setRange(1, 8);
    m_countSpin->setValue(1);
    nameLayout->addRow(tr("&Quantidade:"), m_countSpin);
    rightLayout->addLayout(nameLayout);

    auto* buttonLayout = new QHBoxLayout();
    buttonLayout->addStretch();
    m_cancelButton = new QPushButton(tr("Cancelar"));
    m_okButton = new QPushButton(tr("Adicionar"));
    m_okButton->setDefault(true);
    m_okButton->setObjectName("AddInput_OkButton");
    buttonLayout->addWidget(m_cancelButton);
    buttonLayout->addWidget(m_okButton);
    rightLayout->addLayout(buttonLayout);

    mainLayout->addWidget(rightWidget, 1);

    connect(m_okButton, &QPushButton::clicked, this, &AddInputDialog::onOkClicked);
    connect(m_cancelButton, &QPushButton::clicked, this, &QDialog::reject);
    connect(m_nameEdit, &QLineEdit::textChanged, this, &AddInputDialog::updateOkButtonState);

    onTypeSelected(m_typeList->currentItem(), nullptr);
    updateOkButtonState();
}

void AddInputDialog::createFormForType(const QString& typeId)
{
    if (m_formWidgets.contains(typeId)) {
        m_formStack->setCurrentWidget(m_formWidgets[typeId]);
        return;
    }

    const InputTypeInfo& info = m_types[typeId];
    QWidget* formWidget = new QWidget();
    auto* formLayout = new QFormLayout(formWidget);
    formLayout->setContentsMargins(0, 0, 0, 0);
    formLayout->setSpacing(8);

    for (auto it = info.fields.constBegin(); it != info.fields.constEnd(); ++it) {
        const QString& fieldName = it.key();
        const QVariant& defaultValue = it.value();

        QWidget* fieldWidget = nullptr;
        if (fieldName == "color") {
            QLineEdit* colorEdit = new QLineEdit(defaultValue.toString());
            colorEdit->setPlaceholderText("#RRGGBB");
            colorEdit->setObjectName("AddInput_Field_" + fieldName);
            fieldWidget = colorEdit;
        } else if (fieldName == "callid") {
            QLineEdit* idEdit = new QLineEdit(defaultValue.toString());
            idEdit->setPlaceholderText(tr("ID da chamada (letras e números)"));
            idEdit->setObjectName("AddInput_Field_" + fieldName);
            fieldWidget = idEdit;
        } else {
            QLineEdit* edit = new QLineEdit(defaultValue.toString());
            edit->setPlaceholderText(fieldName);
            edit->setObjectName("AddInput_Field_" + fieldName);
            fieldWidget = edit;
        }
        formLayout->addRow(fieldName + ":", fieldWidget);
    }

    if (info.fields.isEmpty()) {
        QLabel* label = new QLabel(tr("Nenhuma configuração adicional necessária para este tipo."));
        label->setWordWrap(true);
        label->setStyleSheet("color: #96a1b0; font-style: italic;");
        formLayout->addRow(label);
    }

    m_formStack->addWidget(formWidget);
    m_formWidgets[typeId] = formWidget;
    m_formStack->setCurrentWidget(formWidget);
}

void AddInputDialog::onTypeSelected(QListWidgetItem* current, QListWidgetItem* previous)
{
    Q_UNUSED(previous);
    if (!current) return;

    QString typeId = current->data(Qt::UserRole).toString();
    const InputTypeInfo& info = m_types[typeId];

    QLabel* titleLabel = findChild<QLabel*>("AddInput_TypeTitle");
    if (titleLabel) {
        titleLabel->setText(QString("<b>%1</b><br><small>%2</small>").arg(info.label, info.hint));
    }

    createFormForType(typeId);

    if (info.id == "call") {
        QWidget* form = m_formWidgets[typeId];
        QLineEdit* idEdit = form->findChild<QLineEdit*>("AddInput_Field_callid");
        if (idEdit && idEdit->text().isEmpty()) {
            idEdit->setText("fm" + QString::number(QRandomGenerator::global()->generate(), 36).right(8));
        }
    }
}

void AddInputDialog::onOkClicked()
{
    QString name = m_nameEdit->text().trimmed();
    if (name.isEmpty()) {
        QMessageBox::warning(this, tr("Nome obrigatório"), tr("Dê um nome para a entrada."));
        m_nameEdit->setFocus();
        return;
    }

    QListWidgetItem* current = m_typeList->currentItem();
    if (!current) return;

    QString typeId = current->data(Qt::UserRole).toString();
    const InputTypeInfo& info = m_types[typeId];

    if (info.special && typeId == "replay") {
        accept();
        emit inputCreated(name, typeId, m_countSpin->value(), getFieldValues());
        return;
    }

    if (info.kind.isEmpty()) {
        accept();
        emit inputCreated(name, typeId, m_countSpin->value(), getFieldValues());
        return;
    }

    accept();
    emit inputCreated(name, typeId, m_countSpin->value(), getFieldValues());
}

QMap<QString, QVariant> AddInputDialog::getFieldValues() const
{
    QMap<QString, QVariant> values;
    QListWidgetItem* current = m_typeList->currentItem();
    if (!current) return values;

    QString typeId = current->data(Qt::UserRole).toString();
    if (!m_formWidgets.contains(typeId)) return values;

    QWidget* form = m_formWidgets[typeId];
    for (auto it = m_types[typeId].fields.constBegin(); it != m_types[typeId].fields.constEnd(); ++it) {
        const QString& fieldName = it.key();
        QLineEdit* edit = form->findChild<QLineEdit*>("AddInput_Field_" + fieldName);
        if (edit) {
            values[fieldName] = edit->text();
        }
    }
    return values;
}

QString AddInputDialog::getInputName() const
{
    return m_nameEdit->text().trimmed();
}

QString AddInputDialog::getInputTypeId() const
{
    QListWidgetItem* current = m_typeList->currentItem();
    if (current) return current->data(Qt::UserRole).toString();
    return QString();
}

int AddInputDialog::getInputCount() const
{
    return m_countSpin->value();
}

void AddInputDialog::updateOkButtonState()
{
    m_okButton->setEnabled(!m_nameEdit->text().trimmed().isEmpty());
}
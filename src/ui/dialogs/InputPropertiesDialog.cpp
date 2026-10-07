#include "InputPropertiesDialog.h"

#include <obs-frontend-api.h>
#include <obs.h>
#include <util/base.h>
#include <QTabWidget>
#include <QVBoxLayout>
#include <QFormLayout>
#include <QLineEdit>
#include <QSpinBox>
#include <QDoubleSpinBox>
#include <QComboBox>
#include <QCheckBox>
#include <QPushButton>
#include <QDialogButtonBox>
#include <QLabel>
#include <QMessageBox>
#include <QGroupBox>
#include <QScrollArea>

InputPropertiesDialog::InputPropertiesDialog(FreeMixPlugin* plugin, const QString& inputName, QWidget* parent)
    : QDialog(parent), m_plugin(plugin), m_inputName(inputName)
{
    setWindowTitle(tr("Propriedades de '%1'").arg(inputName));
    setMinimumSize(600, 500);
    setModal(true);
    setupUI();
    loadCurrentProperties();
}

InputPropertiesDialog::~InputPropertiesDialog()
{
}

void InputPropertiesDialog::setupUI()
{
    auto* mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(0);

    m_tabWidget = new QTabWidget();
    m_tabWidget->setObjectName("InputProperties_TabWidget");
    mainLayout->addWidget(m_tabWidget);

    createGeneralTab();
    createVideoTab();
    createAudioTab();
    createPlaybackTab();
    createCompositionTab();
    createAdvancedTab();

    m_buttonBox = new QDialogButtonBox(QDialogButtonBox::Ok | QDialogButtonBox::Apply | QDialogButtonBox::Cancel);
    m_buttonBox->setObjectName("InputProperties_ButtonBox");
    mainLayout->addWidget(m_buttonBox);

    connect(m_buttonBox->button(QDialogButtonBox::Ok), &QPushButton::clicked, this, &InputPropertiesDialog::onOkClicked);
    connect(m_buttonBox->button(QDialogButtonBox::Apply), &QPushButton::clicked, this, &InputPropertiesDialog::onApplyClicked);
    connect(m_buttonBox->button(QDialogButtonBox::Cancel), &QPushButton::clicked, this, &QDialog::reject);
}

void InputPropertiesDialog::loadCurrentProperties()
{
    obs_source_t* source = obs_get_source_by_name(m_inputName.toUtf8().constData());
    if (!source) return;

    obs_data_t* settings = obs_source_get_settings(source);
    if (settings) {
        const char* json = obs_data_get_json(settings);
        if (json) {
        }
        obs_data_release(settings);
    }

    obs_source_release(source);
}

void InputPropertiesDialog::createGeneralTab()
{
    QWidget* tab = new QWidget();
    auto* layout = new QVBoxLayout(tab);
    layout->setContentsMargins(12, 12, 12, 12);
    layout->setSpacing(10);

    auto* group = new QGroupBox(tr("Geral"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(8);

    QLineEdit* nameEdit = new QLineEdit(m_inputName);
    nameEdit->setObjectName("prop_name");
    groupLayout->addRow(tr("&Nome:"), nameEdit);
    m_fields["name"] = nameEdit;

    QLineEdit* kindEdit = new QLineEdit();
    kindEdit->setReadOnly(true);
    kindEdit->setObjectName("prop_kind");
    groupLayout->addRow(tr("&Tipo:"), kindEdit);
    m_fields["kind"] = kindEdit;

    QCheckBox* visibleCheck = new QCheckBox(tr("Visível"));
    visibleCheck->setObjectName("prop_visible");
    visibleCheck->setChecked(true);
    groupLayout->addRow(tr("&Visibilidade:"), visibleCheck);
    m_fields["visible"] = visibleCheck;

    QCheckBox* lockedCheck = new QCheckBox(tr("Bloqueado"));
    lockedCheck->setObjectName("prop_locked");
    groupLayout->addRow(tr("&Bloqueio:"), lockedCheck);
    m_fields["locked"] = lockedCheck;

    layout->addWidget(group);
    layout->addStretch();

    QScrollArea* scroll = new QScrollArea();
    scroll->setWidget(tab);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    m_tabWidget->addTab(scroll, tr("Geral"));
}

void InputPropertiesDialog::createVideoTab()
{
    QWidget* tab = new QWidget();
    auto* layout = new QVBoxLayout(tab);
    layout->setContentsMargins(12, 12, 12, 12);
    layout->setSpacing(10);

    auto* group = new QGroupBox(tr("Imagem e Enquadramento"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(8);

    QDoubleSpinBox* posX = new QDoubleSpinBox();
    posX->setRange(-10000, 10000);
    posX->setDecimals(2);
    posX->setSuffix(" px");
    posX->setObjectName("prop_pos_x");
    groupLayout->addRow(tr("Posição &X:"), posX);
    m_fields["pos_x"] = posX;

    QDoubleSpinBox* posY = new QDoubleSpinBox();
    posY->setRange(-10000, 10000);
    posY->setDecimals(2);
    posY->setSuffix(" px");
    posY->setObjectName("prop_pos_y");
    groupLayout->addRow(tr("Posição &Y:"), posY);
    m_fields["pos_y"] = posY;

    QDoubleSpinBox* scaleX = new QDoubleSpinBox();
    scaleX->setRange(0.01, 100.0);
    scaleX->setDecimals(2);
    scaleX->setValue(1.0);
    scaleX->setObjectName("prop_scale_x");
    groupLayout->addRow(tr("Escala &X:"), scaleX);
    m_fields["scale_x"] = scaleX;

    QDoubleSpinBox* scaleY = new QDoubleSpinBox();
    scaleY->setRange(0.01, 100.0);
    scaleY->setDecimals(2);
    scaleY->setValue(1.0);
    scaleY->setObjectName("prop_scale_y");
    groupLayout->addRow(tr("Escala &Y:"), scaleY);
    m_fields["scale_y"] = scaleY;

    QDoubleSpinBox* rotation = new QDoubleSpinBox();
    rotation->setRange(-360, 360);
    rotation->setDecimals(2);
    rotation->setSuffix("°");
    rotation->setObjectName("prop_rotation");
    groupLayout->addRow(tr("&Rotação:"), rotation);
    m_fields["rotation"] = rotation;

    QComboBox* alignment = new QComboBox();
    alignment->addItems({tr("Centro"), tr("Superior Esquerdo"), tr("Superior Centro"), tr("Superior Direito"),
                         tr("Centro Esquerdo"), tr("Centro Direito"),
                         tr("Inferior Esquerdo"), tr("Inferior Centro"), tr("Inferior Direito")});
    alignment->setObjectName("prop_alignment");
    groupLayout->addRow(tr("&Alinhamento:"), alignment);
    m_fields["alignment"] = alignment;

    QDoubleSpinBox* cropLeft = new QDoubleSpinBox();
    cropLeft->setRange(0, 10000);
    cropLeft->setDecimals(0);
    cropLeft->setSuffix(" px");
    cropLeft->setObjectName("prop_crop_left");
    groupLayout->addRow(tr("Cortar &Esquerda:"), cropLeft);
    m_fields["crop_left"] = cropLeft;

    QDoubleSpinBox* cropRight = new QDoubleSpinBox();
    cropRight->setRange(0, 10000);
    cropRight->setDecimals(0);
    cropRight->setSuffix(" px");
    cropRight->setObjectName("prop_crop_right");
    groupLayout->addRow(tr("Cortar &Direita:"), cropRight);
    m_fields["crop_right"] = cropRight;

    QDoubleSpinBox* cropTop = new QDoubleSpinBox();
    cropTop->setRange(0, 10000);
    cropTop->setDecimals(0);
    cropTop->setSuffix(" px");
    cropTop->setObjectName("prop_crop_top");
    groupLayout->addRow(tr("Cortar &Topo:"), cropTop);
    m_fields["crop_top"] = cropTop;

    QDoubleSpinBox* cropBottom = new QDoubleSpinBox();
    cropBottom->setRange(0, 10000);
    cropBottom->setDecimals(0);
    cropBottom->setSuffix(" px");
    cropBottom->setObjectName("prop_crop_bottom");
    groupLayout->addRow(tr("Cortar &Base:"), cropBottom);
    m_fields["crop_bottom"] = cropBottom;

    layout->addWidget(group);
    layout->addStretch();

    QScrollArea* scroll = new QScrollArea();
    scroll->setWidget(tab);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    m_tabWidget->addTab(scroll, tr("Imagem"));
}

void InputPropertiesDialog::createAudioTab()
{
    QWidget* tab = new QWidget();
    auto* layout = new QVBoxLayout(tab);
    layout->setContentsMargins(12, 12, 12, 12);
    layout->setSpacing(10);

    auto* group = new QGroupBox(tr("Áudio"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(8);

    QDoubleSpinBox* volume = new QDoubleSpinBox();
    volume->setRange(0.0, 20.0);
    volume->setDecimals(2);
    volume->setSingleStep(0.1);
    volume->setValue(1.0);
    volume->setObjectName("prop_volume");
    groupLayout->addRow(tr("&Volume:"), volume);
    m_fields["volume"] = volume;

    QDoubleSpinBox* syncOffset = new QDoubleSpinBox();
    syncOffset->setRange(-5000, 5000);
    syncOffset->setDecimals(0);
    syncOffset->setSuffix(" ms");
    syncOffset->setObjectName("prop_sync_offset");
    groupLayout->addRow(tr("Atraso de &Sincronização:"), syncOffset);
    m_fields["sync_offset"] = syncOffset;

    QComboBox* monitoring = new QComboBox();
    monitoring->addItems({tr("Monitorar e Saída"), tr("Apenas Monitorar"), tr("Apenas Saída"), tr("Desativado")});
    monitoring->setObjectName("prop_monitoring");
    groupLayout->addRow(tr("&Monitoramento:"), monitoring);
    m_fields["monitoring"] = monitoring;

    QCheckBox* monoCheck = new QCheckBox(tr("Mono Forçado"));
    monoCheck->setObjectName("prop_mono");
    groupLayout->addRow(tr("&Canal:"), monoCheck);
    m_fields["force_mono"] = monoCheck;

    QComboBox* track = new QComboBox();
    track->addItems({tr("Master (1)"), tr("Aux A (2)"), tr("Aux B (3)"), tr("Faixa 4"), tr("Faixa 5"), tr("Faixa 6")});
    track->setObjectName("prop_track");
    groupLayout->addRow(tr("Faixa de &Áudio:"), track);
    m_fields["audio_track"] = track;

    layout->addWidget(group);
    layout->addStretch();

    QScrollArea* scroll = new QScrollArea();
    scroll->setWidget(tab);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    m_tabWidget->addTab(scroll, tr("Áudio"));
}

void InputPropertiesDialog::createPlaybackTab()
{
    QWidget* tab = new QWidget();
    auto* layout = new QVBoxLayout(tab);
    layout->setContentsMargins(12, 12, 12, 12);
    layout->setSpacing(10);

    auto* group = new QGroupBox(tr("Reprodução"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(8);

    QCheckBox* loopCheck = new QCheckBox(tr("Repetir (Loop)"));
    loopCheck->setObjectName("prop_loop");
    groupLayout->addRow(loopCheck);
    m_fields["loop"] = loopCheck;

    QCheckBox* restartCheck = new QCheckBox(tr("Reiniciar ao tornar visível"));
    restartCheck->setObjectName("prop_restart_on_show");
    groupLayout->addRow(restartCheck);
    m_fields["restart_on_show"] = restartCheck;

    QDoubleSpinBox* speed = new QDoubleSpinBox();
    speed->setRange(0.01, 10.0);
    speed->setDecimals(2);
    speed->setSingleStep(0.05);
    speed->setValue(1.0);
    speed->setObjectName("prop_speed");
    groupLayout->addRow(tr("&Velocidade:"), speed);
    m_fields["speed"] = speed;

    layout->addWidget(group);
    layout->addStretch();

    QScrollArea* scroll = new QScrollArea();
    scroll->setWidget(tab);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    m_tabWidget->addTab(scroll, tr("Reprodução"));
}

void InputPropertiesDialog::createCompositionTab()
{
    QWidget* tab = new QWidget();
    auto* layout = new QVBoxLayout(tab);
    layout->setContentsMargins(12, 12, 12, 12);
    layout->setSpacing(10);

    auto* group = new QGroupBox(tr("Composição / Camadas"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(8);

    QComboBox* blendMode = new QComboBox();
    blendMode->addItems({tr("Normal"), tr("Aditivo"), tr("Subtrativo"), tr("Tela"),
                         tr("Multiplicar"), tr("Clarear"), tr("Escurecer")});
    blendMode->setObjectName("prop_blend_mode");
    groupLayout->addRow(tr("Modo de &Mesclagem:"), blendMode);
    m_fields["blend_mode"] = blendMode;

    QDoubleSpinBox* opacity = new QDoubleSpinBox();
    opacity->setRange(0.0, 100.0);
    opacity->setDecimals(1);
    opacity->setSuffix(" %");
    opacity->setValue(100.0);
    opacity->setObjectName("prop_opacity");
    groupLayout->addRow(tr("&Opacidade:"), opacity);
    m_fields["opacity"] = opacity;

    QCheckBox* boundsCheck = new QCheckBox(tr("Limitar aos limites"));
    boundsCheck->setObjectName("prop_bounds");
    boundsCheck->setChecked(true);
    groupLayout->addRow(tr("&Limites:"), boundsCheck);
    m_fields["bounds"] = boundsCheck;

    layout->addWidget(group);
    layout->addStretch();

    QScrollArea* scroll = new QScrollArea();
    scroll->setWidget(tab);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    m_tabWidget->addTab(scroll, tr("Composição"));
}

void InputPropertiesDialog::createAdvancedTab()
{
    QWidget* tab = new QWidget();
    auto* layout = new QVBoxLayout(tab);
    layout->setContentsMargins(12, 12, 12, 12);
    layout->setSpacing(10);

    auto* group = new QGroupBox(tr("Avançado"));
    auto* groupLayout = new QFormLayout(group);
    groupLayout->setSpacing(8);

    QPushButton* filtersButton = new QPushButton(tr("Abrir Filtros..."));
    filtersButton->setObjectName("btn_filters");
    connect(filtersButton, &QPushButton::clicked, [this]() {
        obs_frontend_open_filters_dialog(m_inputName.toUtf8().constData());
    });
    groupLayout->addRow(filtersButton);

    QPushButton* propertiesButton = new QPushButton(tr("Propriedades Originais do OBS..."));
    propertiesButton->setObjectName("btn_original_props");
    connect(propertiesButton, &QPushButton::clicked, [this]() {
        obs_frontend_open_input_properties_dialog(m_inputName.toUtf8().constData());
    });
    groupLayout->addRow(propertiesButton);

    QPushButton* projectorButton = new QPushButton(tr("Abrir Projetor..."));
    projectorButton->setObjectName("btn_projector");
    connect(projectorButton, &QPushButton::clicked, [this]() {
        obs_frontend_open_source_projector(m_inputName.toUtf8().constData(), -1);
    });
    groupLayout->addRow(projectorButton);

    layout->addWidget(group);
    layout->addStretch();

    QScrollArea* scroll = new QScrollArea();
    scroll->setWidget(tab);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    m_tabWidget->addTab(scroll, tr("Avançado"));
}

void InputPropertiesDialog::onApplyClicked()
{
    collectAndEmitProperties();
}

void InputPropertiesDialog::onOkClicked()
{
    collectAndEmitProperties();
    accept();
}

void InputPropertiesDialog::collectAndEmitProperties()
{
    QMap<QString, QVariant> properties;

    for (auto it = m_fields.constBegin(); it != m_fields.constEnd(); ++it) {
        const QString& key = it.key();
        QWidget* widget = it.value();

        if (QLineEdit* edit = qobject_cast<QLineEdit*>(widget)) {
            properties[key] = edit->text();
        } else if (QSpinBox* spin = qobject_cast<QSpinBox*>(widget)) {
            properties[key] = spin->value();
        } else if (QDoubleSpinBox* dspin = qobject_cast<QDoubleSpinBox*>(widget)) {
            properties[key] = dspin->value();
        } else if (QComboBox* combo = qobject_cast<QComboBox*>(widget)) {
            properties[key] = combo->currentIndex();
        } else if (QCheckBox* check = qobject_cast<QCheckBox*>(widget)) {
            properties[key] = check->isChecked();
        }
    }

    emit propertiesApplied(m_inputName, properties);
}
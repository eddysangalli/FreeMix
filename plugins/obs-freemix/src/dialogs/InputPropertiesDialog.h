#pragma once

#include <QDialog>
#include <QTabWidget>
#include <QWidget>
#include <QVBoxLayout>
#include <QFormLayout>
#include <QLineEdit>
#include <QSpinBox>
#include <QDoubleSpinBox>
#include <QComboBox>
#include <QCheckBox>
#include <QPushButton>
#include <QDialogButtonBox>
#include <QMap>

class FreeMixPlugin;

class InputPropertiesDialog : public QDialog
{
    Q_OBJECT

public:
    explicit InputPropertiesDialog(FreeMixPlugin* plugin, const QString& inputName, QWidget* parent = nullptr);
    ~InputPropertiesDialog() override;

signals:
    void propertiesApplied(const QString& inputName, const QMap<QString, QVariant>& properties);

private:
    FreeMixPlugin* m_plugin;
    QString m_inputName;
    QTabWidget* m_tabWidget = nullptr;
    QDialogButtonBox* m_buttonBox = nullptr;

    QMap<QString, QWidget*> m_fields;

    void setupUI();
    void loadCurrentProperties();
    void createGeneralTab();
    void createVideoTab();
    void createAudioTab();
    void createPlaybackTab();
    void createCompositionTab();
    void createAdvancedTab();
    void onApplyClicked();
    void onOkClicked();
    void collectAndEmitProperties();
};
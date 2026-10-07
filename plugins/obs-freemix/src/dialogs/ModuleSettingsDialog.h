#pragma once

#include <QDialog>
#include <QTabWidget>
#include <QWidget>
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
#include <QMap>

class FreeMixPlugin;

class ModuleSettingsDialog : public QDialog
{
    Q_OBJECT

public:
    explicit ModuleSettingsDialog(FreeMixPlugin* plugin, QWidget* parent = nullptr);
    ~ModuleSettingsDialog() override;

signals:
    void settingsApplied(const QMap<QString, QVariant>& settings);

private:
    FreeMixPlugin* m_plugin;
    QTabWidget* m_tabWidget = nullptr;
    QDialogButtonBox* m_buttonBox = nullptr;

    void setupUI();
    void createReplayTab();
    void createCallTab();
    void createMultiCorderTab();
    void createPlaylistTab();
    void createOverlaysTab();
    void onApplyClicked();
    void onOkClicked();
    void collectAndEmitSettings();
};
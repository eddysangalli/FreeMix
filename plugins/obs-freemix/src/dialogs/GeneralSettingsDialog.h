#pragma once

#include <QDialog>
#include <QListWidget>
#include <QStackedWidget>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QPushButton>
#include <QDialogButtonBox>
#include <QLabel>
#include <QMap>

class FreeMixPlugin;

class GeneralSettingsDialog : public QDialog
{
    Q_OBJECT

public:
    explicit GeneralSettingsDialog(FreeMixPlugin* plugin, QWidget* parent = nullptr);
    ~GeneralSettingsDialog() override;

signals:
    void settingsApplied(const QMap<QString, QVariant>& settings);

private:
    FreeMixPlugin* m_plugin;
    QListWidget* m_navList = nullptr;
    QStackedWidget* m_pages = nullptr;
    QDialogButtonBox* m_buttonBox = nullptr;
    QMap<QString, QWidget*> m_pagesMap;

    void setupUI();
    void createNavigation();
    void createVideoPage();
    void createAudioPage();
    void createStreamingPage();
    void createRecordingPage();
    void createOutputsPage();
    void createInterfacePage();
    void createShortcutsPage();
    void createComponentsPage();
    void onNavigationChanged(QListWidgetItem* current, QListWidgetItem* previous);
    void onApplyClicked();
    void onOkClicked();
    void collectAndEmitSettings();
};
#pragma once

#include <QObject>
#include <QMenuBar>
#include <QAction>
#include <QMenu>

class FreeMixPlugin;

class FreeMixMenuBar : public QObject
{
    Q_OBJECT

public:
    explicit FreeMixMenuBar(FreeMixPlugin* plugin, QObject* parent = nullptr);
    ~FreeMixMenuBar() override;

    bool initialize();
    void shutdown();

    QMenuBar* menuBar() const;

signals:
    void newProductionRequested();
    void openProductionRequested();
    void saveProductionRequested();
    void saveProductionAsRequested();
    void addInputRequested();
    void inputPropertiesRequested(const QString& inputName);
    void inputFiltersRequested(const QString& inputName);
    void duplicateInputRequested(const QString& inputName);
    void removeInputRequested(const QString& inputName);
    void audioSettingsRequested();
    void audioAdvancedRequested();
    void streamingSettingsRequested();
    void recordingSettingsRequested();
    void outputSettingsRequested();
    void virtualCamSettingsRequested();
    void layoutSettingsRequested();
    void operateEditModeToggled(bool editMode);
    void replaySettingsRequested();
    void freemixCallSettingsRequested();
    void multiCorderSettingsRequested();
    void playlistSettingsRequested();
    void overlaySettingsRequested();
    void generalSettingsRequested();
    void shortcutsSettingsRequested();
    void componentsSettingsRequested();
    void helpDocumentationRequested();
    void helpGitHubRequested();
    void helpDiscordRequested();
    void helpAboutRequested();
    void checkUpdatesRequested();
    void repairInstallationRequested();
    void showLogsRequested();

private:
    FreeMixPlugin* m_plugin;
    QMenuBar* m_menuBar = nullptr;

    QMenu* m_menuProducao = nullptr;
    QMenu* m_menuEntradas = nullptr;
    QMenu* m_menuAudio = nullptr;
    QMenu* m_menuSaidas = nullptr;
    QMenu* m_menuLayout = nullptr;
    QMenu* m_menuFerramentas = nullptr;
    QMenu* m_menuAjuda = nullptr;

    QAction* m_actionOperateEditMode = nullptr;

    void createMenus();
    void createProducaoMenu();
    void createEntradasMenu();
    void createAudioMenu();
    void createSaidasMenu();
    void createLayoutMenu();
    void createFerramentasMenu();
    void createAjudaMenu();
    void connectActions();
    void updateMenuTexts();
};
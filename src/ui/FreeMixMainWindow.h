#pragma once

#include <QMainWindow>
#include <QLabel>
#include <QPushButton>
#include <QSlider>
#include <QTimer>
#include <memory>

class VideoDisplayWidget;

/**
 * @brief FreeMixMainWindow é a interface principal unificada de produção broadcast.
 */
class FreeMixMainWindow : public QMainWindow {
    Q_OBJECT

public:
    explicit FreeMixMainWindow(QWidget *parent = nullptr);
    ~FreeMixMainWindow() override;

private slots:
    void onCutClicked();
    void onFadeClicked();
    void onTBarChanged(int value);
    void onFullscreenClicked();
    void onMultiviewClicked();
    void onOpenSettings();
    void onOpenOutputsDialog();
    void onOpenAudioDialog();
    void onUpdateClock();

private:
    void setupUI();
    void createMenuBar();
    void createTopBar();
    void createCentralMonitors();
    void createProductionConsole();
    void createStatusBar();

    // Controles visuais
    QLabel* m_lblClock = nullptr;
    QLabel* m_lblFps = nullptr;
    QLabel* m_lblCpu = nullptr;

    QPushButton* m_btnFullscreen = nullptr;
    QPushButton* m_btnMultiview = nullptr;
    QPushButton* m_btnStream = nullptr;
    QPushButton* m_btnRecord = nullptr;

    VideoDisplayWidget* m_previewDisplay = nullptr;
    VideoDisplayWidget* m_programDisplay = nullptr;

    QSlider* m_tbarSlider = nullptr;
    QTimer* m_clockTimer = nullptr;
};

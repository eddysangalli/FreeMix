#pragma once

#include <QDialog>
#include <QTableWidget>
#include <QPushButton>
#include <QLabel>
#include <QSlider>
#include <QSpinBox>
#include <QComboBox>
#include <QVector>

struct AudioChannelItem {
    QString name;
    float volumeDb;
    bool muted;
    bool routeMaster;
    bool routeAuxA; // Convidado (Mix-Minus)
    bool routeAuxB; // Fones (Direção)
    int monitorType; // 0=None, 1=MonitorOnly, 2=MonitorAndOutput
    int syncOffsetMs;
    float balance;
};

/**
 * @brief AudioMatrixDialog é a central de matriz de áudio, submixes e roteamento mix-minus do FreeMix.
 */
class AudioMatrixDialog : public QDialog {
    Q_OBJECT

public:
    explicit AudioMatrixDialog(QWidget *parent = nullptr);
    ~AudioMatrixDialog() override;

    void refreshChannels();

signals:
    void channelRoutingChanged(const QString &channel, bool master, bool auxA, bool auxB);
    void channelVolumeChanged(const QString &channel, float db);
    void channelSyncOffsetChanged(const QString &channel, int ms);

private slots:
    void onMuteToggled(int row);
    void onRouteMasterToggled(int row);
    void onRouteAuxAToggled(int row);
    void onRouteAuxBToggled(int row);
    void onMonitorChanged(int row, int index);
    void onSyncOffsetChanged(int row, int value);
    void onOpenPluginsClicked(int row);
    void onResetDelays();

private:
    void setupUI();
    void populateChannelsTable();

    QTableWidget *m_table = nullptr;
    QPushButton *m_btnResetDelays = nullptr;
    QPushButton *m_btnClose = nullptr;
    QVector<AudioChannelItem> m_channels;
};

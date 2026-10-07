#pragma once

#include <QDialog>
#include <QTableWidget>
#include <QPushButton>
#include <QLabel>
#include <QComboBox>
#include <QList>
#include <QPointer>

class QWindow;

struct NativeOutputItem {
    QString id;
    QString name;
    QString type;      // "projector", "vcam", "stream", "decklink", "ndi", "omt"
    QString source;    // "PROGRAM", "PREVIEW", "CLEANFEED", "MULTIVIEW", etc.
    QString dest;
    QString res;
    QString state;     // "stopped", "active", "unavailable"
    QPointer<QWidget> windowWidget; // Janela ou projetor sob gestão nativa do FreeMix
};

class OutputsDialog : public QDialog
{
    Q_OBJECT

public:
    explicit OutputsDialog(QWidget* parent = nullptr);
    ~OutputsDialog() override;

    void refreshMonitors();
    void refreshOutputsTable();

signals:
    void outputToggled(const QString& id, bool start);
    void outputSourceChanged(const QString& id, const QString& newSource);

private slots:
    void onToggleOutput(int row);
    void onConfigureOutput(int row);
    void onSourceChanged(int row, int index);
    void onDestChanged(int row, int index);
    void onStartAll();
    void onStopAll();

private:
    QTableWidget* m_table = nullptr;
    QLabel* m_diagLabel = nullptr;
    QPushButton* m_btnStartAll = nullptr;
    QPushButton* m_btnStopAll = nullptr;

    QList<NativeOutputItem> m_outputs;

    void setupUi();
    void populateDefaultOutputs();
};

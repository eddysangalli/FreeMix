#pragma once

#include <QDialog>
#include <QListWidget>
#include <QTabWidget>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QFormLayout>
#include <QLineEdit>
#include <QPushButton>
#include <QLabel>
#include <QComboBox>
#include <QMap>

namespace freemix {
    class GraphicsManager;
}

/**
 * @brief GraphicsStudioDialog é a central de galeria, fontes de dados e operação no ar de GCs do FreeMix.
 */
class GraphicsStudioDialog : public QDialog {
    Q_OBJECT

public:
    explicit GraphicsStudioDialog(freemix::GraphicsManager *manager, QWidget *parent = nullptr);
    ~GraphicsStudioDialog() override;

private slots:
    void onTemplateSelected(QListWidgetItem *item);
    void onPrepareClicked();
    void onTakeInClicked();
    void onUpdateClicked();
    void onTakeOutClicked();
    void onClearAllClicked();
    void onLoadCSVClicked();

private:
    void setupUI();
    void populateGallery(const QString &filterCollection = QString());
    void buildFormForTemplate(const QString &templateId);

    freemix::GraphicsManager *m_manager = nullptr;
    QString m_selectedTemplateId;

    QListWidget *m_galleryList = nullptr;
    QWidget *m_formContainer = nullptr;
    QFormLayout *m_formLayout = nullptr;
    QMap<QString, QLineEdit*> m_fieldInputs;

    QLabel *m_lblPreview = nullptr;
    QLabel *m_lblLayerStatus = nullptr;

    QPushButton *m_btnPrepare = nullptr;
    QPushButton *m_btnTakeIn = nullptr;
    QPushButton *m_btnUpdate = nullptr;
    QPushButton *m_btnTakeOut = nullptr;
    QPushButton *m_btnClearAll = nullptr;
    QPushButton *m_btnLoadCSV = nullptr;
};

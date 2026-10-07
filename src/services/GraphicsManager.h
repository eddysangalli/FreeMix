#pragma once

#include <QString>
#include <QVector>
#include <QMap>
#include <QJsonObject>
#include <QJsonArray>
#include <QObject>

namespace freemix {

struct TemplateField {
    QString key;
    QString label;
    QString type; // text, number, color, image
    QString defaultValue;
};

struct GCTemplate {
    QString id;
    QString name;
    QString collection; // Jornalismo, Esportes, Marca, etc.
    QString category;
    int layer = 3;
    QString htmlPath;
    QVector<TemplateField> fields;
};

struct DataSourceRecord {
    QMap<QString, QString> values;
};

/**
 * @brief GraphicsManager gerencia a galeria de GCs, fontes de dados (CSV, JSON, Manual) e camadas no ar.
 */
class GraphicsManager : public QObject {
    Q_OBJECT

public:
    explicit GraphicsManager(QObject *parent = nullptr);
    ~GraphicsManager() override;

    bool initialize(const QString &graphicsAssetsPath);
    const QVector<GCTemplate>& templates() const { return m_templates; }
    const GCTemplate* findTemplate(const QString &id) const;

    // Fontes de Dados
    bool loadCSV(const QString &filePath, QVector<QString> &outColumns, QVector<DataSourceRecord> &outRecords);
    bool loadJSON(const QString &jsonContent, QVector<QString> &outColumns, QVector<DataSourceRecord> &outRecords);

    // Controle Operacional de Camadas (1, 2, 3)
    void prepare(int layer, const QString &templateId, const QMap<QString, QString> &data);
    void takeIn(int layer);
    void updateLive(int layer, const QMap<QString, QString> &newData);
    void takeOut(int layer);
    void clearAll();

    bool isLayerOnAir(int layer) const;
    QString liveTemplateId(int layer) const;

signals:
    void layerStateChanged(int layer, bool onAir, const QString &templateId);
    void galleryReloaded();

private:
    void scanDirectory(const QString &dirPath);

    QVector<GCTemplate> m_templates;
    QString m_assetsPath;

    // Estado das camadas (1, 2, 3)
    struct LayerState {
        QString preparedTemplateId;
        QMap<QString, QString> preparedData;
        QString onAirTemplateId;
        QMap<QString, QString> onAirData;
        bool isOnAir = false;
    };

    QMap<int, LayerState> m_layers;
};

} // namespace freemix

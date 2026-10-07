#include "GraphicsManager.h"

#include <QDir>
#include <QDirIterator>
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QTextStream>
#include <QDebug>

namespace freemix {

GraphicsManager::GraphicsManager(QObject *parent)
    : QObject(parent)
{
    // Inicializa as 3 camadas broadcast
    m_layers[1] = {};
    m_layers[2] = {};
    m_layers[3] = {};
}

GraphicsManager::~GraphicsManager() = default;

bool GraphicsManager::initialize(const QString &graphicsAssetsPath)
{
    m_assetsPath = graphicsAssetsPath;
    m_templates.clear();

    if (QDir(m_assetsPath).exists()) {
        scanDirectory(m_assetsPath);
    } else {
        qWarning() << "[GraphicsManager] Pasta de templates não encontrada:" << m_assetsPath;
    }

    qInfo() << "[GraphicsManager] Galeria carregada com" << m_templates.size() << "templates broadcast.";
    emit galleryReloaded();
    return true;
}

void GraphicsManager::scanDirectory(const QString &dirPath)
{
    QDirIterator it(dirPath, QStringList() << "*.json", QDir::Files, QDirIterator::Subdirectories);
    while (it.hasNext()) {
        QString jsonPath = it.next();
        QFile file(jsonPath);
        if (!file.open(QIODevice::ReadOnly)) continue;

        QJsonDocument doc = QJsonDocument::fromJson(file.readAll());
        file.close();
        if (!doc.isObject()) continue;

        QJsonObject obj = doc.object();
        if (!obj.contains("id") || !obj.contains("htmlFile")) continue;

        GCTemplate t;
        t.id = obj["id"].toString();
        t.name = obj["name"].toString();
        t.collection = obj["collection"].toString("Geral");
        t.category = obj["category"].toString("Tarjas");
        t.layer = obj["layer"].toInt(3);

        QFileInfo fi(jsonPath);
        t.htmlPath = fi.dir().filePath(obj["htmlFile"].toString());

        QJsonArray fieldsArr = obj["fields"].toArray();
        for (const auto &fVal : fieldsArr) {
            QJsonObject fObj = fVal.toObject();
            TemplateField field;
            field.key = fObj["key"].toString();
            field.label = fObj["label"].toString();
            field.type = fObj["type"].toString("text");
            field.defaultValue = fObj["default"].toVariant().toString();
            t.fields.append(field);
        }

        m_templates.append(t);
    }
}

const GCTemplate* GraphicsManager::findTemplate(const QString &id) const
{
    for (const auto &t : m_templates) {
        if (t.id == id) return &t;
    }
    return nullptr;
}

bool GraphicsManager::loadCSV(const QString &filePath, QVector<QString> &outColumns, QVector<DataSourceRecord> &outRecords)
{
    QFile file(filePath);
    if (!file.open(QIODevice::ReadOnly | QIODevice::Text)) return false;

    QTextStream in(&file);
    outColumns.clear();
    outRecords.clear();

    if (in.atEnd()) return false;

    // Cabeçalho (delimitado por , ou ;)
    QString headerLine = in.readLine();
    QChar delim = headerLine.contains(';') ? ';' : ',';
    outColumns = headerLine.split(delim);
    for (auto &col : outColumns) col = col.trimmed();

    while (!in.atEnd()) {
        QString line = in.readLine().trimmed();
        if (line.isEmpty()) continue;

        QStringList parts = line.split(delim);
        DataSourceRecord rec;
        for (int i = 0; i < outColumns.size() && i < parts.size(); ++i) {
            rec.values[outColumns[i]] = parts[i].trimmed();
        }
        outRecords.append(rec);
    }

    qInfo() << "[GraphicsManager] CSV carregado:" << filePath << "(" << outRecords.size() << "linhas)";
    return true;
}

bool GraphicsManager::loadJSON(const QString &jsonContent, QVector<QString> &outColumns, QVector<DataSourceRecord> &outRecords)
{
    QJsonDocument doc = QJsonDocument::fromJson(jsonContent.toUtf8());
    if (!doc.isArray()) return false;

    outColumns.clear();
    outRecords.clear();

    QJsonArray arr = doc.array();
    QSet<QString> colsSet;

    for (const auto &item : arr) {
        if (!item.isObject()) continue;
        QJsonObject obj = item.toObject();
        DataSourceRecord rec;
        for (auto it = obj.begin(); it != obj.end(); ++it) {
            colsSet.insert(it.key());
            rec.values[it.key()] = it.value().toVariant().toString();
        }
        outRecords.append(rec);
    }

    outColumns = colsSet.values();
    return true;
}

void GraphicsManager::prepare(int layer, const QString &templateId, const QMap<QString, QString> &data)
{
    if (!m_layers.contains(layer)) layer = 3;
    m_layers[layer].preparedTemplateId = templateId;
    m_layers[layer].preparedData = data;
    qInfo() << "[GraphicsManager] GC preparado na camada" << layer << ":" << templateId;
}

void GraphicsManager::takeIn(int layer)
{
    if (!m_layers.contains(layer)) layer = 3;
    auto &st = m_layers[layer];
    st.onAirTemplateId = st.preparedTemplateId;
    st.onAirData = st.preparedData;
    st.isOnAir = true;

    emit layerStateChanged(layer, true, st.onAirTemplateId);
    qInfo() << "[GraphicsManager] GC NO AR (TAKE IN) na camada" << layer << ":" << st.onAirTemplateId;
}

void GraphicsManager::updateLive(int layer, const QMap<QString, QString> &newData)
{
    if (!m_layers.contains(layer)) return;
    auto &st = m_layers[layer];
    if (!st.isOnAir) return;

    st.onAirData = newData;
    qInfo() << "[GraphicsManager] Dados do GC atualizados no ar na camada" << layer;
}

void GraphicsManager::takeOut(int layer)
{
    if (!m_layers.contains(layer)) return;
    auto &st = m_layers[layer];
    st.isOnAir = false;

    emit layerStateChanged(layer, false, st.onAirTemplateId);
    qInfo() << "[GraphicsManager] GC RETIRADO (TAKE OUT) da camada" << layer;
}

void GraphicsManager::clearAll()
{
    for (auto it = m_layers.begin(); it != m_layers.end(); ++it) {
        if (it.value().isOnAir) {
            it.value().isOnAir = false;
            emit layerStateChanged(it.key(), false, it.value().onAirTemplateId);
        }
    }
    qInfo() << "[GraphicsManager] Todos os GCs retirados do ar (CLEAR ALL).";
}

bool GraphicsManager::isLayerOnAir(int layer) const
{
    return m_layers.value(layer).isOnAir;
}

QString GraphicsManager::liveTemplateId(int layer) const
{
    return m_layers.value(layer).onAirTemplateId;
}

} // namespace freemix

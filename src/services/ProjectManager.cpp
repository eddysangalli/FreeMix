#include "ProjectManager.h"

#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QFileInfo>
#include <QDebug>

namespace freemix {

ProjectManager::ProjectManager()
{
    newProject();
}

ProjectManager::~ProjectManager() = default;

bool ProjectManager::newProject()
{
    m_currentFilePath.clear();
    m_projectName = "Nova Produção";
    m_modified = false;

    m_baseWidth = 1920;
    m_baseHeight = 1080;
    m_fpsNum = 60;
    m_fpsDen = 1;

    m_inputs.clear();

    // Cria entradas padrão de demonstração
    m_inputs.append({"cam1", "Câmera Principal", "dshow_input", "Cameras", 0, {}, 0.0f, false, true, false, true, 0, 2});
    m_inputs.append({"cam2", "Câmera Secundária", "dshow_input", "Cameras", 1, {}, -2.0f, false, true, false, true, 0, 2});
    m_inputs.append({"call1", "FreeMix Call 1", "browser_source", "Calls", 2, {}, 0.0f, false, true, true, true, 40, 1});
    m_inputs.append({"vt1", "VT Abertura", "ffmpeg_source", "Videos", 3, {}, -3.0f, false, true, false, true, 0, 0});

    m_outputs = {};
    m_outputs.recordFormat = "mkv";

    return true;
}

bool ProjectManager::saveProject(const QString &filePath)
{
    QFile file(filePath);
    if (!file.open(QIODevice::WriteOnly | QIODevice::Truncate)) {
        qWarning() << "[ProjectManager] Falha ao abrir arquivo para escrita:" << filePath;
        return false;
    }

    QJsonObject root;
    root["format"] = "FREEMIX_PROJECT";
    root["version"] = 1;
    root["name"] = QFileInfo(filePath).baseName();

    // Configurações de Vídeo
    QJsonObject videoObj;
    videoObj["baseWidth"] = static_cast<int>(m_baseWidth);
    videoObj["baseHeight"] = static_cast<int>(m_baseHeight);
    videoObj["fpsNum"] = static_cast<int>(m_fpsNum);
    videoObj["fpsDen"] = static_cast<int>(m_fpsDen);
    root["video"] = videoObj;

    // Entradas
    QJsonArray inputsArray;
    for (const auto &inp : m_inputs) {
        QJsonObject inpObj;
        inpObj["id"] = inp.id;
        inpObj["name"] = inp.name;
        inpObj["kind"] = inp.kind;
        inpObj["category"] = inp.category;
        inpObj["colorTag"] = inp.colorTag;
        inpObj["settings"] = inp.settings;
        inpObj["volumeDb"] = inp.volumeDb;
        inpObj["muted"] = inp.muted;
        inpObj["routeMaster"] = inp.routeMaster;
        inpObj["routeAuxA"] = inp.routeAuxA;
        inpObj["routeAuxB"] = inp.routeAuxB;
        inpObj["syncOffsetMs"] = inp.syncOffsetMs;
        inpObj["monitorType"] = inp.monitorType;
        inputsArray.append(inpObj);
    }
    root["inputs"] = inputsArray;

    // Saídas
    QJsonObject outObj;
    outObj["streamServer"] = m_outputs.streamServer;
    outObj["streamKey"] = m_outputs.streamKey;
    outObj["multiStreams"] = m_outputs.multiStreamDestinations;
    outObj["recordPath"] = m_outputs.recordPath;
    outObj["recordFormat"] = m_outputs.recordFormat;
    root["outputs"] = outObj;

    QJsonDocument doc(root);
    file.write(doc.toJson(QJsonDocument::Indented));
    file.close();

    m_currentFilePath = filePath;
    m_projectName = QFileInfo(filePath).baseName();
    m_modified = false;
    qInfo() << "[ProjectManager] Projeto salvo com sucesso:" << filePath;
    return true;
}

bool ProjectManager::loadProject(const QString &filePath)
{
    QFile file(filePath);
    if (!file.open(QIODevice::ReadOnly)) {
        qWarning() << "[ProjectManager] Falha ao abrir arquivo para leitura:" << filePath;
        return false;
    }

    QJsonParseError err;
    QJsonDocument doc = QJsonDocument::fromJson(file.readAll(), &err);
    file.close();

    if (err.error != QJsonParseError::NoError || !doc.isObject()) {
        qWarning() << "[ProjectManager] JSON de projeto inválido:" << err.errorString();
        return false;
    }

    QJsonObject root = doc.object();
    if (root["format"].toString() != "FREEMIX_PROJECT") {
        qWarning() << "[ProjectManager] Arquivo não reconhecido como projeto FreeMix!";
        return false;
    }

    // Carrega vídeo
    QJsonObject videoObj = root["video"].toObject();
    m_baseWidth = videoObj["baseWidth"].toInt(1920);
    m_baseHeight = videoObj["baseHeight"].toInt(1080);
    m_fpsNum = videoObj["fpsNum"].toInt(60);
    m_fpsDen = videoObj["fpsDen"].toInt(1);

    // Carrega entradas
    m_inputs.clear();
    QJsonArray inputsArray = root["inputs"].toArray();
    for (const auto &val : inputsArray) {
        QJsonObject inpObj = val.toObject();
        ProjectInputData inp;
        inp.id = inpObj["id"].toString();
        inp.name = inpObj["name"].toString();
        inp.kind = inpObj["kind"].toString();
        inp.category = inpObj["category"].toString("Cameras");
        inp.colorTag = inpObj["colorTag"].toInt(0);
        inp.settings = inpObj["settings"].toObject();
        inp.volumeDb = static_cast<float>(inpObj["volumeDb"].toDouble(0.0));
        inp.muted = inpObj["muted"].toBool(false);
        inp.routeMaster = inpObj["routeMaster"].toBool(true);
        inp.routeAuxA = inpObj["routeAuxA"].toBool(false);
        inp.routeAuxB = inpObj["routeAuxB"].toBool(true);
        inp.syncOffsetMs = inpObj["syncOffsetMs"].toInt(0);
        inp.monitorType = inpObj["monitorType"].toInt(0);
        m_inputs.append(inp);
    }

    // Carrega saídas
    QJsonObject outObj = root["outputs"].toObject();
    m_outputs.streamServer = outObj["streamServer"].toString();
    m_outputs.streamKey = outObj["streamKey"].toString();
    m_outputs.multiStreamDestinations = outObj["multiStreams"].toArray();
    m_outputs.recordPath = outObj["recordPath"].toString();
    m_outputs.recordFormat = outObj["recordFormat"].toString("mkv");

    m_currentFilePath = filePath;
    m_projectName = QFileInfo(filePath).baseName();
    m_modified = false;
    qInfo() << "[ProjectManager] Projeto carregado com sucesso:" << filePath << "(" << m_inputs.size() << "entradas)";
    return true;
}

void ProjectManager::addInput(const ProjectInputData &input)
{
    m_inputs.append(input);
    m_modified = true;
}

void ProjectManager::removeInput(const QString &id)
{
    for (int i = 0; i < m_inputs.size(); ++i) {
        if (m_inputs[i].id == id) {
            m_inputs.removeAt(i);
            m_modified = true;
            break;
        }
    }
}

void ProjectManager::updateInput(const ProjectInputData &input)
{
    for (int i = 0; i < m_inputs.size(); ++i) {
        if (m_inputs[i].id == input.id) {
            m_inputs[i] = input;
            m_modified = true;
            break;
        }
    }
}

} // namespace freemix

#pragma once

#include <QString>
#include <QJsonObject>
#include <QJsonArray>
#include <QVector>
#include <memory>

namespace freemix {

struct ProjectInputData {
    QString id;
    QString name;
    QString kind; // "dshow_input", "ffmpeg_source", "browser_source", etc.
    QString category; // "Cameras", "Videos", "Titles", "Calls", etc.
    int colorTag;
    QJsonObject settings;
    float volumeDb;
    bool muted;
    bool routeMaster;
    bool routeAuxA;
    bool routeAuxB;
    int syncOffsetMs;
    int monitorType;
};

struct ProjectOutputData {
    QString streamServer;
    QString streamKey;
    QJsonArray multiStreamDestinations;
    bool recordActive;
    QString recordPath;
    QString recordFormat;
};

/**
 * @brief ProjectManager gerencia a persistência de produções FreeMix em formato próprio (.fmx).
 */
class ProjectManager {
public:
    ProjectManager();
    ~ProjectManager();

    bool newProject();
    bool saveProject(const QString &filePath);
    bool loadProject(const QString &filePath);

    QString currentFilePath() const { return m_currentFilePath; }
    QString projectName() const { return m_projectName; }
    bool isModified() const { return m_modified; }
    void setModified(bool mod) { m_modified = mod; }

    // Dados do projeto atual
    uint32_t baseWidth() const { return m_baseWidth; }
    uint32_t baseHeight() const { return m_baseHeight; }
    uint32_t fpsNum() const { return m_fpsNum; }
    uint32_t fpsDen() const { return m_fpsDen; }

    const QVector<ProjectInputData>& inputs() const { return m_inputs; }
    void addInput(const ProjectInputData &input);
    void removeInput(const QString &id);
    void updateInput(const ProjectInputData &input);

    const ProjectOutputData& outputs() const { return m_outputs; }
    void setOutputs(const ProjectOutputData &outputs) { m_outputs = outputs; m_modified = true; }

private:
    QString m_currentFilePath;
    QString m_projectName = "Producao Sem Titulo";
    bool m_modified = false;

    uint32_t m_baseWidth = 1920;
    uint32_t m_baseHeight = 1080;
    uint32_t m_fpsNum = 60;
    uint32_t m_fpsDen = 1;

    QVector<ProjectInputData> m_inputs;
    ProjectOutputData m_outputs;
};

} // namespace freemix

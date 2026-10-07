#pragma once

#include <QString>
#include <QVector>
#include <QJsonObject>
#include <obs.h>
#include <memory>

namespace freemix {

struct LiveInput {
    QString id;
    QString name;
    QString typeId;
    obs_source_t *source = nullptr;
    int colorTag = 0;
};

/**
 * @brief InputManager gerencia a criação, transições e comutação de entradas na libobs.
 */
class InputManager {
public:
    InputManager();
    ~InputManager();

    bool initialize();
    void shutdown();

    obs_source_t* createInput(const QString &name, const QString &typeId, const QJsonObject &settings = {});
    void removeInput(const QString &name);
    obs_source_t* findInput(const QString &name) const;

    const QVector<LiveInput>& liveInputs() const { return m_inputs; }

    // Comutação Broadcast
    void setPreviewSource(obs_source_t *source);
    void setProgramSource(obs_source_t *source);
    obs_source_t* previewSource() const { return m_previewSource; }
    obs_source_t* programSource() const { return m_programSource; }

    void executeCut();
    void executeFade(uint32_t durationMs = 300);
    void setTBarPosition(float position); // 0.0f a 1.0f

private:
    QVector<LiveInput> m_inputs;
    obs_source_t *m_previewSource = nullptr;
    obs_source_t *m_programSource = nullptr;
    obs_source_t *m_transitionSource = nullptr;
};

} // namespace freemix

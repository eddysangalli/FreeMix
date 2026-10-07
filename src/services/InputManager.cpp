#include "InputManager.h"
#include <QJsonDocument>
#include <QDebug>

namespace freemix {

InputManager::InputManager() = default;

InputManager::~InputManager()
{
    shutdown();
}

bool InputManager::initialize()
{
    // Cria a transição padrão (Fade / Cut) para o barramento de programa
    m_transitionSource = obs_source_create("fade_transition", "FreeMix PGM Transition", nullptr, nullptr);
    if (!m_transitionSource) {
        qWarning() << "[InputManager] Falha ao criar transição de fade, usando cut.";
        m_transitionSource = obs_source_create("cut_transition", "FreeMix PGM Transition", nullptr, nullptr);
    }

    if (m_transitionSource) {
        // Conecta a transição como canal 0 do output principal da libobs
        obs_set_output_source(0, m_transitionSource);
    }

    qInfo() << "[InputManager] Inicializado com sucesso.";
    return true;
}

void InputManager::shutdown()
{
    for (auto &inp : m_inputs) {
        if (inp.source) {
            obs_source_release(inp.source);
            inp.source = nullptr;
        }
    }
    m_inputs.clear();

    if (m_transitionSource) {
        obs_source_release(m_transitionSource);
        m_transitionSource = nullptr;
    }
    m_previewSource = nullptr;
    m_programSource = nullptr;
}

obs_source_t* InputManager::createInput(const QString &name, const QString &typeId, const QJsonObject &settings)
{
    obs_data_t *obsSettings = nullptr;
    if (!settings.isEmpty()) {
        QJsonDocument doc(settings);
        obsSettings = obs_data_create_from_json(doc.toJson(QJsonDocument::Compact).constData());
    }

    obs_source_t *source = obs_source_create(typeId.toUtf8().constData(), name.toUtf8().constData(), obsSettings, nullptr);
    if (obsSettings) {
        obs_data_release(obsSettings);
    }

    if (!source) {
        qWarning() << "[InputManager] Falha ao criar fonte:" << name << "tipo:" << typeId;
        return nullptr;
    }

    LiveInput item;
    item.id = QString("inp_%1").arg(m_inputs.size() + 1);
    item.name = name;
    item.typeId = typeId;
    item.source = source;
    m_inputs.append(item);

    qInfo() << "[InputManager] Nova entrada criada:" << name << "tipo:" << typeId;
    return source;
}

void InputManager::removeInput(const QString &name)
{
    for (int i = 0; i < m_inputs.size(); ++i) {
        if (m_inputs[i].name == name) {
            if (m_previewSource == m_inputs[i].source) m_previewSource = nullptr;
            if (m_programSource == m_inputs[i].source) m_programSource = nullptr;

            obs_source_release(m_inputs[i].source);
            m_inputs.removeAt(i);
            qInfo() << "[InputManager] Entrada removida:" << name;
            break;
        }
    }
}

obs_source_t* InputManager::findInput(const QString &name) const
{
    for (const auto &inp : m_inputs) {
        if (inp.name == name) return inp.source;
    }
    return nullptr;
}

void InputManager::setPreviewSource(obs_source_t *source)
{
    m_previewSource = source;
}

void InputManager::setProgramSource(obs_source_t *source)
{
    m_programSource = source;
    if (m_transitionSource && m_programSource) {
        obs_transition_set(m_transitionSource, m_programSource);
    }
}

void InputManager::executeCut()
{
    if (!m_previewSource || !m_transitionSource) return;

    obs_source_t *temp = m_programSource;
    m_programSource = m_previewSource;
    m_previewSource = temp;

    obs_transition_set(m_transitionSource, m_programSource);
    qInfo() << "[InputManager] Comutação CUT executada!";
}

void InputManager::executeFade(uint32_t durationMs)
{
    if (!m_previewSource || !m_transitionSource) return;

    obs_source_t *target = m_previewSource;
    m_previewSource = m_programSource;
    m_programSource = target;

    obs_transition_start(m_transitionSource, OBS_TRANSITION_MODE_AUTO, durationMs, m_programSource);
    qInfo() << "[InputManager] Transição FADE iniciada (" << durationMs << "ms)";
}

void InputManager::setTBarPosition(float position)
{
    if (!m_transitionSource) return;
    obs_transition_set_manual_torque(m_transitionSource, position);
}

} // namespace freemix

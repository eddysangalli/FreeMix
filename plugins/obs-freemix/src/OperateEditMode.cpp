#include "OperateEditMode.h"
#include "FreeMixPlugin.h"

#include <obs-frontend-api.h>
#include <obs.h>
#include <QApplication>
#include <QKeyEvent>

OperateEditMode::OperateEditMode(FreeMixPlugin* plugin, QObject* parent)
    : QObject(parent), m_plugin(plugin)
{
}

OperateEditMode::~OperateEditMode()
{
    shutdown();
}

bool OperateEditMode::initialize()
{
    m_editMode = false;
    applyModeToUI();
    blog(LOG_INFO, "[FreeMix] Operate/Edit mode initialized (Operate mode)");
    return true;
}

void OperateEditMode::shutdown()
{
    setEditMode(false);
}

bool OperateEditMode::isEditMode() const
{
    return m_editMode;
}

void OperateEditMode::setEditMode(bool editMode)
{
    if (m_editMode == editMode) return;

    m_editMode = editMode;
    applyModeToUI();
    applyModeToSceneItems();
    emit modeChanged(m_editMode);

    blog(LOG_INFO, "[FreeMix] Mode changed to %s", m_editMode ? "Edit" : "Operate");
}

void OperateEditMode::toggleMode()
{
    setEditMode(!m_editMode);
}

void OperateEditMode::applyModeToUI()
{
    QWidget* preview = obs_frontend_get_preview_program_widget(0);
    QWidget* program = obs_frontend_get_preview_program_widget(1);

    if (preview) {
        preview->setProperty("freemix_edit_mode", m_editMode);
    }
    if (program) {
        program->setProperty("freemix_edit_mode", m_editMode);
    }
}

void OperateEditMode::applyModeToSceneItems()
{
}
#include "MultiviewManager.h"
#include "../FreeMixPlugin.h"
#include <QDebug>

MultiviewManager::MultiviewManager(FreeMixPlugin* plugin, QObject* parent)
    : QObject(parent)
    , m_plugin(plugin)
{
}

MultiviewManager::~MultiviewManager()
{
    shutdown();
}

bool MultiviewManager::initialize()
{
    m_slots.clear();
    for (int i = 0; i < 16; ++i) {
        m_slots.append(QString());
    }
    return true;
}

void MultiviewManager::shutdown()
{
    m_slots.clear();
}

void MultiviewManager::setLayout(MultiviewLayout layout)
{
    if (m_layout != layout) {
        m_layout = layout;
        emit layoutChanged(layout);
        qInfo() << "[FreeMix MultiviewManager] Layout alterado para:" << (int)layout;
    }
}

void MultiviewManager::setTallyEnabled(bool enabled)
{
    m_tallyEnabled = enabled;
}

void MultiviewManager::setMetersEnabled(bool enabled)
{
    m_metersEnabled = enabled;
}

void MultiviewManager::assignSlot(int slotIndex, const QString& sourceOrSceneName)
{
    if (slotIndex >= 0 && slotIndex < m_slots.size()) {
        m_slots[slotIndex] = sourceOrSceneName;
        emit slotUpdated(slotIndex, sourceOrSceneName);
    }
}

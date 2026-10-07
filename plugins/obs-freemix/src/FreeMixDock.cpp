#include "FreeMixDock.h"
#include "FreeMixPlugin.h"
#include <obs-frontend-api.h>
#include <QMainWindow>
#include <QVBoxLayout>
#include <QLabel>
#include <QPushButton>

FreeMixDock::FreeMixDock(FreeMixPlugin* plugin, QObject* parent)
    : QObject(parent), m_plugin(plugin)
{
}

FreeMixDock::~FreeMixDock()
{
    shutdown();
}

bool FreeMixDock::initialize()
{
    setupDockWidget();
    return true;
}

void FreeMixDock::shutdown()
{
    if (m_dockWidget) {
        obs_frontend_remove_dock(m_dockWidget);
        m_dockWidget = nullptr;
    }
}

QDockWidget* FreeMixDock::dockWidget() const
{
    return m_dockWidget;
}

void FreeMixDock::createDockContent()
{
    m_dockContent = new QWidget();
    auto* layout = new QVBoxLayout(m_dockContent);
    layout->setContentsMargins(8, 8, 8, 8);
    layout->setSpacing(6);

    auto* titleLabel = new QLabel("<b>FreeMix Quick Actions</b>", m_dockContent);
    layout->addWidget(titleLabel);

    auto* btnMesa = new QPushButton("Abrir Mesa de Operação", m_dockContent);
    layout->addWidget(btnMesa);

    layout->addStretch();
}

void FreeMixDock::setupDockWidget()
{
    createDockContent();

    m_dockWidget = new QDockWidget("FreeMix", obs_frontend_get_main_window());
    m_dockWidget->setObjectName("FreeMixQuickDock");
    m_dockWidget->setWidget(m_dockContent);

    obs_frontend_add_dock(m_dockWidget);

    connect(m_dockWidget, &QDockWidget::visibilityChanged, this, &FreeMixDock::dockVisibilityChanged);
}
#pragma once

#include <QObject>
#include <QDockWidget>
#include <QWidget>

class FreeMixPlugin;

class FreeMixDock : public QObject
{
    Q_OBJECT

public:
    explicit FreeMixDock(FreeMixPlugin* plugin, QObject* parent = nullptr);
    ~FreeMixDock() override;

    bool initialize();
    void shutdown();

    QDockWidget* dockWidget() const;

signals:
    void dockVisibilityChanged(bool visible);

private:
    FreeMixPlugin* m_plugin;
    QDockWidget* m_dockWidget = nullptr;
    QWidget* m_dockContent = nullptr;

    void createDockContent();
    void setupDockWidget();
};
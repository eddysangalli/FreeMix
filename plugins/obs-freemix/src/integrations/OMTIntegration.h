#pragma once

#include <QObject>
#include <QString>

class FreeMixPlugin;

class OMTIntegration : public QObject
{
    Q_OBJECT

public:
    explicit OMTIntegration(FreeMixPlugin* plugin, QObject* parent = nullptr);
    ~OMTIntegration() override;

    bool initialize();
    void shutdown();

    bool isAvailable() const { return m_available; }
    bool startOutput(const QString& endpoint);
    bool stopOutput();

private:
    FreeMixPlugin* m_plugin;
    bool m_available = false;
    bool m_active = false;
};

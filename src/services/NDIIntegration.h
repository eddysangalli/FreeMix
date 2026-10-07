#pragma once

#include <QObject>
#include <QString>

class FreeMixPlugin;

class NDIIntegration : public QObject
{
    Q_OBJECT

public:
    explicit NDIIntegration(FreeMixPlugin* plugin, QObject* parent = nullptr);
    ~NDIIntegration() override;

    bool initialize();
    void shutdown();

    bool isAvailable() const { return m_available; }
    bool isAlphaSupported() const { return true; } // NDI suporta RGBA nativo

    bool startOutput(const QString& name, bool includeAlpha = false);
    bool stopOutput();

private:
    FreeMixPlugin* m_plugin;
    bool m_available = false;
    bool m_active = false;
};

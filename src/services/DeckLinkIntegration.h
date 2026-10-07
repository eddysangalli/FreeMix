#pragma once

#include <QObject>
#include <QString>
#include <QStringList>

class FreeMixPlugin;

class DeckLinkIntegration : public QObject
{
    Q_OBJECT

public:
    explicit DeckLinkIntegration(FreeMixPlugin* plugin, QObject* parent = nullptr);
    ~DeckLinkIntegration() override;

    bool initialize();
    void shutdown();

    bool isAvailable() const { return m_available; }
    QString statusMessage() const { return m_statusMessage; }

    QStringList detectedDevices() const { return m_devices; }
    QStringList supportedVideoModes() const;

    // Modos de saída profissionais suportados
    enum KeyerMode {
        ModeNormal = 0,         // Saída simples SDI (Program ou Clean Feed)
        ModeExternalFillAndKey, // Canal A = Fill (RGB), Canal B = Key (Alpha 8-bit)
        ModeInternalKeyer       // Keyer interno com downstream keying na placa
    };

    bool setOutputMode(int deviceIndex, KeyerMode mode);

signals:
    void deviceDetected(const QString& deviceName);
    void deviceError(const QString& error);

private:
    FreeMixPlugin* m_plugin;
    bool m_available = false;
    QString m_statusMessage;
    QStringList m_devices;
};

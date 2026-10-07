#pragma once

#include <QObject>

class FreeMixPlugin;

class DownstreamKeyerIntegration : public QObject
{
    Q_OBJECT

public:
    explicit DownstreamKeyerIntegration(FreeMixPlugin* plugin, QObject* parent = nullptr);
    ~DownstreamKeyerIntegration() override;

    bool initialize();
    void shutdown();

    bool isAvailable() const;
    int getKeyerCount() const;
    QString getKeyerName(int index) const;
    QString getKeyerScene(int index) const;
    bool setKeyerScene(int index, const QString& sceneName);
    bool clearKeyerScene(int index);
    bool toggleKeyer(int index);

signals:
    void availabilityChanged(bool available);
    void keyersUpdated();
    void keyerSceneChanged(int index, const QString& sceneName);

private:
    FreeMixPlugin* m_plugin;
    bool m_available = false;
    QString m_vendorName = "downstream-keyer";

    bool callVendor(const QString& requestType, const QVariantMap& data, QVariantMap* response = nullptr);
    void updateKeyerList();
};
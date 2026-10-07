#pragma once

#include <QString>
#include <QVector>
#include <QJsonObject>
#include <QObject>
#include <QTimer>
#include <memory>

namespace freemix {

enum class BondingMode {
    MainBackup,          // Principal + Reserva (Failover automático)
    SimultaneousBackup,  // Redundância Simultânea (Hitless / Packet Duplication)
    CapacityAggregation  // Agregação de Capacidade (Load-sharing / Multi-link)
};

enum class InterfaceStatus {
    Down,
    ConnectedNoInternet,
    Online,
    ActiveTransmitting,
    FailedOver
};

struct NetworkInterfaceLink {
    QString id;
    QString name;             // Ex: "Ethernet Realtek", "Wi-Fi Intel AX211", "USB 5G Modem"
    QString localIp;          // Ex: "192.168.1.10", "192.168.15.42"
    QString gateway;
    bool isPrimary = false;
    bool enabled = true;
    bool metered = false;     // Conexão com franquia (4G/5G)
    InterfaceStatus status = InterfaceStatus::Down;
    float currentBitrateMbps = 0.0f;
    float packetLossPercent = 0.0f;
    uint32_t rttMs = 0;
    uint64_t bytesSent = 0;
};

struct BondingRelayConfig {
    QString serverAddress;    // IP ou hostname do receptor / relay RIST/SRT
    uint16_t port = 4000;
    QString protocol = "rist"; // "rist" ou "srt_group"
    QString secretPassphrase;
    uint32_t bufferLatencyMs = 800; // Janela de buffer de recomposição de pacotes
    bool adaptiveBitrate = true;
};

/**
 * @brief NetworkBondingManager gerencia a transmissão Multi-WAN por múltiplos adaptadores físicos.
 * Implementa modos Main+Backup, Redundância Simultânea e Agregação de Capacidade via libRIST / SRT Groups.
 */
class NetworkBondingManager : public QObject {
    Q_OBJECT

public:
    explicit NetworkBondingManager(QObject *parent = nullptr);
    ~NetworkBondingManager() override;

    bool initialize();
    void shutdown();

    void scanNetworkInterfaces();
    const QVector<NetworkInterfaceLink>& interfaces() const { return m_interfaces; }

    void setBondingMode(BondingMode mode);
    BondingMode bondingMode() const { return m_mode; }

    void setRelayConfig(const BondingRelayConfig &config);
    const BondingRelayConfig& relayConfig() const { return m_config; }

    bool startProtectedStream(const QString &sourceFeed);
    void stopProtectedStream();
    bool isStreaming() const { return m_isStreaming; }

    // Métricas consolidadas
    float totalBitrateMbps() const;
    float effectivePacketLoss() const;
    uint32_t averageLatencyMs() const;

signals:
    void interfaceStatusChanged(const QString &ifaceId, InterfaceStatus status);
    void metricsUpdated();
    void failoverTriggered(const QString &fromIface, const QString &toIface);

private slots:
    void onMonitorTick();

private:
    BondingMode m_mode = BondingMode::SimultaneousBackup;
    BondingRelayConfig m_config;
    QVector<NetworkInterfaceLink> m_interfaces;
    bool m_isStreaming = false;

    QTimer *m_monitorTimer = nullptr;
    void balanceTraffic();
};

} // namespace freemix

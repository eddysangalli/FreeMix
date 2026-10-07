#pragma once

#include <QObject>
#include <QString>
#include <QMap>
#include <QVector>

class FreeMixPlugin;

struct CallGuest {
    QString id;
    QString name;
    QString callId;
    QString sourceName;
    QString videoSourceName;
    QString audioSourceName;
    QString returnVideoSource;
    QString returnAudioBus;
    bool connected = false;
    bool inProgram = false;
    bool inPreview = false;
    bool videoEnabled = true;
    bool audioEnabled = true;
    bool returnVideoEnabled = true;
    bool returnAudioEnabled = true;
    float returnVideoVolume = 1.0f;
    float returnAudioVolume = 1.0f;
    QString connectionState;
    QString qualityProfile;
    qint64 lastStatsUpdate = 0;
    QMap<QString, QVariant> stats;
};

struct CallSettings {
    QString defaultReturnVideo = "PROGRAM";
    QString defaultReturnAudioBus = "Aux A";
    QString qualityProfile = "auto";
    bool enableTalkback = true;
    float talkbackDuckLevel = 0.3f;
};

class VDONinjaIntegration : public QObject
{
    Q_OBJECT

public:
    explicit VDONinjaIntegration(FreeMixPlugin* plugin, QObject* parent = nullptr);
    ~VDONinjaIntegration() override;

    bool initialize();
    void shutdown();

    bool isAvailable() const;
    QString generateCallId(const QString& prefix = "fm");
    QString getViewUrl(const QString& callId, bool cleanOutput = true);
    QString getGuestUrl(const QString& callId, const QString& label = "Convidado");
    QString getGuestReturnUrl(const QString& callId, const QString& label = "Convidado");
    QString getReturnUrl(const QString& callId, const QString& label = "Programa");
    bool createBrowserSourceForCall(const QString& callId, const QString& sourceName, int width = 1920, int height = 1080);
    bool startCall(const QString& callId);
    bool stopCall(const QString& callId);

    bool createCall(const QString& callId, const QString& guestName, const QString& returnVideoSource = "PROGRAM");
    bool removeCall(const QString& callId);
    CallGuest* getCall(const QString& callId);
    QVector<CallGuest*> getAllCalls() const;
    bool setGuestReturnVideo(const QString& callId, const QString& videoSource);
    bool setGuestReturnAudioBus(const QString& callId, const QString& audioBus);
    bool setGuestInProgram(const QString& callId, bool inProgram);
    bool setGuestInPreview(const QString& callId, bool inPreview);
    bool setGuestVideoEnabled(const QString& callId, bool enabled);
    bool setGuestAudioEnabled(const QString& callId, bool enabled);
    bool setGuestReturnVideoEnabled(const QString& callId, bool enabled);
    bool setGuestReturnAudioEnabled(const QString& callId, bool enabled);
    bool setGuestReturnVolumes(const QString& callId, float videoVol, float audioVol);
    bool updateGuestConnectionState(const QString& callId, const QString& state);
    bool updateGuestStats(const QString& callId, const QMap<QString, QVariant>& stats);
    CallSettings settings() const { return m_settings; }
    void setSettings(const CallSettings& settings);

    bool createReturnVideoSource(const QString& callId, const QString& videoSource);
    bool createReturnAudioSource(const QString& callId, const QString& audioBus);
    void removeReturnSources(const QString& callId);

    bool sendTalkback(const QString& callId, bool enable, float duckLevel = 0.3f);
    bool sendTalkbackToAll(bool enable, float duckLevel = 0.3f);
    bool sendTalkbackToGroup(const QStringList& callIds, bool enable, float duckLevel = 0.3f);

signals:
    void availabilityChanged(bool available);
    void callCreated(const QString& callId, const QString& sourceName);
    void callStarted(const QString& callId);
    void callStopped(const QString& callId);
    void callRemoved(const QString& callId);
    void guestConnected(const QString& callId);
    void guestDisconnected(const QString& callId);
    void guestStateChanged(const QString& callId, const QString& state);
    void guestStatsUpdated(const QString& callId, const QMap<QString, QVariant>& stats);
    void returnVideoSourceChanged(const QString& callId, const QString& videoSource);
    void returnAudioBusChanged(const QString& callId, const QString& audioBus);
    void talkbackStateChanged(const QString& callId, bool active);

private:
    FreeMixPlugin* m_plugin;
    bool m_available = true;
    QMap<QString, CallGuest> m_calls;
    CallSettings m_settings;

    QString generateRandomId(int length = 12);
    QString generateReturnVideoSourceName(const QString& callId) const;
    QString generateReturnAudioSourceName(const QString& callId) const;
};

#include "DownstreamKeyerIntegration.h"
#include "FreeMixPlugin.h"

#include <obs-frontend-api.h>
#include <obs.h>
#include <util/base.h>

DownstreamKeyerIntegration::DownstreamKeyerIntegration(FreeMixPlugin* plugin, QObject* parent)
    : QObject(parent), m_plugin(plugin)
{
}

DownstreamKeyerIntegration::~DownstreamKeyerIntegration()
{
    shutdown();
}

bool DownstreamKeyerIntegration::initialize()
{
    m_available = callVendor("get_downstream_keyers", {}, nullptr);
    if (m_available) {
        blog(LOG_INFO, "[FreeMix] Downstream Keyer available");
        updateKeyerList();
    } else {
        blog(LOG_WARNING, "[FreeMix] Downstream Keyer not available");
    }
    emit availabilityChanged(m_available);
    return m_available;
}

void DownstreamKeyerIntegration::shutdown()
{
    m_available = false;
}

bool DownstreamKeyerIntegration::isAvailable() const
{
    return m_available;
}

int DownstreamKeyerIntegration::getKeyerCount() const
{
    return 4;
}

QString DownstreamKeyerIntegration::getKeyerName(int index) const
{
    if (index < 0 || index >= 4) return QString();
    return QString("DSK %1").arg(index + 1);
}

QString DownstreamKeyerIntegration::getKeyerScene(int index) const
{
    QVariantMap response;
    if (callVendor("dsk_get_scene", {{"dsk_name", getKeyerName(index)}}, &response)) {
        return response.value("scene").toString();
    }
    return QString();
}

bool DownstreamKeyerIntegration::setKeyerScene(int index, const QString& sceneName)
{
    if (!m_available) return false;

    QString keyerName = getKeyerName(index);
    QVariantMap response;

    if (sceneName.isEmpty()) {
        return clearKeyerScene(index);
    }

    if (!callVendor("dsk_add_scene", {{"dsk_name", keyerName, "scene", sceneName}}, &response)) {
        return false;
    }

    if (!response.value("success", false).toBool()) {
        return false;
    }

    return callVendor("dsk_select_scene", {{"dsk_name", keyerName, "scene", sceneName}}, &response);
}

bool DownstreamKeyerIntegration::clearKeyerScene(int index)
{
    if (!m_available) return false;

    QString keyerName = getKeyerName(index);
    QVariantMap response;

    return callVendor("dsk_select_scene", {{"dsk_name", keyerName, "scene", ""}}, &response);
}

bool DownstreamKeyerIntegration::toggleKeyer(int index)
{
    QString currentScene = getKeyerScene(index);
    if (currentScene.isEmpty()) {
        return false;
    }
    return clearKeyerScene(index);
}

bool DownstreamKeyerIntegration::callVendor(const QString& requestType, const QVariantMap& data, QVariantMap* response)
{
    obs_data_t* requestData = obs_data_create();

    for (auto it = data.constBegin(); it != data.constEnd(); ++it) {
        const QString& key = it.key();
        const QVariant& value = it.value();

        if (value.type() == QVariant::String) {
            obs_data_set_string(requestData, key.toUtf8().constData(), value.toString().toUtf8().constData());
        } else if (value.type() == QVariant::Int) {
            obs_data_set_int(requestData, key.toUtf8().constData(), value.toInt());
        } else if (value.type() == QVariant::Bool) {
            obs_data_set_bool(requestData, key.toUtf8().constData(), value.toBool());
        }
    }

    obs_data_t* result = obs_frontend_call_vendor_request(m_vendorName.toUtf8().constData(),
                                                          requestType.toUtf8().constData(),
                                                          requestData);
    obs_data_release(requestData);

    if (!result) return false;

    if (response) {
        const char* json = obs_data_get_json(result);
        if (json) {
            QJsonDocument doc = QJsonDocument::fromJson(json);
            if (!doc.isNull() && doc.isObject()) {
                *response = doc.object().toVariantMap();
            }
        }
    }

    obs_data_release(result);
    return true;
}

void DownstreamKeyerIntegration::updateKeyerList()
{
    emit keyersUpdated();
}
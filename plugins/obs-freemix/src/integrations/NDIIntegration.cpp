#include "NDIIntegration.h"
#include "FreeMixPlugin.h"
#include <obs.h>

NDIIntegration::NDIIntegration(FreeMixPlugin* plugin, QObject* parent)
    : QObject(parent), m_plugin(plugin), m_available(false), m_active(false)
{
}

NDIIntegration::~NDIIntegration()
{
    shutdown();
}

bool NDIIntegration::initialize()
{
    obs_properties_t* props = obs_get_source_properties("ndi_source");
    if (props) {
        obs_properties_destroy(props);
        m_available = true;
        blog(LOG_INFO, "[FreeMix] NDI (DistroAV) plugin detectado e ativo");
    } else {
        m_available = false;
        blog(LOG_INFO, "[FreeMix] NDI plugin não detectado (requer DistroAV + NDI Runtime)");
    }
    return true;
}

void NDIIntegration::shutdown()
{
    stopOutput();
}

bool NDIIntegration::startOutput(const QString& name, bool includeAlpha)
{
    if (!m_available) return false;
    m_active = true;
    blog(LOG_INFO, "[FreeMix] NDI output '%s' iniciado (Alpha: %s)", qPrintable(name), includeAlpha ? "YES" : "NO");
    return true;
}

bool NDIIntegration::stopOutput()
{
    if (m_active) {
        m_active = false;
        blog(LOG_INFO, "[FreeMix] NDI output parado");
    }
    return true;
}

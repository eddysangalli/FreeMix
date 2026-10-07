#include "OMTIntegration.h"
#include "FreeMixPlugin.h"
#include <obs.h>

OMTIntegration::OMTIntegration(FreeMixPlugin* plugin, QObject* parent)
    : QObject(parent), m_plugin(plugin), m_available(false), m_active(false)
{
}

OMTIntegration::~OMTIntegration()
{
    shutdown();
}

bool OMTIntegration::initialize()
{
    obs_properties_t* props = obs_get_source_properties("omt_source");
    if (props) {
        obs_properties_destroy(props);
        m_available = true;
        blog(LOG_INFO, "[FreeMix] OMT plugin oficial detectado e ativo");
    } else {
        m_available = false;
        blog(LOG_INFO, "[FreeMix] OMT plugin não detectado");
    }
    return true;
}

void OMTIntegration::shutdown()
{
    stopOutput();
}

bool OMTIntegration::startOutput(const QString& endpoint)
{
    if (!m_available) return false;
    m_active = true;
    blog(LOG_INFO, "[FreeMix] OMT output conectado em '%s'", qPrintable(endpoint));
    return true;
}

bool OMTIntegration::stopOutput()
{
    if (m_active) {
        m_active = false;
        blog(LOG_INFO, "[FreeMix] OMT output parado");
    }
    return true;
}

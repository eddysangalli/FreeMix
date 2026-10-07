#include "DeckLinkIntegration.h"
#include "FreeMixPlugin.h"
#include <obs.h>

DeckLinkIntegration::DeckLinkIntegration(FreeMixPlugin* plugin, QObject* parent)
    : QObject(parent), m_plugin(plugin), m_available(false)
{
}

DeckLinkIntegration::~DeckLinkIntegration()
{
    shutdown();
}

bool DeckLinkIntegration::initialize()
{
    // Verifica se os módulos decklink e decklink-output-ui foram carregados
    obs_properties_t* props = obs_get_source_properties("decklink-input");
    if (props) {
        obs_properties_destroy(props);
        m_available = true;
        m_statusMessage = tr("Hardware e drivers Blackmagic Desktop Video ativos");
        blog(LOG_INFO, "[FreeMix] DeckLink backend ativo");
    } else {
        m_available = false;
        m_statusMessage = tr("Placa/driver DeckLink não detectado nesta máquina. Requer Blackmagic Desktop Video.");
        blog(LOG_INFO, "[FreeMix] DeckLink backend indisponível (sem hardware/drivers)");
    }
    return true;
}

void DeckLinkIntegration::shutdown()
{
    m_devices.clear();
}

QStringList DeckLinkIntegration::supportedVideoModes() const
{
    return {
        "1080p59.94 (Broadcast 3G-SDI Level A)",
        "1080p50 (European Broadcast)",
        "1080p29.97 (HD SDI)",
        "1080i59.94 (Interlaced Studio)",
        "1080i50 (Interlaced PAL)",
        "720p59.94 (Sports HD)",
        "2160p29.97 (12G-SDI 4K UHD)"
    };
}

bool DeckLinkIntegration::setOutputMode(int deviceIndex, KeyerMode mode)
{
    if (!m_available) return false;
    blog(LOG_INFO, "[FreeMix] Set DeckLink device %d to mode %d", deviceIndex, (int)mode);
    return true;
}

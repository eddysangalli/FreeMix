#include "FreeMixPlugin.h"

#include <obs-module.h>
#include <obs-frontend-api.h>
#include <QApplication>
#include <QCoreApplication>

#define BLOG_PREFIX "[obs-freemix] "

OBS_DECLARE_MODULE()
OBS_MODULE_USE_DEFAULT_LOCALE("obs-freemix", "en-US")
MODULE_EXPORT const char* obs_module_description(void)
{
    return "FreeMix Native Plugin - Broadcast switcher UI and integrations for OBS Studio";
}

static FreeMixPlugin* g_plugin = nullptr;

extern "C" bool obs_module_load(void)
{
    blog(LOG_INFO, BLOG_PREFIX "Loading FreeMix native plugin v0.2.0");

    if (!obs_frontend_api_available()) {
        blog(LOG_ERROR, BLOG_PREFIX "OBS frontend API not available");
        return false;
    }

    if (!QCoreApplication::instance()) {
        int argc = 0;
        char* argv[] = { nullptr };
        new QApplication(argc, argv);
    }

    g_plugin = new FreeMixPlugin();
    if (!g_plugin->initialize()) {
        delete g_plugin;
        g_plugin = nullptr;
        return false;
    }

    return true;
}

extern "C" void obs_module_unload(void)
{
    blog(LOG_INFO, BLOG_PREFIX "Unloading FreeMix native plugin");

    if (g_plugin) {
        g_plugin->shutdown();
        delete g_plugin;
        g_plugin = nullptr;
    }
}

extern "C" void obs_module_post_load(void)
{
    blog(LOG_INFO, BLOG_PREFIX "FreeMix native plugin post-load");
}
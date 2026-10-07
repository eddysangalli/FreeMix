#include "SourceRecordIntegration.h"
#include "FreeMixPlugin.h"

#include <obs-frontend-api.h>
#include <obs.h>
#include <util/base.h>

SourceRecordIntegration::SourceRecordIntegration(FreeMixPlugin* plugin, QObject* parent)
    : QObject(parent), m_plugin(plugin)
{
}

SourceRecordIntegration::~SourceRecordIntegration()
{
    shutdown();
}

bool SourceRecordIntegration::initialize()
{
    const char* filterKinds = obs_get_source_filter_kind_list();
    if (filterKinds && strstr(filterKinds, "source_record_filter")) {
        m_available = true;
        blog(LOG_INFO, "[FreeMix] Source Record filter found");
    } else {
        m_available = false;
        blog(LOG_WARNING, "[FreeMix] Source Record filter not available");
    }
    emit availabilityChanged(m_available);
    return m_available;
}

void SourceRecordIntegration::shutdown()
{
    m_available = false;
}

bool SourceRecordIntegration::isAvailable() const
{
    return m_available;
}

bool SourceRecordIntegration::findFilter(const QString& sceneName)
{
    obs_source_t* source = obs_get_source_by_name(sceneName.toUtf8().constData());
    if (!source) return false;

    obs_source_t* filter = obs_source_get_filter_by_name(source, m_filterName.toUtf8().constData());
    bool found = filter != nullptr;
    if (filter) obs_source_release(filter);
    obs_source_release(source);
    return found;
}

bool SourceRecordIntegration::createFilter(const QString& sceneName, const QString& outputPath)
{
    obs_source_t* source = obs_get_source_by_name(sceneName.toUtf8().constData());
    if (!source) return false;

    obs_data_t* settings = obs_data_create();
    obs_data_set_string(settings, "path", outputPath.toUtf8().constData());
    obs_data_set_string(settings, "filename_formatting",
                        QString("%1 %%CCYY-%%MM-%%DD %%hh-%%mm-%%ss").arg(sceneName).toUtf8().constData());
    obs_data_set_int(settings, "record_mode", 1);

    obs_source_t* filter = obs_source_create("source_record_filter", m_filterName.toUtf8().constData(), settings, nullptr);
    bool success = false;
    if (filter) {
        success = obs_source_filter_add(source, filter);
        obs_source_release(filter);
    }

    obs_data_release(settings);
    obs_source_release(source);
    return success;
}

bool SourceRecordIntegration::updateFilterSettings(const QString& sceneName, const QString& outputPath)
{
    obs_source_t* source = obs_get_source_by_name(sceneName.toUtf8().constData());
    if (!source) return false;

    obs_source_t* filter = obs_source_get_filter_by_name(source, m_filterName.toUtf8().constData());
    bool success = false;
    if (filter) {
        obs_data_t* settings = obs_data_create();
        obs_data_set_string(settings, "path", outputPath.toUtf8().constData());
        obs_data_set_string(settings, "filename_formatting",
                            QString("%1 %%CCYY-%%MM-%%DD %%hh-%%mm-%%ss").arg(sceneName).toUtf8().constData());
        obs_data_set_int(settings, "record_mode", 1);
        success = obs_source_update(filter, settings);
        obs_data_release(settings);
        obs_source_release(filter);
    }
    obs_source_release(source);
    return success;
}

void SourceRecordIntegration::removeFilter(const QString& sceneName)
{
    obs_source_t* source = obs_get_source_by_name(sceneName.toUtf8().constData());
    if (!source) return;

    obs_source_t* filter = obs_source_get_filter_by_name(source, m_filterName.toUtf8().constData());
    if (filter) {
        obs_source_filter_remove(source, filter);
        obs_source_release(filter);
    }
    obs_source_release(source);
}

bool SourceRecordIntegration::startISORecording(const QString& sceneName, const QString& outputPath)
{
    if (!m_available) {
        emit recordingError(sceneName, tr("Source Record filter not available"));
        return false;
    }

    if (findFilter(sceneName)) {
        return updateFilterSettings(sceneName, outputPath);
    } else {
        return createFilter(sceneName, outputPath);
    }
}

bool SourceRecordIntegration::stopISORecording(const QString& sceneName)
{
    if (!m_available) return false;

    obs_source_t* source = obs_get_source_by_name(sceneName.toUtf8().constData());
    if (!source) return false;

    obs_source_t* filter = obs_source_get_filter_by_name(source, m_filterName.toUtf8().constData());
    bool success = false;
    if (filter) {
        obs_data_t* settings = obs_data_create();
        obs_data_set_int(settings, "record_mode", 0);
        success = obs_source_update(filter, settings);
        obs_data_release(settings);
        obs_source_release(filter);
    }
    obs_source_release(source);
    return success;
}

bool SourceRecordIntegration::isRecording(const QString& sceneName) const
{
    if (!m_available) return false;

    obs_source_t* source = obs_get_source_by_name(sceneName.toUtf8().constData());
    if (!source) return false;

    obs_source_t* filter = obs_source_get_filter_by_name(source, m_filterName.toUtf8().constData());
    bool recording = false;
    if (filter) {
        obs_data_t* settings = obs_source_get_settings(filter);
        int mode = obs_data_get_int(settings, "record_mode");
        recording = (mode == 1);
        obs_data_release(settings);
        obs_source_release(filter);
    }
    obs_source_release(source);
    return recording;
}

QStringList SourceRecordIntegration::getRecordingScenes() const
{
    QStringList scenes;
    if (!m_available) return scenes;

    obs_source_t* sources = obs_enum_sources();
    // This would need proper enumeration in a real implementation
    // Simplified for now
    return scenes;
}
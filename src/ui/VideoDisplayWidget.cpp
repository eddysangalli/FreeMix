#include "VideoDisplayWidget.h"
#include <QPainter>
#include <QResizeEvent>

VideoDisplayWidget::VideoDisplayWidget(QWidget *parent)
    : QWidget(parent)
{
    setAttribute(Qt::WA_PaintOnScreen, true);
    setAttribute(Qt::WA_StaticContents, true);
    setAttribute(Qt::WA_OpaquePaintEvent, true);
    setAttribute(Qt::WA_NoSystemBackground, true);
}

VideoDisplayWidget::~VideoDisplayWidget()
{
    if (m_display) {
        obs_display_destroy(m_display);
        m_display = nullptr;
    }
}

void VideoDisplayWidget::showEvent(QShowEvent *event)
{
    QWidget::showEvent(event);

    if (!m_initialized && winId()) {
        gs_init_data init_data = {};
        init_data.cx = width();
        init_data.cy = height();
        init_data.format = GS_RGBA;
        init_data.zsformat = GS_ZS_NONE;
        init_data.window.hwnd = (HWND)winId();

        m_display = obs_display_create(&init_data, 0x00000000);
        if (m_display) {
            obs_display_add_draw_callback(m_display, renderCallback, this);
            m_initialized = true;
        }
    }
}

void VideoDisplayWidget::resizeEvent(QResizeEvent *event)
{
    QWidget::resizeEvent(event);
    if (m_display) {
        obs_display_resize(m_display, event->size().width(), event->size().height());
    }
}

void VideoDisplayWidget::paintEvent(QPaintEvent *event)
{
    // Se o display da libobs ainda não estiver inicializado, pinta o fundo preto
    if (!m_display) {
        QPainter painter(this);
        painter.fillRect(rect(), QColor(10, 14, 20));
    }
}

void VideoDisplayWidget::setSource(obs_source_t *source)
{
    m_source = source;
}

void VideoDisplayWidget::renderCallback(void *data, uint32_t cx, uint32_t cy)
{
    auto *widget = static_cast<VideoDisplayWidget*>(data);
    if (!widget || !widget->m_source) return;

    obs_source_video_render(widget->m_source);
}

#pragma once

#include <QWidget>
#include <obs.h>

/**
 * @brief VideoDisplayWidget hospeda a renderização de vídeo acelerada por hardware da libobs.
 */
class VideoDisplayWidget : public QWidget {
    Q_OBJECT

public:
    explicit VideoDisplayWidget(QWidget *parent = nullptr);
    ~VideoDisplayWidget() override;

    void setSource(obs_source_t *source);
    obs_source_t* source() const { return m_source; }

protected:
    void paintEvent(QPaintEvent *event) override;
    void resizeEvent(QResizeEvent *event) override;
    void showEvent(QShowEvent *event) override;

private:
    static void renderCallback(void *data, uint32_t cx, uint32_t cy);

    obs_display_t *m_display = nullptr;
    obs_source_t *m_source = nullptr;
    bool m_initialized = false;
};

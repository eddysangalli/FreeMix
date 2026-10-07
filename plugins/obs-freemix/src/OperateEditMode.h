#pragma once

#include <QObject>

class FreeMixPlugin;

class OperateEditMode : public QObject
{
    Q_OBJECT

public:
    explicit OperateEditMode(FreeMixPlugin* plugin, QObject* parent = nullptr);
    ~OperateEditMode() override;

    bool initialize();
    void shutdown();

    bool isEditMode() const;
    void setEditMode(bool editMode);
    void toggleMode();

signals:
    void modeChanged(bool editMode);

private:
    FreeMixPlugin* m_plugin;
    bool m_editMode = false;

    void applyModeToUI();
    void applyModeToSceneItems();
};
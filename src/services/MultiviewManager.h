#pragma once

#include <QObject>
#include <QString>
#include <QStringList>
#include <QVector>

class FreeMixPlugin;

enum class MultiviewLayout {
    Layout2x4, // 8 canais + PGM/PVW
    Layout3x3, // 9 canais
    Layout4x4, // 16 canais (Mosaico Completo)
    LayoutMasterFocus // PGM grande + 4 entradas
};

class MultiviewManager : public QObject
{
    Q_OBJECT

public:
    explicit MultiviewManager(FreeMixPlugin* plugin, QObject* parent = nullptr);
    ~MultiviewManager() override;

    bool initialize();
    void shutdown();

    MultiviewLayout currentLayout() const { return m_layout; }
    void setLayout(MultiviewLayout layout);

    bool isTallyEnabled() const { return m_tallyEnabled; }
    void setTallyEnabled(bool enabled);

    bool areMetersEnabled() const { return m_metersEnabled; }
    void setMetersEnabled(bool enabled);

    QStringList slotAssignments() const { return m_slots; }
    void assignSlot(int slotIndex, const QString& sourceOrSceneName);

signals:
    void layoutChanged(MultiviewLayout layout);
    void slotUpdated(int slotIndex, const QString& sourceName);

private:
    FreeMixPlugin* m_plugin;
    MultiviewLayout m_layout = MultiviewLayout::Layout2x4;
    bool m_tallyEnabled = true;
    bool m_metersEnabled = true;
    QStringList m_slots;
};

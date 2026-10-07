#pragma once

#include <QDialog>
#include <QListWidget>
#include <QStackedWidget>
#include <QPushButton>
#include <QLineEdit>
#include <QSpinBox>
#include <QComboBox>
#include <QFormLayout>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QLabel>
#include <QMap>
#include <QVariant>

class FreeMixPlugin;

struct InputTypeInfo {
    QString id;
    QString label;
    QString kind;
    QString hint;
    QMap<QString, QVariant> fields;
    bool special = false;
};

class AddInputDialog : public QDialog
{
    Q_OBJECT

public:
    explicit AddInputDialog(FreeMixPlugin* plugin = nullptr, QWidget* parent = nullptr);
    ~AddInputDialog() override;

    QString getInputName() const;
    QString getInputTypeId() const;
    int getInputCount() const;
    QMap<QString, QVariant> getFieldValues() const;

signals:
    void inputCreated(const QString& name, const QString& typeId, int count, const QMap<QString, QVariant>& fields);

private:
    FreeMixPlugin* m_plugin;
    QListWidget* m_typeList = nullptr;
    QStackedWidget* m_formStack = nullptr;
    QLineEdit* m_nameEdit = nullptr;
    QSpinBox* m_countSpin = nullptr;
    QPushButton* m_okButton = nullptr;
    QPushButton* m_cancelButton = nullptr;
    QMap<QString, InputTypeInfo> m_types;
    QMap<QString, QWidget*> m_formWidgets;

    void setupTypes();
    void setupUI();
    void createFormForType(const QString& typeId);
    void onTypeSelected(QListWidgetItem* current, QListWidgetItem* previous);
    void onOkClicked();
    void updateOkButtonState();
};
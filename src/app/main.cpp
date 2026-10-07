#include "FreeMixApp.h"
#include "ui/FreeMixMainWindow.h"

#include <QMessageBox>

int main(int argc, char *argv[])
{
    // Habilita renderização de alta resolução e DPI scaling
    QApplication::setHighDpiScaleFactorRoundingPolicy(Qt::HighDpiScaleFactorRoundingPolicy::PassThrough);

    FreeMixApp app(argc, argv);

    // Inicializa o motor de mídia nativo (libobs)
    if (!app.initializeEngine()) {
        QMessageBox::critical(nullptr, "Erro Fatal",
            "Não foi possível inicializar o motor de vídeo libobs.\n"
            "Verifique se os drivers de vídeo e Direct3D 11 estão disponíveis.");
        return 1;
    }

    // Instancia e exibe a janela principal de produção do FreeMix Studio
    FreeMixMainWindow mainWindow;
    mainWindow.showMaximized();

    return app.exec();
}

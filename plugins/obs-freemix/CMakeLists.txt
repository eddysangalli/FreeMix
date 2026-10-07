cmake_minimum_required(VERSION 3.16)
project(obs-freemix VERSION 0.2.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(CMAKE_SYSTEM_NAME STREQUAL "Windows")
    add_compile_definitions(WIN32 _WINDLL NOMINMAX)
    set(CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS ON)
endif()

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake")

find_package(Qt6 REQUIRED COMPONENTS Core Widgets Gui WebEngineWidgets)
find_package(OBS REQUIRED)

include(GNUInstallDirs)

set(FREEMIX_PLUGIN_NAME "obs-freemix")
set(FREEMIX_LIBRARY_NAME "${FREEMIX_PLUGIN_NAME}")

add_library(${FREEMIX_LIBRARY_NAME} MODULE
    src/obs-freemix.cpp
    src/FreeMixPlugin.cpp
    src/FreeMixPlugin.h
    src/menus/FreeMixMenuBar.cpp
    src/menus/FreeMixMenuBar.h
    src/dialogs/AddInputDialog.cpp
    src/dialogs/AddInputDialog.h
    src/dialogs/InputPropertiesDialog.cpp
    src/dialogs/InputPropertiesDialog.h
    src/dialogs/GeneralSettingsDialog.cpp
    src/dialogs/GeneralSettingsDialog.h
    src/dialogs/ModuleSettingsDialog.cpp
    src/dialogs/ModuleSettingsDialog.h
    src/dialogs/OutputsDialog.cpp
    src/dialogs/OutputsDialog.h
    src/integrations/SourceRecordIntegration.cpp
    src/integrations/SourceRecordIntegration.h
    src/integrations/ReplaySourceIntegration.cpp
    src/integrations/ReplaySourceIntegration.h
    src/integrations/DownstreamKeyerIntegration.cpp
    src/integrations/DownstreamKeyerIntegration.h
    src/integrations/VDONinjaIntegration.cpp
    src/integrations/VDONinjaIntegration.h
    src/integrations/DeckLinkIntegration.cpp
    src/integrations/DeckLinkIntegration.h
    src/integrations/NDIIntegration.cpp
    src/integrations/NDIIntegration.h
    src/integrations/OMTIntegration.cpp
    src/integrations/OMTIntegration.h
    src/integrations/OutputManager.cpp
    src/integrations/OutputManager.h
    src/integrations/AudioBusManager.cpp
    src/integrations/AudioBusManager.h
    src/integrations/CanvasMixManager.cpp
    src/integrations/CanvasMixManager.h
    src/integrations/MultiviewManager.cpp
    src/integrations/MultiviewManager.h
    src/FreeMixDock.cpp
    src/FreeMixDock.h
    src/OperateEditMode.cpp
    src/OperateEditMode.h
)

target_include_directories(${FREEMIX_LIBRARY_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${OBS_INCLUDE_DIRS}
)

target_link_libraries(${FREEMIX_LIBRARY_NAME} PRIVATE
    Qt6::Core
    Qt6::Widgets
    Qt6::Gui
    ${OBS_LIBRARIES}
)

target_compile_definitions(${FREEMIX_LIBRARY_NAME} PRIVATE
    FREEMIX_PLUGIN_EXPORTS
    QT_NO_DEBUG_OUTPUT
)

if(CMAKE_SYSTEM_NAME STREQUAL "Windows")
    target_link_libraries(${FREEMIX_LIBRARY_NAME} PRIVATE
        user32
        shell32
        ole32
        uuid
    )
endif()

set_target_properties(${FREEMIX_LIBRARY_NAME} PROPERTIES
    OUTPUT_NAME "${FREEMIX_PLUGIN_NAME}"
    PREFIX ""
    SUFFIX ".dll"
)

install(TARGETS ${FREEMIX_LIBRARY_NAME}
    LIBRARY DESTINATION "${CMAKE_INSTALL_LIBDIR}/obs-plugins"
)

install(FILES
    resources/obs-freemix.json
    DESTINATION "${CMAKE_INSTALL_DATADIR}/obs/obs-plugins"
)

install(DIRECTORY resources/locale/
    DESTINATION "${CMAKE_INSTALL_DATADIR}/obs/obs-plugins/obs-freemix/locale"
)
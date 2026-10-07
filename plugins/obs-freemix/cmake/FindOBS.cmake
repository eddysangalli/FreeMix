# FindOBS.cmake - Find OBS Studio libraries and includes
# This module finds the OBS Studio installation and sets up the necessary variables

set(OBS_ROOT_DIR "" CACHE PATH "Path to OBS Studio installation root")

if(OBS_ROOT_DIR)
    set(OBS_SEARCH_PATHS
        ${OBS_ROOT_DIR}
        ${OBS_ROOT_DIR}/../obs-studio
        "C:/Program Files/obs-studio"
        "C:/Program Files (x86)/obs-studio"
        "/usr/local"
        "/usr"
    )
else()
    set(OBS_SEARCH_PATHS
        "C:/Program Files/obs-studio"
        "C:/Program Files (x86)/obs-studio"
        ${CMAKE_SOURCE_DIR}/../../obs-vmix/data
        ${CMAKE_SOURCE_DIR}/../obs-vmix/data
        "/usr/local"
        "/usr"
    )
endif()

find_path(OBS_INCLUDE_DIR
    NAMES obs-frontend-api.h
    PATHS ${OBS_SEARCH_PATHS}
    PATH_SUFFIXES include libobs include/obs
    DOC "OBS Studio include directory"
)

find_library(OBS_LIBRARY
    NAMES obs libobs
    PATHS ${OBS_SEARCH_PATHS}
    PATH_SUFFIXES lib bin 64bit
    DOC "OBS Studio library"
)

find_library(OBS_FRONTEND_LIBRARY
    NAMES obs-frontend-api
    PATHS ${OBS_SEARCH_PATHS}
    PATH_SUFFIXES lib bin 64bit
    DOC "OBS Frontend API library"
)

find_library(OBS_OUTPUTS_LIBRARY
    NAMES obs-outputs
    PATHS ${OBS_SEARCH_PATHS}
    PATH_SUFFIXES lib bin 64bit
    DOC "OBS Outputs library"
)

find_library(OBS_ENCODER_LIBRARY
    NAMES obs-encoder
    PATHS ${OBS_SEARCH_PATHS}
    PATH_SUFFIXES lib bin 64bit
    DOC "OBS Encoder library"
)

if(OBS_INCLUDE_DIR AND OBS_LIBRARY)
    set(OBS_FOUND TRUE)
    set(OBS_INCLUDE_DIRS ${OBS_INCLUDE_DIR})
    set(OBS_LIBRARIES
        ${OBS_LIBRARY}
        ${OBS_FRONTEND_LIBRARY}
        ${OBS_OUTPUTS_LIBRARY}
        ${OBS_ENCODER_LIBRARY}
    )

    if(NOT TARGET OBS::obs)
        add_library(OBS::obs INTERFACE IMPORTED)
        set_target_properties(OBS::obs PROPERTIES
            INTERFACE_INCLUDE_DIRECTORIES "${OBS_INCLUDE_DIRS}"
            INTERFACE_LINK_LIBRARIES "${OBS_LIBRARIES}"
        )
    endif()

    message(STATUS "Found OBS Studio: ${OBS_INCLUDE_DIR}")
else()
    set(OBS_FOUND FALSE)
    message(WARNING "OBS Studio not found. Set OBS_ROOT_DIR to the OBS installation path.")
endif()

mark_as_advanced(OBS_INCLUDE_DIR OBS_LIBRARY OBS_FRONTEND_LIBRARY OBS_OUTPUTS_LIBRARY OBS_ENCODER_LIBRARY)
@echo off
call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat" >nul
cl /nologo /std:c++17 /EHsc /MD /LD /O2 /DWIN32 /D_WINDOWS /I"freemix-app\libobs" /I"freemix-app\build_2026\config" /I"freemix-app\plugins\obs-websocket\lib" qa-finalizacao\replay-sincronia-native\qa-pcm-probe.cpp /Foqa-finalizacao\replay-sincronia-native\qa-pcm-probe.obj /link /LIBPATH:"freemix-app\build_2026\libobs\RelWithDebInfo" obs.lib /OUT:qa-finalizacao\replay-sincronia-native\qa-replay-pcm.dll /IMPLIB:qa-finalizacao\replay-sincronia-native\qa-replay-pcm.lib

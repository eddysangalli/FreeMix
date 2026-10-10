@echo off
call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat" >nul
cl /nologo /std:c++17 /EHsc /MD /LD /O2 /DWIN32 /D_WINDOWS /I"freemix-app\libobs" /I"freemix-app\build_2026\config" /I"freemix-app\plugins\obs-websocket\lib" qa-finalizacao\replay-master-four\qa-master-probe.cpp /Foqa-finalizacao\replay-master-four\qa-master-probe.obj /link /LIBPATH:"qa-finalizacao\replay-master-four\build-deps" obs.lib /OUT:qa-finalizacao\replay-master-four\qa-master-four.dll /IMPLIB:qa-finalizacao\replay-master-four\qa-master-four.lib

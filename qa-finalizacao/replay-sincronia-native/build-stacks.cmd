@echo off
call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat" >nul
cl /nologo /std:c++17 /EHsc /O2 qa-finalizacao\native-thread-stacks.cpp /Foqa-finalizacao\replay-sincronia-native\qa-native-stacks.obj /Feqa-finalizacao\replay-sincronia-native\qa-native-stacks.exe /link dbghelp.lib

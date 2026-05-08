@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d C:\Users\itsab\Desktop\waleed\BioScan--Flora-and-Fin-main
"C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install
if errorlevel 1 exit /b 1
"C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build
if errorlevel 1 exit /b 1
echo BUILD_COMPLETE

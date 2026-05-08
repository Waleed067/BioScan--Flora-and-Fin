@echo off

set "PATH=%PATH%;C:\Program Files\nodejs"

echo Installing dependencies with npm...
"C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install
if errorlevel 1 goto install_failed

echo Running linter and auto-fixing formatting issues...
"C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run lint -- --fix
if errorlevel 1 goto lint_failed

echo Starting development server...
"C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run dev
goto :eof

:install_failed
echo npm install failed. Fix the install errors and try again.
pause
exit /b 1

:lint_failed
echo Some linting errors remain (likely TypeScript 'any' types that need manual fixing).
echo Check the output above for details.
pause
exit /b 1
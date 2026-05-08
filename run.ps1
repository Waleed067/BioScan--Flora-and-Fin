$env:PATH += ";C:\Program Files\nodejs"

Write-Host "Installing dependencies with npm..."
& "C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install failed. Fix the install errors and try again."
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Running linter and auto-fixing formatting issues..."
& "C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run lint -- --fix
if ($LASTEXITCODE -ne 0) {
    Write-Host "Some linting errors remain (likely TypeScript 'any' types that need manual fixing)."
    Write-Host "Check the output above for details."
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting development server..."
& "C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run dev
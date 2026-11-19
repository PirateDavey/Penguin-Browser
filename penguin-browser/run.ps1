$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host 'Node.js and npm are required. Install the Node.js LTS release from https://nodejs.org/ and try again.' -ForegroundColor Red
    Read-Host 'Press Enter to close'
    exit 1
}
if (-not (Test-Path 'node_modules/electron')) {
    Write-Host 'First launch: installing Penguin Browser dependencies...'
    npm install
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
}
Write-Host 'Launching Penguin Browser...'
npm start
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Penguin Browser exited with an error.' -ForegroundColor Red
    Read-Host 'Press Enter to close'
}

@echo off
setlocal
cd /d "%~dp0"
title Penguin Browser Launcher
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install the LTS version from https://nodejs.org/ and try again.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Reinstall Node.js with npm included.
  pause
  exit /b 1
)
if not exist "node_modules\electron" (
  echo First launch: installing Penguin Browser dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)
echo Launching Penguin Browser...
call npm start
if errorlevel 1 (
  echo Penguin Browser exited with an error. Check the messages above.
  pause
)
endlocal

@echo off
title agentchattr
cd /d "%~dp0"

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found. Please install Python 3.10+.
    pause
    exit /b 1
)

:: Check pywebview
python -c "import webview" >nul 2>&1
if errorlevel 1 (
    echo Installing pywebview...
    pip install pywebview
)

:: Launch
python desktop.py %*
pause

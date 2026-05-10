@echo off
title agentchattr (LAN)
cd /d "%~dp0"

python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found. Please install Python 3.10+.
    pause
    exit /b 1
)

python -c "import webview" >nul 2>&1
if errorlevel 1 (
    echo Installing pywebview...
    pip install pywebview
)

python desktop.py --allow-network %*
pause

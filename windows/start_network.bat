@echo off
REM agentchattr — starts the server with local network access enabled
cd /d "%~dp0.."

REM Auto-create venv and install deps on first run
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
    .venv\Scripts\pip install -q -r requirements.txt
)
call .venv\Scripts\activate.bat

echo Starting agentchattrFlow with local network access...
python run.py --allow-network
echo.
echo === Server exited with code %ERRORLEVEL% ===
pause

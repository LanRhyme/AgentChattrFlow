@echo off
REM agentchattr — starts the OpenCode agent
cd /d "%~dp0.."

REM Auto-create venv and install deps on first run
if not exist ".venv" (
    python -m venv .venv
    .venv\Scripts\pip install -q -r requirements.txt >nul 2>nul
)
call .venv\Scripts\activate.bat

python run.py --agent opencode
echo.
echo === Agent exited with code %ERRORLEVEL% ===
pause

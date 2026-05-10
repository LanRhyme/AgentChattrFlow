@echo off
cd /d "%~dp0"

echo ============================================
echo   agentchattr Desktop Build
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found.
    pause
    exit /b 1
)

:: Check/Install pyinstaller
python -c "import PyInstaller" >nul 2>&1
if errorlevel 1 (
    echo Installing PyInstaller...
    pip install pyinstaller
)

:: Check/Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

:: Build frontend
echo.
echo Building frontend...
cd frontend
call npm install
call npm run build
cd ..

:: Build exe
echo.
echo Building desktop exe...
pyinstaller agentchattr.spec --clean

echo.
if exist "dist\agentchattr\agentchattr.exe" (
    echo Build successful!
    echo Output: dist\agentchattr\agentchattr.exe
) else (
    echo Build failed. Check errors above.
)

echo.
pause

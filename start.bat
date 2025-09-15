@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo Hospital Login System Startup Script
echo ========================================
echo.
echo [DEBUG] Script started at %DATE% %TIME%
echo [DEBUG] Initial directory: %CD%
echo [DEBUG] Script location: %~dp0
echo.
echo Stopping existing Node.js processes...
taskkill /IM node.exe /F >nul 2>&1
echo Done.
echo.
echo Setting production environment...
set NODE_ENV=production
echo NODE_ENV set to: %NODE_ENV%
echo.
echo Changing to project directory...
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo [DEBUG] Checking if package.json exists...
if not exist "package.json" (
    echo ERROR: package.json not found in current directory
    echo Please ensure you are in the correct project directory
    echo Current directory contents:
    dir /b
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo package.json found
echo.
echo [DEBUG] Checking npm availability...
echo npm path: 
where npm 2>nul
echo.
echo Checking npm version...
for /f "tokens=*" %%i in ('npm --version 2^>nul') do set NPM_VERSION=%%i
if "%NPM_VERSION%"=="" (
    echo ERROR: npm command failed
    echo Please ensure Node.js and npm are properly installed
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo npm version: %NPM_VERSION%
echo npm is working correctly
echo.
echo [DEBUG] Building project...
echo Running: npm run build
cmd /c "npm run build"
if errorlevel 1 (
    echo.
    echo ERROR: Project build failed
    echo Please check the error messages above
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo Build completed successfully
echo.
echo [DEBUG] Starting server...
echo Running: npm start
echo Server will start in a new window...
start "Hospital Login Server" cmd /c "npm start && pause"
echo.
echo Server startup command executed
echo The server should be running in a separate window
echo You can close this window now
echo.
echo Press any key to exit...
pause >nul
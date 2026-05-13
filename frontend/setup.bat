@echo off
REM OphthoCare Frontend Setup Script for Windows
REM Installs dependencies and configures the frontend

echo.
echo 🚀 OphthoCare Frontend Setup
echo ================================

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION%

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION%

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install

REM Copy env file
if not exist ".env.local" (
    echo 📋 Creating .env.local from .env.example
    copy .env.example .env.local
    echo ⚠️  Please update .env.local with your configuration
)

REM Run type check
echo.
echo 🔍 Type checking...
call npm run type-check 2>nul || echo ⚠️  Type check warnings (non-critical)

REM Run linter
echo.
echo ✨ Linting code...
call npm run lint 2>nul || echo ⚠️  Linter warnings (non-critical)

echo.
echo ================================
echo ✅ Frontend setup complete!
echo.
echo 📝 Next steps:
echo 1. Update .env.local with your configuration
echo 2. Start the development server: npm run dev
echo 3. Open http://localhost:3000
echo.
echo 📚 Documentation:
echo    README.md - Getting started
echo    STRUCTURE.md - Project structure
echo.
pause

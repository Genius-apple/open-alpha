@echo off
echo.
echo   =============================================
echo   🚀 Open Alpha - Quantitative Factor Platform
echo   =============================================
echo.

:: Terminate potential orphaned processes
echo   [1/4] Cleaning up existing processes...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq OpenAlpha*" >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

:: Start Backend
echo   [2/4] Starting Backend (FastAPI)...
start "OpenAlpha-Backend" /B cmd /c "python -m backend.main"

:: Wait for backend
echo   [3/4] Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

:: Start Frontend
echo   [4/4] Starting Frontend (React)...
cd frontend
start "OpenAlpha-Frontend" cmd /c "npm run dev -- --host"

echo.
echo   =============================================
echo   ✅ Platform Started Successfully!
echo   =============================================
echo.
echo   📊 Frontend:  http://localhost:5173
echo   🔌 Backend:   http://localhost:8000
echo   📚 API Docs:  http://localhost:8000/docs
echo.
echo   Press Ctrl+C in terminal windows to stop.
echo.
pause

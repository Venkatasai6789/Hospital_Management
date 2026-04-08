@echo off
echo.
echo ========================================
echo   MediConnect - Starting Backend Server
echo ========================================
echo.
cd backend
echo Installing dependencies (if needed)...
call npm install
echo.
echo Starting server...
call npm start

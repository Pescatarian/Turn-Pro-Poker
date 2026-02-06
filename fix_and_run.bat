@echo off
cd frontend
echo ==========================================
echo Cleaning up old dependencies...
echo ==========================================
if exist node_modules (
    rmdir /s /q node_modules
)
if exist package-lock.json (
    del package-lock.json
)

echo.
echo ==========================================
echo Installing dependencies...
echo (This may take 1-2 minutes)
echo ==========================================
call npm install

echo.
echo ==========================================
echo Starting Expo...
echo ==========================================
call npx expo start -c

pause

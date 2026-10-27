@echo off
TITLE AEROSENTRY // LAUNCHING DISASTER COMMAND CENTER
echo ============================================================
echo   AEROSENTRY // DISASTER RESPONSE COMMAND CENTER LAUNCHER
echo ============================================================
echo.
echo [*] Step 1/3: Launching Python YOLOv8 AI Service on port 8000...
start "AeroSentry AI Service (Port 8000)" cmd /k "cd ai-service && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [*] Step 2/3: Launching Node.js Express API on port 5000...
start "AeroSentry Backend API (Port 5000)" cmd /k "cd backend && npm run dev"

echo [*] Step 3/3: Launching React Vite Tactical Dashboard on port 5173...
start "AeroSentry Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================================
echo   ALL 3 SERVICES LAUNCHED SUCCESSFULLY!
echo.
echo   - AI Service:   http://localhost:8000/health
echo   - Backend API:  http://localhost:5000/api/health
echo   - Command UI:   http://localhost:5173
echo.
echo   Demo Credentials:
echo     Admin:    admin@aerosentry.io    / Admin@123
echo     Operator: operator@aerosentry.io / Operator@123
echo     Rescuer:  rescuer@aerosentry.io  / Rescuer@123
echo ============================================================
pause

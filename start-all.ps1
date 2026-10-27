Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AEROSENTRY // DISASTER RESPONSE COMMAND CENTER (NO DOCKER)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[*] Step 1/3: Launching Python YOLOv8 AI Service on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/ai-service'; python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "[*] Step 2/3: Launching Node.js Express API on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/backend'; npm run dev"

Write-Host "[*] Step 3/3: Launching React Vite Tactical Dashboard on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/frontend'; npm run dev"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  ALL 3 SERVICES LAUNCHED DIRECTLY ON HOST (NO DOCKER)!" -ForegroundColor Green
Write-Host "  - AI Service:   http://localhost:8000/health" -ForegroundColor White
Write-Host "  - Backend API:  http://localhost:5000/api/health" -ForegroundColor White
Write-Host "  - Command UI:   http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "  Demo Credentials:" -ForegroundColor Yellow
Write-Host "    Admin:    admin@aerosentry.io    / Admin@123" -ForegroundColor White
Write-Host "    Operator: operator@aerosentry.io / Operator@123" -ForegroundColor White
Write-Host "    Rescuer:  rescuer@aerosentry.io  / Rescuer@123" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green

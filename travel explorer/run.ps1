Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  VOYARA - Full-Stack Smart Travel Planner" -ForegroundColor White
Write-Host "  Launching Application & API Server" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening browser at http://localhost:8000/ ..." -ForegroundColor Yellow
Start-Process "http://localhost:8000/"
py -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

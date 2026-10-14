@echo off
echo ========================================================
echo   VOYARA - Full-Stack Smart Travel Planner
echo   Launching Application & API Server
echo ========================================================
echo.
echo Opening browser at http://localhost:8000/ ...
start http://localhost:8000/
py -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

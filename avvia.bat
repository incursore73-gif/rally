@echo off
cd /d "%~dp0"
start "" cmd /c "timeout /t 1 >nul & start http://localhost:8642/"
echo Avvio server di Alpine Drift 3D su http://localhost:8642/ ...
echo Lascia aperta questa finestra mentre giochi (Ctrl+C per chiudere).
node server.mjs
pause

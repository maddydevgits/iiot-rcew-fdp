@echo off
echo ========================================
echo    IIoT Demo - Quick Start
echo ========================================
echo.

echo Installing dependencies...
npm install ws

echo.
echo Starting MQTT Proxy...
start "MQTT Proxy" cmd /k "node mqtt-proxy.js"

echo Waiting for proxy to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting Virtual Sensors...
start "Temperature Sensor" cmd /k "node sensors/temperature-sensor.js"
start "Pressure Sensor" cmd /k "node sensors/pressure-sensor.js"
start "Humidity Sensor" cmd /k "node sensors/humidity-sensor.js"
start "Vibration Sensor" cmd /k "node sensors/vibration-sensor.js"

echo.
echo Starting Web Dashboard...
start "Web Dashboard" cmd /k "python -m http.server 8080 --directory dashboard"

echo.
echo ========================================
echo    Demo Started Successfully!
echo ========================================
echo.
echo 🌐 Dashboard: http://localhost:8080
echo 📡 MQTT Proxy: ws://localhost:8081
echo.
echo Press any key to stop all services...
pause > nul

echo.
echo Stopping all services...
taskkill /f /im node.exe > nul 2>&1
taskkill /f /im python.exe > nul 2>&1
echo Demo stopped. 
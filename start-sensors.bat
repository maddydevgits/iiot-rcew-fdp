@echo off
echo Starting Virtual Sensors...
start "Temperature Sensor" cmd /k "node sensors/temperature-sensor.js"
start "Pressure Sensor" cmd /k "node sensors/pressure-sensor.js"
start "Humidity Sensor" cmd /k "node sensors/humidity-sensor.js"
start "Vibration Sensor" cmd /k "node sensors/vibration-sensor.js"
echo Sensors started successfully! 
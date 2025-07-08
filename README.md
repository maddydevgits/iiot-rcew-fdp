# IIoT Demo - Real-time Sensor Dashboard

A complete Industrial Internet of Things (IIoT) demonstration featuring virtual sensors, MQTT communication, and a modern web dashboard.

## 🚀 Quick Start

```bash
# Run everything with one command
start-demo-with-proxy.bat
```

## 📁 Project Structure

```
iiot-demo/
├── sensors/                    # Virtual sensor implementations
│   ├── temperature-sensor.js   # Temperature sensor (20-30°C)
│   ├── pressure-sensor.js      # Pressure sensor (1-10 bar)
│   ├── humidity-sensor.js      # Humidity sensor (30-70%)
│   └── vibration-sensor.js     # Vibration sensor (0-5 mm/s)
├── dashboard/                  # Web dashboard
│   ├── index.html             # Dashboard HTML
│   ├── dashboard.js           # Dashboard JavaScript
│   └── style.css              # Dashboard styles
├── mqtt-proxy.js              # Local MQTT to WebSocket proxy
├── start-demo-with-proxy.bat  # All-in-one startup script
├── start-sensors.bat          # Start sensors only
└── README.md                  # This file
```

## 🔧 Components

### Virtual Sensors
- **Temperature**: 20-30°C, publishes every 5 seconds
- **Pressure**: 1-10 bar, publishes every 3 seconds  
- **Humidity**: 30-70%, publishes every 4 seconds
- **Vibration**: 0-5 mm/s, publishes every 2 seconds

### MQTT Proxy
- Connects to HiveMQ via TCP (reliable)
- Creates local WebSocket server on port 8081
- Forwards sensor data to dashboard

### Web Dashboard
- **URL**: http://localhost:8080
- Real-time sensor gauges with status indicators
- Interactive charts with filtering
- Live data table with timestamps
- Dynamic statistics based on selected sensor

## 🎯 Features

### Real-time Monitoring
- **Color-coded Gauges**: Visual status indicators
- **Interactive Charts**: Filter by sensor type
- **Live Data Table**: Latest 10 readings
- **Dynamic Statistics**: Updates based on filter selection

### Interactive Controls
- **Filter Buttons**: Show specific sensors
- **Clickable Legend**: Toggle sensor visibility
- **Responsive Design**: Works on mobile and desktop

## 🛠️ Manual Setup

If you prefer manual setup:

```bash
# 1. Install dependencies
npm install ws

# 2. Start MQTT proxy
node mqtt-proxy.js

# 3. Start sensors (in separate terminals)
start-sensors.bat

# 4. Start web server
python -m http.server 8080 --directory dashboard

# 5. Open dashboard
# http://localhost:8080
```

## 🔗 MQTT Topics

All sensors publish to HiveMQ:
- `iiot/sensors/temperature/#` - Temperature data
- `iiot/sensors/pressure/#` - Pressure data  
- `iiot/sensors/humidity/#` - Humidity data
- `iiot/sensors/vibration/#` - Vibration data

## 🛠️ Troubleshooting

### No Data in Dashboard
1. Check if MQTT proxy is running: `node mqtt-proxy.js`
2. Verify sensors are running: `start-sensors.bat`
3. Check browser console (F12) for errors

### Connection Issues
1. Ensure port 8081 is not blocked
2. Check if sensors are publishing data
3. Verify internet connection for HiveMQ

### Common Commands
```bash
# Check if processes are running
tasklist | findstr node

# Stop all Node.js processes
taskkill /f /im node.exe
```

## 🎯 Why This Approach?

- **Reliable**: TCP connections to HiveMQ are more stable
- **Compatible**: Works around corporate firewall restrictions
- **Fast**: Local proxy reduces latency
- **Modern**: Pure web dashboard, no Node-RED dependencies
- **Responsive**: Works on any device with a browser

---

**Happy IIoT Development! 🏭🚀** 
const mqtt = require('mqtt');

// HiveMQ Configuration
const MQTT_BROKER = 'broker.hivemq.com';
const MQTT_PORT = 1883;
const SENSOR_ID = 'pressure_001';
const SENSOR_TYPE = 'pressure';
const TOPIC = `iiot/sensors/${SENSOR_TYPE}/${SENSOR_ID}`;
const PUBLISH_INTERVAL = 3000; // 3 seconds

console.log('🔧 Virtual Pressure Sensor Starting...');
console.log(`📡 Connecting to: ${MQTT_BROKER}:${MQTT_PORT}`);
console.log(`📤 Publishing to: ${TOPIC}`);

// Connect to HiveMQ
const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`, {
    clientId: `pressure-sensor-${Date.now()}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
});

client.on('connect', () => {
    console.log('✅ Connected to HiveMQ broker');
    console.log('🔄 Starting pressure data transmission...\n');
    
    // Start publishing pressure data
    setInterval(() => {
        const pressure = generatePressure();
        const sensorData = {
            sensorId: SENSOR_ID,
            sensorType: SENSOR_TYPE,
            value: pressure,
            unit: 'bar',
            timestamp: new Date().toISOString(),
            location: 'Hydraulic System B',
            status: getStatus(pressure)
        };
        
        client.publish(TOPIC, JSON.stringify(sensorData), (err) => {
            if (err) {
                console.log('❌ Failed to publish:', err.message);
            } else {
                console.log(`📤 Pressure: ${pressure} bar | Status: ${sensorData.status}`);
            }
        });
    }, PUBLISH_INTERVAL);
});

client.on('error', (err) => {
    console.log('❌ MQTT Error:', err.message);
});

client.on('close', () => {
    console.log('🔌 Connection closed');
});

// Generate realistic pressure data
function generatePressure() {
    const basePressure = 5; // Base pressure
    const variation = (Math.random() - 0.5) * 4; // ±2 bar variation
    return Math.round((basePressure + variation) * 10) / 10; // Round to 1 decimal
}

// Determine status based on pressure
function getStatus(pressure) {
    if (pressure < 1 || pressure > 9) {
        return 'critical';
    } else if (pressure < 2 || pressure > 8) {
        return 'warning';
    } else {
        return 'active';
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down pressure sensor...');
    client.end();
    process.exit(0);
});

console.log('⏳ Pressure sensor ready. Press Ctrl+C to stop.\n'); 
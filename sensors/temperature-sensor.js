const mqtt = require('mqtt');

// HiveMQ Configuration
const MQTT_BROKER = 'broker.hivemq.com';
const MQTT_PORT = 1883;
const SENSOR_ID = 'temp_001';
const SENSOR_TYPE = 'temperature';
const TOPIC = `iiot/sensors/${SENSOR_TYPE}/${SENSOR_ID}`;
const PUBLISH_INTERVAL = 5000; // 5 seconds

console.log('🌡️  Virtual Temperature Sensor Starting...');
console.log(`📡 Connecting to: ${MQTT_BROKER}:${MQTT_PORT}`);
console.log(`📤 Publishing to: ${TOPIC}`);

// Connect to HiveMQ
const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`, {
    clientId: `temp-sensor-${Date.now()}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
});

client.on('connect', () => {
    console.log('✅ Connected to HiveMQ broker');
    console.log('🔄 Starting temperature data transmission...\n');
    
    // Start publishing temperature data
    setInterval(() => {
        const temperature = generateTemperature();
        const sensorData = {
            sensorId: SENSOR_ID,
            sensorType: SENSOR_TYPE,
            value: temperature,
            unit: '°C',
            timestamp: new Date().toISOString(),
            location: 'Production Line A',
            status: getStatus(temperature)
        };
        
        client.publish(TOPIC, JSON.stringify(sensorData), (err) => {
            if (err) {
                console.log('❌ Failed to publish:', err.message);
            } else {
                console.log(`📤 Temperature: ${temperature}°C | Status: ${sensorData.status}`);
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

// Generate realistic temperature data
function generateTemperature() {
    const baseTemp = 25; // Base temperature
    const variation = (Math.random() - 0.5) * 30; // ±15°C variation
    return Math.round((baseTemp + variation) * 10) / 10; // Round to 1 decimal
}

// Determine status based on temperature
function getStatus(temperature) {
    if (temperature < 15 || temperature > 35) {
        return 'critical';
    } else if (temperature < 20 || temperature > 30) {
        return 'warning';
    } else {
        return 'active';
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down temperature sensor...');
    client.end();
    process.exit(0);
});

console.log('⏳ Temperature sensor ready. Press Ctrl+C to stop.\n'); 
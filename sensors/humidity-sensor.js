const mqtt = require('mqtt');

// HiveMQ Configuration
const MQTT_BROKER = 'broker.hivemq.com';
const MQTT_PORT = 1883;
const SENSOR_ID = 'humidity_001';
const SENSOR_TYPE = 'humidity';
const TOPIC = `iiot/sensors/${SENSOR_TYPE}/${SENSOR_ID}`;
const PUBLISH_INTERVAL = 4000; // 4 seconds

console.log('💧 Virtual Humidity Sensor Starting...');
console.log(`📡 Connecting to: ${MQTT_BROKER}:${MQTT_PORT}`);
console.log(`📤 Publishing to: ${TOPIC}`);

// Connect to HiveMQ
const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`, {
    clientId: `humidity-sensor-${Date.now()}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
});

client.on('connect', () => {
    console.log('✅ Connected to HiveMQ broker');
    console.log('🔄 Starting humidity data transmission...\n');
    
    // Start publishing humidity data
    setInterval(() => {
        const humidity = generateHumidity();
        const sensorData = {
            sensorId: SENSOR_ID,
            sensorType: SENSOR_TYPE,
            value: humidity,
            unit: '%',
            timestamp: new Date().toISOString(),
            location: 'Climate Control Zone C',
            status: getStatus(humidity)
        };
        
        client.publish(TOPIC, JSON.stringify(sensorData), (err) => {
            if (err) {
                console.log('❌ Failed to publish:', err.message);
            } else {
                console.log(`📤 Humidity: ${humidity}% | Status: ${sensorData.status}`);
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

// Generate realistic humidity data
function generateHumidity() {
    const baseHumidity = 60; // Base humidity
    const variation = (Math.random() - 0.5) * 40; // ±20% variation
    return Math.round(baseHumidity + variation); // Round to whole number
}

// Determine status based on humidity
function getStatus(humidity) {
    if (humidity < 20 || humidity > 90) {
        return 'critical';
    } else if (humidity < 30 || humidity > 80) {
        return 'warning';
    } else {
        return 'active';
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down humidity sensor...');
    client.end();
    process.exit(0);
});

console.log('⏳ Humidity sensor ready. Press Ctrl+C to stop.\n'); 
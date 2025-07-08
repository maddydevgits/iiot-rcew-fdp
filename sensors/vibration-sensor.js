const mqtt = require('mqtt');

// HiveMQ Configuration
const MQTT_BROKER = 'broker.hivemq.com';
const MQTT_PORT = 1883;
const SENSOR_ID = 'vibration_001';
const SENSOR_TYPE = 'vibration';
const TOPIC = `iiot/sensors/${SENSOR_TYPE}/${SENSOR_ID}`;
const PUBLISH_INTERVAL = 2000; // 2 seconds

console.log('📳 Virtual Vibration Sensor Starting...');
console.log(`📡 Connecting to: ${MQTT_BROKER}:${MQTT_PORT}`);
console.log(`📤 Publishing to: ${TOPIC}`);

// Connect to HiveMQ
const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`, {
    clientId: `vibration-sensor-${Date.now()}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
});

client.on('connect', () => {
    console.log('✅ Connected to HiveMQ broker');
    console.log('🔄 Starting vibration data transmission...\n');
    
    // Start publishing vibration data
    setInterval(() => {
        const vibration = generateVibration();
        const sensorData = {
            sensorId: SENSOR_ID,
            sensorType: SENSOR_TYPE,
            value: vibration,
            unit: 'mm/s',
            timestamp: new Date().toISOString(),
            location: 'Motor Assembly D',
            status: getStatus(vibration)
        };
        
        client.publish(TOPIC, JSON.stringify(sensorData), (err) => {
            if (err) {
                console.log('❌ Failed to publish:', err.message);
            } else {
                console.log(`📤 Vibration: ${vibration} mm/s | Status: ${sensorData.status}`);
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

// Generate realistic vibration data
function generateVibration() {
    const baseVibration = 1.5; // Base vibration
    const variation = (Math.random() - 0.5) * 3; // ±1.5 mm/s variation
    return Math.round((baseVibration + variation) * 100) / 100; // Round to 2 decimals
}

// Determine status based on vibration
function getStatus(vibration) {
    if (vibration > 4) {
        return 'critical';
    } else if (vibration > 2.5) {
        return 'warning';
    } else {
        return 'active';
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down vibration sensor...');
    client.end();
    process.exit(0);
});

console.log('⏳ Vibration sensor ready. Press Ctrl+C to stop.\n'); 
const mqtt = require('mqtt');
const WebSocket = require('ws');

console.log('🔄 Starting MQTT WebSocket Proxy...\n');

// MQTT Client (connects to HiveMQ via TCP)
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883', {
    clientId: 'proxy-client-' + Date.now(),
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: 1000
});

// WebSocket Server (for dashboard connections)
const wss = new WebSocket.Server({ port: 8081 });

console.log('📡 WebSocket server started on port 8081');
console.log('🌐 Dashboard should connect to: ws://localhost:8081\n');

// Store connected dashboard clients
const dashboardClients = new Set();

// Handle MQTT connection
mqttClient.on('connect', () => {
    console.log('✅ Connected to HiveMQ via TCP');
    
    // Subscribe to all sensor topics
    const topics = [
        'iiot/sensors/temperature/#',
        'iiot/sensors/pressure/#',
        'iiot/sensors/humidity/#',
        'iiot/sensors/vibration/#'
    ];
    
    topics.forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
            if (err) {
                console.log(`❌ Failed to subscribe to ${topic}:`, err.message);
            } else {
                console.log(`📡 Subscribed to: ${topic}`);
            }
        });
    });
});

// Handle MQTT messages and forward to dashboard clients
mqttClient.on('message', (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        console.log(`📥 MQTT: ${data.sensorType} = ${data.value} ${data.unit}`);
        
        // Forward to all connected dashboard clients
        const messageToSend = JSON.stringify({
            topic: topic,
            message: data
        });
        
        dashboardClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageToSend);
            }
        });
        
    } catch (error) {
        console.error('❌ Error parsing MQTT message:', error);
    }
});

mqttClient.on('error', (error) => {
    console.error('❌ MQTT Error:', error.message);
});

mqttClient.on('close', () => {
    console.log('🔌 MQTT connection closed');
});

// Handle WebSocket connections from dashboard
wss.on('connection', (ws, req) => {
    console.log('🌐 Dashboard connected');
    dashboardClients.add(ws);
    
    // Send connection confirmation
    ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        message: 'Connected to MQTT proxy'
    }));
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('📤 Dashboard message:', data);
        } catch (error) {
            console.error('❌ Error parsing dashboard message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('🌐 Dashboard disconnected');
        dashboardClients.delete(ws);
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        dashboardClients.delete(ws);
    });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down MQTT proxy...');
    mqttClient.end();
    wss.close();
    process.exit(0);
});

console.log('⏳ Proxy running. Press Ctrl+C to stop.\n'); 
const { spawn } = require('child_process');
const path = require('path');

console.log('🏭 Starting All Virtual Sensors...\n');

const sensors = [
    { name: 'Temperature', file: 'temperature-sensor.js' },
    { name: 'Pressure', file: 'pressure-sensor.js' },
    { name: 'Humidity', file: 'humidity-sensor.js' },
    { name: 'Vibration', file: 'vibration-sensor.js' }
];

const processes = [];

sensors.forEach(sensor => {
    console.log(`🚀 Starting ${sensor.name} sensor...`);
    
    const sensorProcess = spawn('node', [sensor.file], {
        cwd: __dirname,
        stdio: 'pipe'
    });
    
    sensorProcess.stdout.on('data', (data) => {
        console.log(`[${sensor.name}] ${data.toString().trim()}`);
    });
    
    sensorProcess.stderr.on('data', (data) => {
        console.log(`[${sensor.name}] ERROR: ${data.toString().trim()}`);
    });
    
    sensorProcess.on('close', (code) => {
        console.log(`[${sensor.name}] Process exited with code ${code}`);
    });
    
    processes.push(sensorProcess);
});

console.log('\n✅ All sensors started! Press Ctrl+C to stop all sensors.\n');

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down all sensors...');
    processes.forEach(process => {
        process.kill('SIGINT');
    });
    setTimeout(() => {
        process.exit(0);
    }, 2000);
}); 
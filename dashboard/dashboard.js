// IIoT Dashboard JavaScript
class IIoTDashboard {
    constructor() {
        this.ws = null;
        this.chart = null;
        this.sensorData = {
            temperature: [],
            pressure: [],
            humidity: [],
            vibration: []
        };
        this.maxDataPoints = 30;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        this.totalReadings = 0;
        this.activeFilter = 'all';
        this.hiddenSensors = new Set();
        
        this.init();
    }

    init() {
        this.connectWebSocket();
        this.initChart();
        this.initControls();
        this.updateConnectionStatus('Connecting...', 'disconnected');
        
        // Auto-hide loading after 10 seconds if no data arrives
        setTimeout(() => {
            this.hideLoading();
        }, 10000);
    }

    connectWebSocket() {
        try {
            console.log('🔗 Connecting to local MQTT proxy...');
            this.ws = new WebSocket('ws://localhost:8081');
            
            this.ws.onopen = () => {
                console.log('✅ Connected to MQTT proxy');
                this.updateConnectionStatus('Connected', 'connected');
                this.connectionAttempts = 0;
                this.hideLoading();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket Error:', error);
                this.updateConnectionStatus('Connection Error', 'disconnected');
                this.handleConnectionError();
            };

            this.ws.onclose = () => {
                console.log('🔌 WebSocket connection closed');
                this.updateConnectionStatus('Disconnected', 'disconnected');
                this.showLoading();
            };

        } catch (error) {
            console.error('❌ Failed to create WebSocket connection:', error);
            this.updateConnectionStatus('Connection Failed', 'disconnected');
            this.handleConnectionError();
        }
    }

    handleConnectionError() {
        this.connectionAttempts++;
        if (this.connectionAttempts < this.maxConnectionAttempts) {
            console.log(`🔄 Connection attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`);
            setTimeout(() => {
                this.connectWebSocket();
            }, 3000);
        } else {
            console.error('❌ Max connection attempts reached');
            this.updateConnectionStatus('Connection Failed', 'disconnected');
            this.showConnectionHelp();
        }
    }

    showConnectionHelp() {
        const helpDiv = document.createElement('div');
        helpDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 1000;
            max-width: 400px;
            text-align: center;
        `;
        helpDiv.innerHTML = `
            <h3>🔗 Connection Issue</h3>
            <p>Unable to connect to MQTT proxy. Please check:</p>
            <ul style="text-align: left; margin: 10px 0;">
                <li>MQTT proxy is running: <code>node mqtt-proxy.js</code></li>
                <li>Sensors are running: <code>start-sensors.bat</code></li>
                <li>Port 8081 is not blocked</li>
            </ul>
            <button onclick="this.parentElement.remove(); location.reload();" 
                    style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                Retry Connection
            </button>
        `;
        document.body.appendChild(helpDiv);
    }

    handleMessage(data) {
        if (data.type === 'connection') {
            console.log('📡 Connection message:', data.message);
            this.hideLoading();
            return;
        }

        if (data.topic && data.message) {
            console.log(`📥 Received on ${data.topic}:`, data.message);
            this.hideLoading(); // Hide loading when first data arrives
            this.updateSensorDisplay(data.message);
            this.updateDataTable(data.message);
            this.updateChart(data.message);
            this.updateStatistics();
        }
    }

    updateSensorDisplay(data) {
        const sensorType = data.sensorType;
        const value = data.value;
        const unit = data.unit;
        const status = data.status;

        // Update gauge
        const gaugeElement = document.getElementById(`${sensorType}-gauge`);
        const valueElement = document.getElementById(`${sensorType}-value`);
        const statusElement = document.getElementById(`${sensorType}-status`);

        if (gaugeElement && valueElement && statusElement) {
            gaugeElement.textContent = value;
            valueElement.textContent = value;
            
            // Update gauge color based on status
            gaugeElement.className = `gauge ${status}`;
            
            // Update status
            statusElement.textContent = status.toUpperCase();
            statusElement.className = `sensor-status status-${status}`;
        }
    }

    updateDataTable(data) {
        const tableBody = document.getElementById('sensor-table-body');
        
        // Remove "waiting for data" row if it exists
        if (tableBody.children.length === 1 && tableBody.children[0].children.length === 1) {
            tableBody.innerHTML = '';
        }

        // Create new row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.sensorId}</td>
            <td>${data.sensorType}</td>
            <td>${data.value}</td>
            <td>${data.unit}</td>
            <td>${new Date(data.timestamp).toLocaleString()}</td>
            <td>${data.location}</td>
            <td><span class="sensor-status status-${data.status}">${data.status.toUpperCase()}</span></td>
        `;

        // Add to beginning of table
        tableBody.insertBefore(row, tableBody.firstChild);

        // Keep only last 10 rows
        while (tableBody.children.length > 10) {
            tableBody.removeChild(tableBody.lastChild);
        }
    }

    updateChart(data) {
        const sensorType = data.sensorType;
        const value = data.value;
        const timestamp = new Date(data.timestamp);

        // Add data to sensor arrays
        if (!this.sensorData[sensorType]) {
            this.sensorData[sensorType] = [];
        }

        this.sensorData[sensorType].push({
            x: timestamp,
            y: value
        });

        // Keep only last maxDataPoints
        if (this.sensorData[sensorType].length > this.maxDataPoints) {
            this.sensorData[sensorType].shift();
        }

        // Update chart
        this.updateChartData();
    }

    updateStatistics() {
        this.totalReadings++;
        this.updateFilteredStatistics();
    }

    updateFilteredStatistics() {
        let values = [];
        let unit = '';
        let sensorName = '';
        
        if (this.activeFilter === 'all') {
            // Calculate statistics from all sensor data
            Object.values(this.sensorData).forEach(sensorArray => {
                sensorArray.forEach(point => values.push(point.y));
            });
            unit = 'units';
            sensorName = 'All Sensors';
        } else {
            // Calculate statistics from only the selected sensor
            const sensorArray = this.sensorData[this.activeFilter] || [];
            values = sensorArray.map(point => point.y);
            
            // Set appropriate unit and name for the sensor
            const units = {
                temperature: '°C',
                pressure: 'bar',
                humidity: '%',
                vibration: 'mm/s'
            };
            const names = {
                temperature: 'Temperature',
                pressure: 'Pressure',
                humidity: 'Humidity',
                vibration: 'Vibration'
            };
            unit = units[this.activeFilter] || 'units';
            sensorName = names[this.activeFilter] || 'Sensor';
        }

        // Update labels
        document.getElementById('total-label').textContent = `${sensorName} Readings`;
        document.getElementById('avg-label').textContent = `Average ${sensorName}`;
        document.getElementById('min-label').textContent = `Min ${sensorName}`;
        document.getElementById('max-label').textContent = `Max ${sensorName}`;

        // Add animation class
        const statElements = ['total-readings', 'avg-value', 'min-value', 'max-value'];
        statElements.forEach(id => {
            const element = document.getElementById(id);
            element.classList.add('updating');
        });

        // Update values after a short delay for animation
        setTimeout(() => {
            if (values.length > 0) {
                const total = values.length;
                const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
                const min = Math.min(...values).toFixed(1);
                const max = Math.max(...values).toFixed(1);

                document.getElementById('total-readings').textContent = total;
                document.getElementById('avg-value').textContent = `${avg} ${unit}`;
                document.getElementById('min-value').textContent = `${min} ${unit}`;
                document.getElementById('max-value').textContent = `${max} ${unit}`;
            } else {
                // No data for selected filter
                document.getElementById('total-readings').textContent = '0';
                document.getElementById('avg-value').textContent = '--';
                document.getElementById('min-value').textContent = '--';
                document.getElementById('max-value').textContent = '--';
            }

            // Remove animation class
            statElements.forEach(id => {
                const element = document.getElementById(id);
                element.classList.remove('updating');
            });
        }, 150);
    }

    initChart() {
        const ctx = document.getElementById('sensorChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Temperature (°C)',
                        data: [],
                        borderColor: '#ff6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Pressure (bar)',
                        data: [],
                        borderColor: '#36a2eb',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Humidity (%)',
                        data: [],
                        borderColor: '#ffcd56',
                        backgroundColor: 'rgba(255, 205, 86, 0.1)',
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Vibration (mm/s)',
                        data: [],
                        borderColor: '#4bc0c0',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false // We have custom legend
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            displayFormats: {
                                second: 'HH:mm:ss',
                                minute: 'HH:mm'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Time',
                            color: '#666',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#666'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Value',
                            color: '#666',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#666'
                        }
                    }
                },
                animation: {
                    duration: 300
                }
            }
        });
    }

    initControls() {
        // Chart filter buttons
        const filterButtons = document.querySelectorAll('.chart-button[data-filter]');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.dataset.filter;
                this.setActiveFilter(filter);
            });
        });

        // Legend click handlers
        const legendItems = document.querySelectorAll('.legend-item');
        legendItems.forEach(item => {
            item.addEventListener('click', () => {
                const sensor = item.dataset.sensor;
                this.toggleSensorVisibility(sensor);
            });
        });
    }

    setActiveFilter(filter) {
        this.activeFilter = filter;
        
        // Update button states
        document.querySelectorAll('.chart-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // Update chart visibility
        this.updateChartVisibility();
        
        // Update statistics for the selected filter
        this.updateFilteredStatistics();
    }

    toggleSensorVisibility(sensor) {
        const legendItem = document.querySelector(`[data-sensor="${sensor}"]`);
        
        if (this.hiddenSensors.has(sensor)) {
            this.hiddenSensors.delete(sensor);
            legendItem.classList.remove('hidden');
        } else {
            this.hiddenSensors.add(sensor);
            legendItem.classList.add('hidden');
        }
        
        this.updateChartVisibility();
    }

    updateChartVisibility() {
        if (!this.chart) return;

        const datasets = [
            { key: 'temperature', index: 0 },
            { key: 'pressure', index: 1 },
            { key: 'humidity', index: 2 },
            { key: 'vibration', index: 3 }
        ];

        datasets.forEach(dataset => {
            const isVisible = this.activeFilter === 'all' || this.activeFilter === dataset.key;
            const isHidden = this.hiddenSensors.has(dataset.key);
            
            this.chart.data.datasets[dataset.index].hidden = !isVisible || isHidden;
        });

        this.chart.update();
    }

    updateChartData() {
        if (!this.chart) return;

        const datasets = [
            { key: 'temperature', index: 0 },
            { key: 'pressure', index: 1 },
            { key: 'humidity', index: 2 },
            { key: 'vibration', index: 3 }
        ];

        datasets.forEach(dataset => {
            this.chart.data.datasets[dataset.index].data = this.sensorData[dataset.key];
        });

        this.chart.update('none');
    }

    showLoading() {
        const loadingElement = document.getElementById('chart-loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
            loadingElement.innerHTML = `
                <div class="loading-spinner"></div>
                <div>Reconnecting to sensor data...</div>
            `;
        }
    }

    hideLoading() {
        const loadingElement = document.getElementById('chart-loading');
        if (loadingElement) {
            // Check if we have any data
            const hasData = Object.values(this.sensorData).some(array => array.length > 0);
            
            if (hasData) {
                // Hide loading completely if we have data
                loadingElement.style.display = 'none';
            } else {
                // Show "waiting for data" message if no data yet
                loadingElement.innerHTML = `
                    <div style="color: #666; font-size: 1.1rem;">
                        <div style="margin-bottom: 10px;">⏳ Waiting for sensor data...</div>
                        <div style="font-size: 0.9rem; color: #999;">
                            Make sure sensors are running and MQTT proxy is connected
                        </div>
                    </div>
                `;
            }
        }
    }

    updateConnectionStatus(status, className) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `status ${className}`;
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing IIoT Dashboard...');
    window.dashboard = new IIoTDashboard();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.dashboard && window.dashboard.ws) {
        window.dashboard.ws.close();
    }
}); 
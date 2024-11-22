const express = require('express');
const cors = require('cors');
const EndPoints = require('./Endpoints');
const Data = require('./Data');
const Heartbeat = require('./Heartbeat');
const Auth = require('./Auth');
const os = require('os');
const Configs = require('./ServerConfig');

const app = express();
app.use(cors({
    origin: 'http://localhost:3001', // Allow requests from React app
    methods: ['GET', 'POST'],
    credentials: true,
}));
app.use(express.json());
app.use(Auth.authenticate);

// Setup routes from endpoint.js
EndPoints.setupEndpoints(app);

// Start server
app.listen(Configs.Port, '0.0.0.0', async () => {
    try {
        await Auth.CreateTable();
        await Data.CreateMainTable();
        console.log('Data Tables Connected.');
        setInterval(Heartbeat.checkProxyHeartbeats, Configs.HEARTBEAT_INTERVAL_MINUTES * 60 * 1000);
        console.log(`Server running on ${Configs.Protocol}://${Configs.IP}:${Configs.Port}`);
    } catch (error) {
        console.error('Error setting up the database:', error);
    }
});
const express = require('express');
const Register = require('./Register');
const Heartbeat = require('./Heartbeat');
const Auth = require('./Auth');
const Data = require('./Data');
const Configs = require('./ServerConfig');

function setupEndpoints(app) {
    // Bulk Registration - No Basic Auth but API Key Check
    app.post('/bulk', (req, res) => {

        try {
            const { apiKey, proxies } = req.body;

            // Check if the provided API key is valid by looking up by name
            const results = Auth.isValidApiKey(apiKey);
            if (!results) {
                return res.status(403).send('Invalid API Key');
            }

            // Check if proxies data is in JSON format
            if (!Array.isArray(proxies)) {
                return res.status(403).send('Wrong Data Type, Only JSON data is accepted');
            }
            // Perform bulk registration of proxies
            Register.BulkRegister(proxies, name);
            res.sendStatus(200);
            

        } catch (error) {
            console.error("Endpoints.js", " :: setupEndpoints() :: Error ❌ : ", error);
        }

        
    });

    // Register individual proxy
    app.post('/register', async (req, res) => {
        try {
            const { apiKey, ip, port, protocol, osType, platform } = req.body;
            console.log("Registering proxy with IP:", ip);
            // Validate API key against the fixed key from the Auth DB
            if (!Auth.isSingleValidApiKey(apiKey)) {
                return res.status(403).send('Invalid API Key');
            }

            // IP is always used as the proxyKey
            const registrationStatus = await Register.RegisterProxy(ip, port, protocol, osType, platform);

            // Handle registration result
            if (registrationStatus === 1) {
                return res.send('Proxy registered successfully');
            } else {
                return res.status(500).send('Failed to register proxy');
            }

        } catch (error) {
            console.error("Endpoints.js", " :: setupEndpoints() :: Error ❌ : ", error);
        }

        
    });

    // Heartbeat endpoint
    app.post('/heartbeat', express.json(), (req, res) => {
        try {
            const { apiKey, ip } = req.body;
            // Validate API key against the fixed key from the Auth DB
            if (!Auth.isSingleValidApiKey(apiKey)) {
                return res.status(403).send('Invalid API Key');
            }

            const proxyKey = `${ip}`; // IP is always the key
            Heartbeat.ProxyHeartbeat(proxyKey);
            return res.sendStatus(200);
            
        } catch (error) {
            console.error("Endpoints.js", " :: setupEndpoints() :: Error ❌ : ", error);
        }

        
    });

    // Server Status endpoint
    app.get('/', (req, res) => {
        try {
            res.send(`Server is running on ${Configs.IP}:${Configs.Port}`);
        } catch (error) {
            console.error("Endpoints.js", " :: setupEndpoints() :: Error ❌ : ", error);
        }
    });

    // Get all proxies with additional stats
    app.get('/proxies', async (req, res) => {
        
        try {
            const proxies = await Data.getAllProxies(); 
            res.json(proxies);
        } catch (error) {
            res.status(500).send('Error fetching proxies');
        }
    });

    app.post('/create-api', async (req, res) => {
    const { name } = req.body;
    const existingName = await Auth.SearchNameInDB(name);
    if (existingName) {
        console.log('Name already exists in the database.');
        return res.status(400).send('Name already exists.');
    }

    try {
        // Your logic to create the API key here
        await Auth.generateApiKey(name); 
        return res.status(200)
    } catch (err) {
        console.error('Error creating API key:', err.message);
        return res.status(500).send('Error creating API key');
    }
    });

   // Endpoint to delete an API by name
app.post('/delete-api', async (req, res) => {
    const { name } = req.body;

    try {
        const result = await Auth.DeleteFromDB(name); // Call your function to delete the API
        if (result) {
            return res.status(200).send({ message: 'API deleted successfully' });
        } else {
            return res.status(404).send({ message: 'API not found' });
        }
    } catch (error) {
        console.error('Error deleting API:', error);
        res.status(500).send({ message: 'Error deleting API' });
    }
});

// Endpoint to fetch all API keys
app.post('/api-keys', async (req, res) => {
    try {
        const apiKeys = await Auth.GetAllFromAuth(); // Call your function to get all API keys
        res.json(apiKeys);
    } catch (error) {
        console.error('Error fetching API keys:', error);
        res.status(500).send({ message: 'Error fetching API keys' });
    }
});

// Endpoint to find an API by name
app.post('/api-name', async (req, res) => {
    const { name } = req.body;

    try {
        const apiKey = await Auth.SearchNameInDB(name); // Call your function to find API by name
        if (apiKey) {
            res.json(apiKey);
        } else {
            res.status(404).send({ message: 'API not found' });
        }
    } catch (error) {
        console.error('Error finding API:', error);
        res.status(500).send({ message: 'Error finding API' });
    }
});
   
    app.post('/SpecificProxies', async (req, res) => {
        const { provider } = req.body;
    
        try {
            // Assuming Data.search(provider, geolocation, active) is a function to query the database
            const proxies = await Data.FetchBasedOnProvider(provider);
            
            if (proxies && proxies.length > 0) {
                res.json(proxies);  // Send the matching proxies
            } else {
                res.json(null);  // Send null if no matches are found
            }
        } catch (error) {
            console.error('Error searching for specific proxies:', error);
            res.status(500).send('Error searching for specific proxies');
        }
    });
    

    app.post('/connect', (req, res) => {
        try {
            const { username, password } = req.body;

            if (username === 'PrecisionData' && password === 'PCfortress9!') {
                res.status(200).send({ message: 'Authenticated' });
            } else {
                res.status(403).send({ message: 'Invalid credentials' });
            }

        } catch (error) {
            console.error("Endpoints.js", " :: setupEndpoints() :: Error ❌ : ", error);
        }

    });
}

module.exports = { setupEndpoints };

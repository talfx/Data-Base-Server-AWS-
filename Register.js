const Data = require('./Data');
const Heartbeat = require('./Heartbeat');
const Values = require('./Values');

const RegisterProxy = async (ip, port, protocol, osType, platform) => {
    try {
        const geolocation = await Values.getGeolocation(ip);
        const geolocationStr = JSON.stringify(geolocation);  // Convert geolocation to a JSON string

        if (await Data.ExistsSQL(ip)) {
            Heartbeat.ProxyHeartbeat(ip);
            return 1;
        }

        const proxy = {
            ip, 
            port, 
            protocol, 
            geolocation: geolocationStr,  // Use serialized string
            osType, 
            platform,
            Provider: 'Original', 
            active: true, 
            HTTP: true, 
            HTTPS: false, 
            Socks5: false,
            lastActive: new Date().toISOString().slice(0, 19).replace('T', ' '),
            heartbeatsSent: 0,
            totalTimeAlive: 0, 
            longestTimeAlive: 0, 
            currentContinuousTimeAlive: 0,
            TotalTimeOffLine: 0, 
            ServerOfflineCheckDate: null, 
            Quality: 0
        };

        await Data.QueryAddNew(proxy);
        return 1;

    } catch (error) {
        console.error("Register.js", " :: Error ❌ : ", error);
    }
};


// Bulk registration for proxies from /bulk API
const BulkRegister = async (Bulk, name) => {

    if (!Bulk || Bulk.length === 0) {
        return false;
    }

    // Regex for IP address and port validation
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const portRegex = /^[0-9]{1,5}$/;

    for (let proxy of Bulk) {
        try {
            const { ip, port, osType, platform } = proxy;

            // Validate IP and port
            if (ip && ipRegex.test(ip) && port && portRegex.test(port)) {
                const proxyKey = `${ip}:${port}`;

                // Only add if the proxy doesn't already exist
                if (!await Data.ExistsSQL(ip)) {
                    const geolocation = await Values.getGeolocation(ip); // Get geolocation dynamically

                    const newProxy = {
                        ip,
                        port,
                        protocol: 'server_protocol', // Update with actual protocol
                        geolocation, 
                        osType: osType || '', 
                        platform: platform || '',
                        Provider: name,
                        active: false,
                        HTTP: false,
                        HTTPS: false,
                        Socks5: false,
                        lastActive: null,
                        heartbeatsSent: 0,
                        totalTimeAlive: 0,
                        longestTimeAlive: 0,
                        currentContinuousTimeAlive: 0,
                        TotalTimeOffLine: 0,
                        ServerOfflineCheckDate: null,
                        Quality: 0
                    };

                    await Data.QueryAddNew(newProxy);
                }
            }
        } catch (err) {
            console.error(`Failed to process proxy: ${proxy.ip}`, err.message);
            return false;
        }
    }
    return true;
};

// Check if the data is in JSON format
const CheckIfJson = async (data) => {
    try {
        JSON.parse(JSON.stringify(data)); // Validate JSON format
        return true;
    } catch (e) {
        console.error(`Wrong Data Type`, e.message);
        return false;
    }
};

module.exports = { CheckIfJson, BulkRegister, RegisterProxy };

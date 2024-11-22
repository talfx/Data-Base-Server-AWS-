const axios = require('axios');

// Test the proxy by making requests
const proxyTest = async (proxy) => {
    const { ip, port } = proxy;
    const testUrls = ['https://www.google.com', 'https://www.example.com', 'https://www.wikipedia.org'];
    let successCount = 0;

    for (let url of testUrls) {
        try {
            const response = await axios.get(url, {
                proxy: {
                    host: ip,
                    port: port
                },
                timeout: 5000 // Set a timeout of 5 seconds for each request
            });

            if (response.status === 200) {
                successCount++;
            }
        } catch (error) {
            console.error(`Failed proxy test for ${ip}:${port} on ${url}:`, error.message);
        }
    }

    // Return 1 if at least 1 request was successful, otherwise return 0
    return successCount > 0 ? 1 : 0;
};

// Calculate and update the quality of the proxy
const QualityCheck = async (proxy) => {

    try {
        const {
            heartbeatsSent,
            totalTimeAlive,
            longestTimeAlive,
            currentContinuousTimeAlive,
            TotalTimeOffLine,
            ServerOfflineCheckDate
        } = proxy;
    
        // Example calculation for quality, adjust based on your logic
        let quality = (heartbeatsSent * 0.1) + (totalTimeAlive * 0.5) + (longestTimeAlive * 0.2) - (TotalTimeOffLine * 0.3);
    
        // Penalize if proxy has been offline for too long
        if (ServerOfflineCheckDate && new Date() - new Date(ServerOfflineCheckDate) > 1000 * 60 * 60) {
            quality -= 5; // Penalize for prolonged offline status
        }
    
        // Update the proxy's quality score
        proxy.Quality = Math.max(0, Math.min(quality, 100)); // Quality between 0 and 100
        return proxy.Quality;
    } catch (error) {
        console.error("Values.js", " :: Error ❌ : ", error);
    }

    
};

// Handle proxy going offline
const Offline = async (proxy) => {

    try {
        const currentTime = new Date().toISOString();

        if (proxy.active) {
            // Proxy just went offline
            proxy.active = false;
            proxy.ServerOfflineCheckDate = currentTime;
            proxy.TotalTimeOffLine += (new Date(currentTime) - new Date(proxy.lastActive)) / 1000; // in seconds
            proxy.currentContinuousTimeAlive = 0; // Reset current uptime
        } else {
            // Proxy was already offline
            proxy.TotalTimeOffLine += (new Date(currentTime) - new Date(proxy.ServerOfflineCheckDate)) / 1000; // in seconds
        }
    
        // Update proxy to reflect the offline status
        proxy.lastActive = currentTime;
        return proxy;

    } catch (error) {
        console.error("Values.js", " :: Error ❌ : ", error);
    }

   
};

// Get Geo Location from IP
const getGeolocation = async (ip) => {
    try {
        const response = await axios.get(`https://ipinfo.io/${ip}/json`);
        if (response.status === 200) {
            const data = response.data;
            return {
                country: data.country || '',
                region: data.region || '',
                city: data.city || '',
                loc: data.loc || ''
            };
        }
    } catch (e) {
        console.error(`Error fetching geolocation for ${ip}:`, e.message);
    }
    return {};
};

module.exports = { getGeolocation, QualityCheck, Offline, proxyTest };

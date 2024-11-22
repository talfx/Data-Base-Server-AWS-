const Data = require('./Data');
const Values = require('./Values');

const formatDateForSQL = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

const ProxyHeartbeat = async (proxyKey) => {
    try {
        const exists = await Data.ExistsSQL(proxyKey);
        if (exists) {
            const proxy = await Data.FetchSingleSQL(proxyKey);
            const now = new Date();
            const lastActive = new Date(proxy.lastActive);
            const timeElapsed = (now - lastActive) / 1000 / 60; // Time elapsed in minutes

            proxy.heartbeatsSent += 1;
            proxy.lastActive = formatDateForSQL(now);  // Format the date for SQL
            proxy.currentContinuousTimeAlive += timeElapsed;
            proxy.totalTimeAlive += timeElapsed;

            await Data.UpdateSingleSQL(proxy); 
            console.log(`Heartbeat received for proxy ${proxyKey}`);
        } else {
            console.log(`Error heartbeat existence for IP: ${proxyKey}`);
        }
    } catch (error) {
        console.error("Heartbeat.js", " :: Error ❌ : ", error);
    }
};


// Checks the status and quality of proxies in the database
const checkProxyHeartbeats = async () => {
    try {
        const proxies = await Data.getAllProxies(); // Fetch all proxies from the DB
        const now = new Date();
        if (!proxies || !Array.isArray(proxies)) {
            console.error("Proxies is undefined or not an array");
            return; // Exit if proxies is not an array
        }
        proxies.forEach((proxy) => {
            const proxyKey = proxy.ip; // Assuming 'ip' is the proxyKey
            const lastActive = new Date(proxy.lastActive);
            const timeSinceLastActive = (now - lastActive) / 1000 / 60; // Time since last active in minutes

            // Check if the proxy is from an external provider and test its connection
            if (proxy.provider !== 'Original') {
                const isProxyActive = Values.proxyTest(proxyKey);
                
                if (isProxyActive) {
                    ProxyHeartbeat(proxyKey);
                    console.log(`Wrong111`);

                } else {
                    Values.Offline(proxy);
                    console.log(`Proxy ${proxyKey} is offline.`);
                }
            }

            // Update the quality of the proxy based on certain conditions
            proxy.Quality = Values.QualityCheck(proxyKey);

            // Mark the proxy as inactive if no heartbeat for more than 60 minutes
            if (timeSinceLastActive > 60) {
                proxy.active = false;
                Values.Offline(proxy);
                console.log(`Proxy ${proxyKey} marked inactive due to inactivity.`);
            }

            // Delete proxies that have been inactive for over a month
            if (timeSinceLastActive > (60 * 24 * 30)) { // ~1 month
                Data.Delete_Inactive(proxyKey);
                console.log(`Proxy ${proxyKey} deleted due to long inactivity.`);
            }

            // Update the proxy data in the database after changes
            Data.UpdateSingleSQL(proxyKey, proxy);
        });

    } catch (error) {
        console.error("Heartbeat.js", " :: Error ❌ : ", error);
    }

};

// Export proxy heartbeat functions
module.exports = {
    checkProxyHeartbeats,
    ProxyHeartbeat,
};

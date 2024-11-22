const mysql = require('mysql2/promise'); // Import mysql2/promise for promise-based API

// Create a connection pool
const pool = mysql.createPool({
    host: '18.224.53.172',
    user: 'Tal',
    password: 'PCfortress9!',
    database: 'proxy_data',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Create a table with the specified features
const CreateMainTable = async () => {
    let connection; // Declare connection outside of try block
    try {
        connection = await pool.getConnection();
        const query = `
            CREATE TABLE IF NOT EXISTS proxies (
                ip VARCHAR(15) PRIMARY KEY,
                port INT,
                protocol VARCHAR(10),
                geolocation VARCHAR(50),
                osType VARCHAR(50),
                platform VARCHAR(50),
                Provider VARCHAR(50),
                active BOOLEAN,
                HTTP BOOLEAN,
                HTTPS BOOLEAN,
                Socks5 BOOLEAN,
                lastActive DATETIME,
                heartbeatsSent INT,
                totalTimeAlive INT,
                longestTimeAlive INT,
                currentContinuousTimeAlive INT,
                TotalTimeOffLine INT,
                ServerOfflineCheckDate DATETIME,
                Quality INT
            )
        `;
        await connection.query(query);
    } catch (err) {
        console.error('Error creating main table:', err.message);
    } finally {
        if (connection) {
            connection.release(); // Ensure the connection is released only if it was created
        }
    }
};


// Delete table content
const DeleteTable = async (name) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = `TRUNCATE TABLE ${name}`;
        await connection.query(query);
        console.log(`Table ${name} content deleted.`);
    } catch (err) {
        console.error('Error deleting table:', err.message);
    } finally {
        if (connection) connection.release(); // Ensure the connection is released
    }
};

// Delete inactive proxies
const Delete_Inactive = async (proxy) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = `DELETE FROM proxies WHERE ip = ?`;
        await connection.query(query, [proxy.ip]);
        console.log(`Inactive proxy ${proxy.ip} deleted.`);
    } catch (err) {
        console.error('Error deleting proxy:', err.message);
    } finally {
        if (connection) connection.release(); // Ensure the connection is released
    }
};

const QueryAddNew = async (proxy) => {
    let connection;
    const query = `INSERT INTO proxies (ip, port, protocol, geolocation, osType, platform, Provider, active, HTTP, HTTPS, Socks5, lastActive, heartbeatsSent, totalTimeAlive, longestTimeAlive, currentContinuousTimeAlive, TotalTimeOffLine, ServerOfflineCheckDate, Quality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const values = [
        proxy.ip,
        proxy.port,
        proxy.protocol,
        proxy.geolocation,
        proxy.osType,
        proxy.platform,
        proxy.Provider,
        proxy.active,
        proxy.HTTP,
        proxy.HTTPS,
        proxy.Socks5,
        proxy.lastActive,
        proxy.heartbeatsSent,
        proxy.totalTimeAlive,
        proxy.longestTimeAlive,
        proxy.currentContinuousTimeAlive,
        proxy.TotalTimeOffLine,
        proxy.ServerOfflineCheckDate,
        proxy.Quality
    ];
    
    try {
        connection = await pool.getConnection();
        await connection.query(query, values);
        console.log(`New proxy ${proxy.ip} added.`);
    } catch (err) {
        console.error('Error adding proxy:', err.message);
    } finally {
        if (connection) connection.release();
    }
};




// Update existing proxy
const QueryUpdateExisting = async (proxy) => {
    let connection;
    const query = `
        UPDATE proxies
        SET port = ?, protocol = ?, geolocation = ?, osType = ?, platform = ?, Provider = ?, active = ?, HTTP = ?, HTTPS = ?, Socks5 = ?, lastActive = ?, heartbeatsSent = ?, totalTimeAlive = ?, longestTimeAlive = ?, currentContinuousTimeAlive = ?, TotalTimeOffLine = ?, ServerOfflineCheckDate = ?, Quality = ?
        WHERE ip = ?
    `;
    const values = [proxy.port, proxy.protocol, proxy.geolocation, proxy.osType, proxy.platform, proxy.Provider, proxy.active, proxy.HTTP, proxy.HTTPS, proxy.Socks5, proxy.lastActive, proxy.heartbeatsSent, proxy.totalTimeAlive, proxy.longestTimeAlive, proxy.currentContinuousTimeAlive, proxy.TotalTimeOffLine, proxy.ServerOfflineCheckDate, proxy.Quality, proxy.ip];

    try {
        connection = await pool.getConnection();
        await connection.query(query, values);
    } catch (err) {
        console.error('Error updating proxy:', err.message);
    } finally {
        if (connection) connection.release(); // Ensure the connection is released
    }
};

// Fetch a single proxy
const FetchSingleSQL = async (ip) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = `SELECT * FROM proxies WHERE ip = ?`;
        const [results] = await connection.query(query, [ip]);
        return results[0];  // return first match
    } catch (err) {
        console.error('Error fetching proxy: ' + err);
    } finally {
        if (connection) connection.release(); // Ensure the connection is released
    }
};

// Check if a proxy exists
const ExistsSQL = async (ip) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = `SELECT COUNT(*) AS count FROM proxies WHERE ip = ?`;
        const [results] = await connection.query(query, [ip]);
        return results[0].count > 0;  // true if exists, false otherwise
    } catch (err) {
        console.error('Error checking existence: ' + err);
    } finally {
        if (connection) connection.release(); // Ensure the connection is released
    }
};

// Update or insert a single proxy
const UpdateSingleSQL = async (proxy) => {
    const exists = await ExistsSQL(proxy.ip);
    if (exists) {
        await QueryUpdateExisting(proxy);  // update if exists
    } else {
        console.log('Error heartbeat existance for ip:',proxy.ip);
    }
};

// Fetch all proxies
const FetchAll = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        const query = `SELECT * FROM proxies`;
        const [results] = await connection.query(query);
        return results;  // Return all rows as a result
    } catch (err) {
        console.error('Error fetching all proxies: ' + err);
    } finally {
        if (connection) connection.release(); // Ensure the connection is released
    }
};

// Fetch all proxies with logging
async function getAllProxies() {
    try {
        const allProxies = await FetchAll();
        return allProxies;  // Process the list of proxies
    } catch (err) {
        console.error(err);  // Handle error if fetching fails
    }
}

// Fetch proxies based on dynamic conditions
const FetchSQL = async (ProviderName) => {
    let connection;
    try {
        connection = await pool.getConnection();
        let query = `SELECT * FROM proxies WHERE 1=1`;
        const values = [];

        if (ProviderName !== null) {
            query += ` AND Provider = ?`;
            values.push(ProviderName);
        }

        const [results] = await connection.query(query, values);
        return results;
    } catch (err) {
        console.error('Error fetching data from SQL: ' + err);
    } finally {
        if (connection) connection.release(); // Ensure the connection is released
    }
};

// Fetch proxies based on provider with logging
async function FetchBasedOnProvider(ProviderName) {
    try {
        const results = await FetchSQL(ProviderName);
        return results;  // Handle the results, e.g., return it from an API response
    } catch (err) {
        console.error(err);  // Handle error
        return null;  // Or some other error handling response
    }
}

// Export functions and initialization
module.exports = {
    pool,
    CreateMainTable,
    FetchBasedOnProvider,
    DeleteTable,
    Delete_Inactive,
    QueryAddNew,
    QueryUpdateExisting,
    FetchSingleSQL,
    UpdateSingleSQL,
    ExistsSQL,
    getAllProxies
};

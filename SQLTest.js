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
    try {
        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Query to create the table if it doesn't exist
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

        // Execute the query
        await connection.query(query);
        console.log('Table "proxies" created or already exists.');

        // Release the connection back to the pool
        connection.release();
    } catch (err) {
        console.error('Error creating table:', err.message);
    }
};
CreateMainTable();
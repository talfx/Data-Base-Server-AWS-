const mysql = require('mysql2/promise');

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

const FetchSQL = async (ProviderName, GeoLocation, Active) => {
    let connection;
    try {
        connection = await pool.getConnection();
        let query = `SELECT * FROM proxies WHERE 1=1`;
        const values = [];

        if (ProviderName !== null) {
            query += ` AND Provider = ?`;
            values.push(ProviderName);
        }
        if (GeoLocation !== null) {
            query += ` AND geolocation = ?`;
            values.push(GeoLocation);
        }
        if (Active !== null) {
            query += ` AND active = ?`;
            values.push(Active);
        }

        const [results] = await connection.query(query, values);
        console.log('pass1');
        return results;
    } catch (err) {
        console.error('Error fetching data from SQL:', err.message);
    } finally {
        if (connection) connection.release(); // Ensure the connection is released
        console.log('pass2');
    }
};

// Test the connection by calling FetchSQL
FetchSQL('SomeProvider', 'US', 1)
    .then((results) => {
        console.log('Results:', results);
    })
    .catch((err) => {
        console.error('Test failed:', err.message);
    });
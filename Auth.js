const { pool } = require('./Data');  // assuming you have db.js that exports MySQL connection

// Create table in SQL for auth with name, API, and date features.
const CreateTable = async () => {
    try {
        const connection = await pool.getConnection();
        const query = `CREATE TABLE IF NOT EXISTS Auth (
            name VARCHAR(255) PRIMARY KEY,
            apiKey VARCHAR(255) NOT NULL,
            date DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
        await connection.query(query);
        
        // Insert first row only if the table is newly created
        const insertFirstRow = `INSERT IGNORE INTO Auth (name, apiKey, date) VALUES ('Original', 'A1B2C3D4E5F6G8', NOW())`;
        await connection.query(insertFirstRow);

        connection.release();
    } catch (err) {
        console.error('Error creating Auth table:', err.message);
    }
};

// Save new key to DB
const NewKeyToDB = async (name, API, date) => {
    try {
        const connection = await pool.getConnection();
        const query = `INSERT INTO Auth (name, apiKey, date) VALUES (?, ?, ?) 
                       ON DUPLICATE KEY UPDATE apiKey=VALUES(apiKey), date=VALUES(date)`;
        await connection.query(query, [name, API, date]);
        connection.release();
    } catch (err) {
        console.error('Error saving new key to Auth table:', err.message);
    }
};

// Delete entry based on name (key)
const DeleteFromDB = async (name) => {
    try {
        const connection = await pool.getConnection();
        const query = `DELETE FROM Auth WHERE name = ?`;
        await connection.query(query, [name]);
        connection.release();
    } catch (err) {
        console.error('Error deleting from Auth table:', err.message);
    }
};

// Fetch all data from Auth table
const GetAllFromAuth = async () => {
    try {
        const connection = await pool.getConnection();
        const [results] = await connection.query(`SELECT * FROM Auth`);
        connection.release();
        return results;
    } catch (err) {
        console.error('Error fetching all data from Auth table:', err.message);
        return [];
    }
};

// Check API key validity for /bulk
const isValidApiKey = async (apiKey) => {
    try {
        const connection = await pool.getConnection();
        const [results] = await connection.query(`SELECT * FROM Auth WHERE apiKey = ? AND apiKey != 'A1B2C3D4E5F6G8'`, [apiKey]);
        connection.release();
        return results.length > 0;  // return true if key exists
    } catch (err) {
        console.error('Error checking API key validity:', err.message);
        return false;
    }
};

// Check for a specific pre-defined key (isSingleValidApiKey)
const isSingleValidApiKey = (apiKey) => {
    return apiKey === 'A1B2C3D4E5F6G8';  // Predefined valid key
};

// Search name by API key
const searchNameByAPI = async (apiKey) => {
    try {
        const connection = await pool.getConnection();
        const [results] = await connection.query(`SELECT name FROM Auth WHERE apiKey = ?`, [apiKey]);
        connection.release();
        return results.length > 0 ? results[0].name : null;
    } catch (err) {
        console.error('Error searching name by API key:', err.message);
        return null;
    }
};

// Search name in the DB
const SearchNameInDB = async (name) => {
    try {
        const connection = await pool.getConnection();
        const [results] = await connection.query(`SELECT name FROM Auth WHERE name = ?`, [name]);
        connection.release();
        return results.length > 0 ? results[0].name : null;
    } catch (err) {
        console.error('Error searching name:', err.message);
        return null;
    }
};

// Generate and save a new API key to DB
const generateApiKey = async (name) => {
    const newApiKey = Math.random().toString(36).substring(2, 14).toUpperCase();  // Generate a random 12-character API key
    const date = new Date();  // Current date in Date format
    await NewKeyToDB(name, newApiKey, date);  // Save the new key to the database
    return { name, newApiKey, date };
};

const authenticate = (req, res, next) => {
    if (req.path === '/bulk') {
        return next();
    }

    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        // Send 401 and prompt the browser for authentication
        res.setHeader('WWW-Authenticate', 'Basic realm="Access to the site"');
        return res.status(401).send('Authentication required');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (username === 'PrecisionData' && password === 'PCfortress9!') {
        return next();  // Allow access
    } else {
        return res.status(403).send('Invalid credentials');
    }
};

module.exports = {
    authenticate,
    generateApiKey,
    CreateTable,
    NewKeyToDB,
    DeleteFromDB,
    isValidApiKey,
    searchNameByAPI,
    GetAllFromAuth,
    isSingleValidApiKey,
    SearchNameInDB
};

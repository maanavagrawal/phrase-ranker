require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();

// Log environment status (without sensitive data)
console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasMysqlUrl: !!process.env.MYSQL_PUBLIC_URL,
    hasFrontendUrl: !!process.env.FRONTEND_URL
});

// Enable CORS with more detailed logging
app.use(cors({
    origin: process.env.FRONTEND_URL === '*' 
        ? '*'  // Allow all origins in development
        : ['https://phrase-ranker-1q7e.vercel.app', 'http://localhost:3001'],  // Restrict in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

// Log all requests (without sensitive data)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use(bodyParser.json());
app.use(express.json());

// Create a connection pool using environment variables
let pool;
try {
    if (!process.env.MYSQL_PUBLIC_URL) {
        throw new Error('MYSQL_PUBLIC_URL environment variable is not set');
    }

    pool = mysql.createPool({
        uri: process.env.MYSQL_PUBLIC_URL,
        ssl: {
            rejectUnauthorized: false
        },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    console.log('Database pool created successfully');
} catch (err) {
    console.error('Error creating database pool:', err.message);
}

// Convert pool to use promises
const promisePool = pool?.promise();

// Test database connection
if (pool) {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Database connection error:', err.message);
            return;
        }
        console.log('Database connected successfully');
        connection.release();
    });
}

// Test endpoint to verify API and database are working
app.get('/api/test', async (req, res) => {
    try {
        if (!pool) {
            throw new Error('Database pool not initialized');
        }

        // Test database connection with a simple query
        const [rows] = await promisePool.query('SELECT 1 as test');
        console.log('Database test query successful:', rows);
        
        // Try to get list of tables
        const [tables] = await promisePool.query('SHOW TABLES');
        console.log('Available tables:', tables);
        
        res.json({ 
            message: 'API and database are working',
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV,
            database: {
                connected: true,
                tables: tables.map(t => Object.values(t)[0])
            }
        });
    } catch (err) {
        console.error('Test endpoint error:', {
            code: err.code,
            errno: err.errno,
            sqlState: err.sqlState,
            sqlMessage: err.sqlMessage,
            message: err.message
        });
        res.status(500).json({ 
            error: 'Database connection error',
            details: process.env.NODE_ENV === 'development' ? err.message : 'Please check your database configuration'
        });
    }
});

// Initialize database tables
async function initializeDatabase() {
    try {
        const createPhrasesTable = `
            CREATE TABLE IF NOT EXISTS phrases (
                id INT AUTO_INCREMENT PRIMARY KEY,
                text VARCHAR(255) NOT NULL,
                elo_rating FLOAT DEFAULT 1500,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createComparisonsTable = `
            CREATE TABLE IF NOT EXISTS comparisons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                phrase1_id INT,
                phrase2_id INT,
                winner_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (phrase1_id) REFERENCES phrases(id),
                FOREIGN KEY (phrase2_id) REFERENCES phrases(id),
                FOREIGN KEY (winner_id) REFERENCES phrases(id)
            )
        `;

        await promisePool.query(createPhrasesTable);
        console.log('Phrases table created or already exists');
        await promisePool.query(createComparisonsTable);
        console.log('Comparisons table created or already exists');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

// Initialize database on startup
initializeDatabase();

app.get('/', (req, res) => {
    res.json({ message: 'Phrase Ranker API is running' });
});

app.get('/api/phrases/compare', (req, res) => {
    const query = `
        SELECT id, text, elo_rating 
        FROM phrases 
        ORDER BY RAND() 
        LIMIT 2
    `;
    
    promisePool.query(query).then(([results]) => {
        res.json(results);
    }).catch((err) => {
        res.status(500).json({ error: err.message });
    });
});

app.post('/api/phrases', (req, res) => {
    const { text } = req.body;
    if (!text) {
        res.status(400).json({ error: 'Phrase text is required' });
        return;
    }

    const query = 'INSERT INTO phrases (text) VALUES (?)';
    promisePool.query(query, [text]).then(([result]) => {
        res.status(201).json({ id: result.insertId, text, elo_rating: 1500 });
    }).catch((err) => {
        res.status(500).json({ error: err.message });
    });
});

app.post('/api/phrases/compare', (req, res) => {
    const { phrase1_id, phrase2_id, winner_id } = req.body;
    
    if (!phrase1_id || !phrase2_id || !winner_id) {
        res.status(400).json({ error: 'All phrase IDs are required' });
        return;
    }

    const comparisonQuery = 'INSERT INTO comparisons (phrase1_id, phrase2_id, winner_id) VALUES (?, ?, ?)';
    promisePool.query(comparisonQuery, [phrase1_id, phrase2_id, winner_id]).then(() => {
        const getRatingsQuery = 'SELECT id, elo_rating FROM phrases WHERE id IN (?, ?)';
        return promisePool.query(getRatingsQuery, [phrase1_id, phrase2_id]);
    }).then(([results]) => {
        const K = 32;
        const r1 = Math.pow(10, results[0].elo_rating / 400);
        const r2 = Math.pow(10, results[1].elo_rating / 400);
        const e1 = r1 / (r1 + r2);
        const e2 = r2 / (r1 + r2);
        
        const s1 = results[0].id === winner_id ? 1 : 0;
        const s2 = results[1].id === winner_id ? 1 : 0;
        
        const newRating1 = results[0].elo_rating + K * (s1 - e1);
        const newRating2 = results[1].elo_rating + K * (s2 - e2);

        const updateQuery = 'UPDATE phrases SET elo_rating = CASE id WHEN ? THEN ? WHEN ? THEN ? END WHERE id IN (?, ?)';
        return promisePool.query(updateQuery, [phrase1_id, newRating1, phrase2_id, newRating2, phrase1_id, phrase2_id]);
    }).then(() => {
        res.json({ message: 'Ratings updated successfully' });
    }).catch((err) => {
        res.status(500).json({ error: err.message });
    });
});

app.get('/api/phrases/ranked', (req, res) => {
    const query = 'SELECT id, text, elo_rating FROM phrases ORDER BY elo_rating DESC';
    promisePool.query(query).then(([results]) => {
        res.json(results);
    }).catch((err) => {
        res.status(500).json({ error: err.message });
    });
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Export the Express API
module.exports = app;

// Only start the server if this file is run directly (not imported)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}



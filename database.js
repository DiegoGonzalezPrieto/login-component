const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'users.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

// Initialize database with users table
function initDatabase() {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.run(createTableSQL, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Users table ready');
        }
    });
}

// Database operations
const database = {
    // Create a new user
    createUser: (user) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO users (id, username, email, password, created_at)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            db.run(sql, [user.id, user.username, user.email, user.password, user.createdAt], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...user });
                }
            });
        });
    },

    // Find user by email
    findUserByEmail: (email) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE email = ?';
            
            db.get(sql, [email], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    // Get all users (for debugging)
    getAllUsers: () => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT id, username, email, created_at FROM users';
            
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    // Check if user exists by email
    userExists: (email) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
            
            db.get(sql, [email], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count > 0);
                }
            });
        });
    },

    // Get user count
    getUserCount: () => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT COUNT(*) as count FROM users';
            
            db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    },

    // Close database connection
    close: () => {
        return new Promise((resolve) => {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
                resolve();
            });
        });
    }
};

module.exports = database; 
const mysql = require('mysql2/promise');
const achievements = require('./src/AchievementData').default;
const secrets = require('./secrets');

// Function to sanitize column names
function sanitizeColumnName(title) {
  // Remove all spaces and punctuation, keep only alphanumeric characters
  let sanitized = title.replace(/[^a-zA-Z0-9]/g, '');
  
  // Ensure it starts with a letter (MySQL requirement)
  if (!/^[a-zA-Z]/.test(sanitized)) {
    sanitized = 'achievement_' + sanitized;
  }
  
  // Limit length to 64 characters (MySQL column name limit)
  if (sanitized.length > 64) {
    sanitized = sanitized.substring(0, 64);
  }
  
  return sanitized;
}

// Database configuration
const dbConfig = {
    host: secrets.DB_HOST,
    user: secrets.DB_USER,
    password: secrets.DB_PASSWORD,
    port: secrets.DB_PORT,
};

async function addAchievementColumns() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');
    
    // Process each achievement
    for (const achievement of achievements) {
      const columnName = achievement.title;
      const alterQuery = `ALTER TABLE achievements ADD COLUMN \`${columnName}\` BOOLEAN DEFAULT FALSE`;
      
      try {
        await connection.query(alterQuery);
        console.log(`✓ Added column: ${columnName}`);
      } catch (err) {
        // Check if error is due to duplicate column
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`- Column already exists: ${columnName}`);
        } else {
          // Log other errors but continue
          console.error(`✗ Error adding column ${columnName}:`, err.message);
        }
      }
    }
    
    console.log('\nScript completed successfully!');
    
  } catch (err) {
    console.error('Database connection error:', err.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the script
addAchievementColumns();
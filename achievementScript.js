import mysql from 'mysql';
import { promisify } from 'util';
import achievements from './src/AchievementData';
import { DB_HOST, DB_PASSWORD, DB_USER, DB_PORT } from './src/secrets';

// Database configuration
const dbConfig = {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
};

// Function to sanitize column names - removes spaces, punctuation, and special characters
function sanitizeColumnName(title) {
  // Remove all non-alphanumeric characters (keeps only letters and numbers)
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

async function addAchievementColumns() {
  // Create database connection
  const connection = mysql.createConnection(dbConfig);
  
  // Promisify the query function
  const query = promisify(connection.query).bind(connection);
  
  try {
    // Connect to database
    await promisify(connection.connect).bind(connection)();
    console.log('Connected to database');
    
    // Process each achievement
    for (const achievement of achievements) {
      const originalTitle = achievement.title;
      const columnName = sanitizeColumnName(originalTitle);
      const alterQuery = `ALTER TABLE achievements ADD COLUMN ${columnName} BOOLEAN DEFAULT FALSE`;
      
      try {
        await query(alterQuery);
        console.log(`✓ Added column: ${columnName} (from "${originalTitle}")`);
      } catch (err) {
        // Check if error is due to duplicate column
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`- Column already exists: ${columnName} (from "${originalTitle}")`);
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
    // Close connection
    connection.end();
    console.log('Database connection closed');
  }
}

// Run the script
addAchievementColumns();
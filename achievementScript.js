import mysql from 'mysql';
import { promisify } from 'util';
import { DB_HOST, DB_PASSWORD, DB_USER, DB_PORT } from './src/secrets';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import BookIcon from '@mui/icons-material/Book';
import StarRateIcon from '@mui/icons-material/StarRate';
import CreateIcon from '@mui/icons-material/Create';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import BoltIcon from '@mui/icons-material/Bolt';

const achievements = [
    {
      title: "First Steps",
      description: "Log in for the first time",
      current: currentUser.daysUsed,
      target: 1,
      difficulty: 0,
      image: <CalendarMonthIcon/>
    },
    {
      title: "Hiker",
      description: "View a fact in your range",
      current: currentUser.factsViewed,
      target: 1,
      difficulty: 0,
      image: <BookIcon/>
    },
    {
      title: "Make Your Mark",
      description: "Add your first fact",
      current: currentUser.factsPlaced,
      target: 1,
      difficulty: 0,
      image: <CreateIcon/>
    },
    {
      title: "Studied",
      description: "Reach level 5",
      current: currentUser.level,
      target: 5,
      difficulty: 0,
      image: <BoltIcon/>
    },
    {
      title: "Hey, you came back!",
      description: "A long weekend's worth of logins",
      current: currentUser.daysUsed,
      target: 3,
      difficulty: 1,
      image: <CalendarMonthIcon/>
    },
    {
      title: "Experienced",
      description: "Reach level 15",
      current: currentUser.level,
      target: 15,
      difficulty: 1,
      image: <BoltIcon/>
    },
    {
      title: "Bushwhacker",
      description: "View several facts",
      current: currentUser.factsViewed,
      target: 10,
      difficulty: 1,
      image: <BookIcon/>
    },
    {
      title: "Contributor",
      description: "Add a few more facts",
      current: currentUser.factsPlaced,
      target: 10,
      difficulty: 1,
      image: <CreateIcon/>
    },
    {
      title: "Regular User",
      description: "A week's worth of logins",
      current: currentUser.daysUsed,
      target: 7,
      difficulty: 2,
      image: <CalendarMonthIcon/>
    },
    {
      title: "Expert",
      description: "Reach level 30",
      current: currentUser.level,
      target: 30,
      difficulty: 2,
      image: <BoltIcon/>
    },
    {
      title: "World Traveller",
      description: "View lots of facts",
      current: currentUser.factsViewed,
      target: 50,
      difficulty: 2,
      image: <BookIcon/>
    },
    {
      title: "Cartographacter",
      description: "Add a couple dozen facts. And then one more",
      current: currentUser.factsPlaced,
      target: 25,
      difficulty: 2,
      image: <CreateIcon/>
    },
    {
      title: "Power User",
      description: "A whole month's worth of logins",
      current: currentUser.daysUsed,
      target: 30,
      difficulty: 3,
      image: <CalendarMonthIcon/>
    },
    {
      title: "Rick Steves",
      description: "View way too many facts",
      current: currentUser.factsViewed,
      target: 300,
      difficulty: 3,
      image: <BookIcon/>
    },
    {
      title: "Staple of the Community",
      description: "Sprinkle four dozen facts around. And then a couple more",
      current: currentUser.factsPlaced,
      target: 50,
      difficulty: 3,
      image: <CreateIcon/>
    },
    {
      title: "No More Impostor Syndrome",
      description: "Reach level 50",
      current: currentUser.level,
      target: 50,
      difficulty: 3,
      image: <BoltIcon/>
    },
  ];

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
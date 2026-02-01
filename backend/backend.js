//#region imports

const express = require('express');
const bodyParser = require('body-parser');
const secrets = require('./secrets');
const { v4: uuidv4 } = require('uuid');
const sql = require('mysql');
const cors = require("cors");
const { OAuth2Client } = require('google-auth-library');
const cookieParser = require('cookie-parser');
const util = require("util");
const jwt = require('jsonwebtoken');
const { useJsApiLoader } = require('@react-google-maps/api');

//#endregion

//#region initializers

const initFetch = async () => {
  console.log("Attempting header load\n");
  const nodeFetch = await import('node-fetch');
  global.fetch = nodeFetch.default;
  global.Headers = nodeFetch.Headers;
  global.Request = nodeFetch.Request;
  global.Response = nodeFetch.Response;
  global.Blob = nodeFetch.Blob;
  global.FormData = nodeFetch.FormData;
  global.File = nodeFetch.File;
  console.log("Loaded every fetch global\n");
};

(async () => {
    await initFetch();
})();

const appPort = 3330;
const app = express();
const oauthClient = new OAuth2Client(secrets.GOOGLE_LOGIN_CLIENT_ID);
const VALID_CLIENT_TOKEN = secrets.CLIENT_AUTH_SECRET;
app.use(bodyParser.json());
app.use(cookieParser());

const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Access-Control-Allow-Origin", "Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  credentials: true
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

const pool = sql.createPool({
    host: secrets.DB_HOST,
    user: secrets.DB_USER,
    password: secrets.DB_PASSWORD,
    port: secrets.DB_PORT,
    database: secrets.DB_NAME
    // pool: {
    //     max: 30,
    //     min: 0,
    //     idleTimeoutMillis: 30000
    // }
});

//#endregion

//#region security

const JWT_SECRET = secrets.JWT_SECRET;

const authenticateToken = (req, res, next) => {
    // Get the authorization header value: "Bearer TOKEN"
    const authHeader = req.headers['authorization'];

    // Extract the token part: "TOKEN"
    // If authHeader is present, get the second element of the split array (index 1)
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // If no token is provided, return 401 Unauthorized
        return res.sendStatus(401);
    }

    if (token !== VALID_CLIENT_TOKEN) {
        // If the token is invalid or expired, return 403 Forbidden
        return res.sendStatus(403);
    }

    // Proceed to the next middleware or route handler
    next();
};

//#endregion

//#region helper functions

const promiseQuery = util.promisify(pool.query).bind(pool);

// Function to sanitize achievement names - removes spaces, punctuation, and special characters
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

function calculateXPForLevel(level) {
    if (level <= 1) return 0;
    
    // Base XP for level 2
    const baseXP = 50;
    
    // Logarithmic growth factor
    const growthFactor = 1.15;
    
    // Calculate XP needed for this level using logarithmic scaling
    const xp = baseXP * Math.pow(growthFactor, level - 2);
    
    // Round to nearest whole number
    return Math.round(xp);
}

function checkIfLeveledUp(currentLevel, currentXP, xpToAdd) {
    let newLevel;
    let newXP;
    let xpNeeded = calculateXPForLevel(currentLevel + 1);

    if (currentXP + xpToAdd >= xpNeeded) {
        newLevel = currentLevel + 1;
        newXP = (currentXP + xpToAdd) - xpNeeded;
        return [true, newLevel, newXP];
    } else {
        return [false];
    }
}

const handleXPLevelAndRange = async (id, updatedStat, oldStatValue, newStatValue, currentLevel, currentXP, currentRange) => {
    let xpToAdd = 0;

    if (!id) {
        console.error('Must submit a user ID for valid level calc');
        return {error: true};
    }

    if (!updatedStat) {
        console.error('Must submit a stat that changed for valid level calc');
        return {error: true};
    }

    // First determine whether we need to update:
    // 1. just xp
    // 2. xp & level & range
    // Different stats have different xp values
    if (updatedStat == "daysUsed") {
        // This can only ever go up by one, so xp addition is static
        xpToAdd += 25;
    } else if (updatedStat == "factsViewed") {
        for (let i = oldStatValue; i < newStatValue; i++) {
            xpToAdd += 5;
        }
    } else if (updatedStat == "factsPlaced") {
        for (let i = oldStatValue; i < newStatValue; i++) {
            xpToAdd += 50;
        }
    }
    
    // Now we check if we should update level and therefore also range
    // And if we level up, we need to reset the xp value then add back any that went over the level requirement

    let levelResults = checkIfLeveledUp(currentLevel, currentXP, xpToAdd);
    let jsonOut = {error: true, msg: "async issue!"};
    if (levelResults[0]) {
        // We need to update xp, level, and range
        let calculatedRange = 100 + 50 * Math.log2(levelResults[1] + 1);
        await pool.query("UPDATE stats SET level=?, xp=?, userRange=? WHERE id=?", [levelResults[1], levelResults[2], calculatedRange, id]);

        const rows = await promiseQuery("SELECT * FROM stats WHERE id=?", [id]);              

        jsonOut = {error: false, leveled: true, user: rows[0]};

    } else {

        // We only need to update internal xp

        await pool.query("UPDATE stats SET xp=xp+? WHERE id=?", [xpToAdd, id]);

        const rows = await promiseQuery("SELECT * FROM stats WHERE id=?", [id]);              

        jsonOut = {error: false, leveled: false, user: rows[0]};
    }

    return jsonOut;
}

//#endregion

//#region additions
app.post('/add_fact', authenticateToken, async (req, res) => {
    let inTitle = req.body.title;
    let inDescription = req.body.description;
    let inLat = req.body.lat;
    let inLng = req.body.lng;
    let inCategory = req.body.category;
    let inUserID = req.body.userID;
    let inUserName = req.body.username;

    if (!inTitle) {
        return res.status(400).json('Title cannot be blank');
    }

    if (!inDescription) {
        return res.status(400).json('Description cannot be blank');
    }

    if (!inLat) {
        return res.status(400).json('Lattitude cannot be blank');
    }

    if (!inLng) {
        return res.status(400).json('Longitude cannot be blank');
    }

    if (!inCategory) {
        return res.status(400).json('Category cannot be blank');
    }

    if (!inUserID) {
        return res.status(400).json('Submitting user id cannot be blank');
    }

    if (!inUserName) {
        return res.status(400).json('Submitting username cannot be blank');
    }

    // Generate a uuid for this entry
    let newID = uuidv4();

    await pool.query("INSERT INTO facts (id, title, description, lat, lng, category, user, username) VALUES(UNHEX(REPLACE(?, '-', '')),?,?,?,?,UNHEX(?),?,?)", [newID, inTitle, inDescription, inLat, inLng, inCategory, inUserID, inUserName], 
        function(err, rows) {
            if (err) {
                console.log("Error inserting into facts: %s", err);
                return res.status(400).json('Error inserting into facts, see backend console for details');
            } else {
                return res.status(200).json('Fact successfully inserted');
            }
        }
    );
});

app.post('/add_category', authenticateToken, async (req, res) => {
    let categoryTitle = req.body.title;
    let categoryPrivacy = req.body.privacy;
    let categoryOwner = req.body.ownerID;

    if (!categoryTitle) {
        return res.status(400).json('Title cannot be blank');
    }

    // Generate a uuid for this category
    let newID = uuidv4();

    try {
        if (categoryPrivacy) {
            if (!categoryOwner) {
                return res.status(400).json('Private categories require an owner id');
            }

            await promiseQuery("INSERT INTO categories (id, title, private, owner) VALUES(UNHEX(REPLACE(?, '-', '')),?,?,?)", [newID, categoryTitle, true, categoryOwner]);
            await promiseQuery(`UPDATE users SET private_access_array = JSON_ARRAY_APPEND(COALESCE(private_access_array, JSON_ARRAY()), '$', ?) WHERE id = ?`, [newID, categoryOwner]);

            return res.status(200).json('Added private category');
        } else {
            await promiseQuery("INSERT INTO categories (id, title, private) VALUES(UNHEX(REPLACE(?, '-', '')),?,?)", [newID, categoryTitle, false]);

            return res.status(200).json('Added category');
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

app.post('/add_user_to_private_category', authenticateToken, async (req, res) => {
    let inID = req.body.userID;
    let inCatID = req.body.catID;
    let inEmail = req.body.email;

    if (!inID && !inEmail) {
        return res.status(400).json('Must submit an ID or email for valid user addition');
    }

    if (!inCatID) {
        return res.status(400).json('Must submit a category ID for valid user addition');
    }

    // If we don't have an id, get it from users with the email
    if (!inID) {
        const rows = await promiseQuery(`SELECT id FROM users WHERE email=?`, [inEmail]);
        inID = rows[0].id;
    }

    try {
        await promiseQuery(`UPDATE users SET private_access_array = JSON_ARRAY_APPEND(COALESCE(private_access_array, JSON_ARRAY()), '$', ?) WHERE id = ?`, [inCatID, inID]);

        return res.status(200);
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});
//#endregion

//#region deletions
app.post('/remove_fact_by_id', authenticateToken, async (req, res) => {
    let inID = req.body.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid deletion');
    }

    await pool.query("DELETE FROM facts WHERE id=UNHEX(?) ", [inID], 
        function(err, result) {
            if (err || result.affectedRows === 0) {
                console.log("Error removing fact: %s", err);
                return res.status(400).json('Error removing fact, see backend console for details');
            } else {
                return res.status(200).json('Fact successfully removed');
            }
        }
    );
});

app.post('/remove_category_by_id', authenticateToken, async (req, res) => {
    let inID = req.body.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid deletion');
    }

    await pool.query("DELETE FROM categories WHERE id=UNHEX(?) ", [inID], 
        async function(err, rows) {
            if (err) {
                console.log("Error removing category: %s", err);
                return res.status(400).json('Error removing category, see backend console for details');
            } else {
                // Search through ALL users and remove this category from their array if it exists
                await promiseQuery(`UPDATE users SET private_access_array = JSON_REMOVE(private_access_array, JSON_UNQUOTE(JSON_SEARCH(private_access_array, 'one', ?)))`, [inID]);
                return res.status(200).json('Category successfully removed');
            }
        }
    );
});

app.post('/remove_user_by_id', authenticateToken, async (req, res) => {
    let inID = req.body.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid deletion');
    }

    await pool.query("DELETE users, stats FROM users INNER JOIN stats WHERE users.id=? AND stats.id=?", [inID, inID], 
        function(err, rows) {
            if (err) {
                console.log("Error removing user: %s", err);
                return res.status(400).json('Error removing user, see backend console for details');
            } else {
                return res.status(200).json('User successfully removed');
            }
        }
    );
});

app.post('/remove_user_from_private_category', authenticateToken, async (req, res) => {
    let inID = req.body.userID;
    let inCatID = req.body.catID;
    let inEmail = req.body.email;

    if (!inID && !inEmail) {
        return res.status(400).json('Must submit an ID or an email for valid user addition');
    }

    if (!inCatID) {
        return res.status(400).json('Must submit a category ID for valid user addition');
    }

    // If we don't have an id, get it from users with the email
    if (!inID) {
        const rows = await promiseQuery(`SELECT id FROM users WHERE email=?`, [inEmail]);
        inID = rows[0].id;
    }

    try {
        await promiseQuery(`UPDATE users SET private_access_array = JSON_REMOVE(private_access_array, JSON_UNQUOTE(JSON_SEARCH(private_access_array, 'one', ?))) WHERE id = ?`, [inCatID, inID]);
        return res.status(200);
    } catch (err) {
        console.log(err);
        return res.status(400).json(err);
    }
});

app.post('/remove_all_facts_in_category', authenticateToken, async (req, res) => {
    let inID = req.body.id;

    if (!inID) {
        return res.status(400).json('Must submit a category for valid deletion');
    }

    await pool.query("DELETE FROM facts WHERE category=UNHEX(?) ", [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error removing facts: %s", err);
                return res.status(400).json('Error removing facts, see backend console for details');
            } else {
                return res.status(200).json('Facts successfully removed');
            }
        }
    );
});

app.post('/remove_all_categories', authenticateToken, async (req, res) => {
    await pool.query("TRUNCATE TABLE categories", 
        function(err, rows) {
            if (err) {
                console.log("Error removing category: %s", err);
                return res.status(400).json('Error removing category, see backend console for details');
            } else {
                // Also remove all category keys from users
                promiseQuery("UPDATE users SET private_access_array=NULL");
                return res.status(200).json('Category successfully removed');
            }
        }
    );
});

app.post('/remove_all_facts', authenticateToken, async (req, res) => {
    await pool.query("TRUNCATE TABLE facts",
        function(err, rows) {
            if (err) {
                console.log("Error removing fact: %s", err);
                return res.status(400).json('Error removing fact, see backend console for details');
            } else {
                return res.status(200).json('Fact successfully removed');
            }
        }
    );
});
//#endregion

//#region get-all
app.get('/get_all_facts', async (req, res) => {
    await pool.query("SELECT *, HEX(id) AS id, HEX(category) AS category FROM facts", 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving facts: %s", err);
                return res.status(400).json('Error retrieving facts, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_all_categories', async (req, res) => {
    await pool.query("SELECT *, HEX(id) AS id FROM categories", 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving categories: %s", err);
                return res.status(400).json('Error retrieving categories, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_all_user_allowed_categories', async (req, res) => {
    let userID = req.query.id;

    if (!userID) {
        return res.status(400).json("userID is required to fetch relevant categories");
    }
    
    // This query gets all the categories a user has access to, then joins
    // With all public categories.
    try {
        const categories = await promiseQuery(`
            SELECT c.*, HEX(c.id) AS id 
            FROM categories c
            LEFT JOIN users u ON u.id = ?
            WHERE (c.private IS NULL OR c.private = 0)
                OR JSON_CONTAINS(u.private_access_array, JSON_QUOTE(c.id))
        `, [userID]);

        return res.status(200).json(categories);
    } catch (err) {
        console.log(err);
        return res.status(400).json(err);
    }
});

app.get('/get_all_users', async (req, res) => {
    await pool.query("SELECT * FROM users", 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving users: %s", err);
                return res.status(400).json('Error retrieving users, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_all_users_with_stats', async (req, res) => {
    await pool.query("SELECT * FROM users JOIN stats USING (id)", 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving users: %s", err);
                return res.status(400).json('Error retrieving users, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_all_users_with_achievements', async (req, res) => {
    await pool.query("SELECT * FROM users JOIN achievements USING (id)", 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving users: %s", err);
                return res.status(400).json('Error retrieving users, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});
//#endregion

//#region get-specific

app.get('/get_fact_by_id', async (req, res) => {
    let inID = req.query.id;
    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    try {
        const rows = await promiseQuery("SELECT * FROM facts WHERE id=UNHEX(?)", [inID]);
        return res.status(200).json(rows);
    } catch (err) {
        console.log("Error retrieving fact: %s", err);
        return res.status(400).json('Error retrieving fact, see backend console for details');
    }
});

app.get('/get_category_by_id', async (req, res) => {
    let inID = req.query.id;
    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    try {
        const rows = await promiseQuery("SELECT * FROM categories WHERE id=UNHEX(?)", [inID]);
        return res.status(200).json(rows);
    } catch (err) {
        console.log("Error retrieving category: %s", err);
        return res.status(400).json('Error retrieving category, see backend console for details');
    }
});

app.get('/get_all_facts_of_category', async (req, res) => {
    let inID = req.body.category;
    if (!inID) {
        return res.status(400).json('Must submit an Category for valid access');
    }
    
    try {
        const rows = await promiseQuery("SELECT * FROM facts WHERE category=UNHEX(?)", [inID]);
        return res.status(200).json(rows);
    } catch (err) {
        console.log("Error retrieving facts: %s", err);
        return res.status(400).json('Error retrieving facts, see backend console for details');
    }
});

app.get('/get_all_owned_categories', async (req, res) => {
    let inID = req.query.id;
    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    try {
        const rows = await promiseQuery("SELECT * FROM categories WHERE owner=?", [inID]);
        return res.status(200).json(rows);
    } catch (err) {
        console.log("Error retrieving categories: %s", err);
        return res.status(400).json('Error retrieving categories, see backend console for details');
    }
});

app.get('/get_all_facts_of_owned_categories', async (req, res) => {
    let inID = req.query.id;
    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    try {
        const rows = await promiseQuery("SELECT f.* FROM facts f INNER JOIN categories c ON f.category=c.id WHERE c.owner=?", [inID]);
        return res.status(200).json(rows);
    } catch (err) {
        console.log("Error retrieving facts: %s", err);
        return res.status(400).json('Error retrieving facts, see backend console for details');
    }
});

app.get('/get_all_users_of_owned_categories', async (req, res) => {
    let inID = req.query.id;
    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    try {
        const rows = await promiseQuery("SELECT DISTINCT u.* FROM users u INNER JOIN categories c ON JSON_CONTAINS(u.private_access_array, CAST(c.id AS JSON), '$') WHERE c.owner=?", [inID]);
        return res.status(200).json(rows);
    } catch (err) {
        console.log("Error retrieving facts: %s", err);
        return res.status(400).json('Error retrieving facts, see backend console for details');
    }
});

app.get('/get_all_facts_of_access', async (req, res) => {
    let inID = req.query.id;
    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    try {
        const rows = await promiseQuery("SELECT DISTINCT f.* FROM facts f INNER JOIN categories c ON f.category = c.id WHERE (c.private = FALSE OR c.private IS NULL) OR EXISTS (SELECT 1 FROM users u WHERE u.id = ? AND JSON_CONTAINS(u.private_access_array, CAST(c.id AS JSON), '$'))", [inID]);
        return res.status(200).json(rows);
    } catch (err) {
        console.log("Error retrieving facts: %s", err);
        return res.status(400).json('Error retrieving facts, see backend console for details');
    }
});

app.get('/get_all_public_facts', async (req, res) => {
    try {
        const rows = await promiseQuery("SELECT f.* FROM facts f INNER JOIN categories c ON f.category = c.id WHERE c.private = FALSE OR c.private IS NULL");
        return res.status(200).json(rows);
    } catch (err) {
        console.log("Error retrieving facts: %s", err);
        return res.status(400).json('Error retrieving facts, see backend console for details');
    }
});

app.get('/get_all_public_categories', async (req, res) => {
    try {
        const rows = await promiseQuery("SELECT * FROM categories WHERE private = FALSE OR private IS NULL");
        return res.status(200).json(rows);
    } catch (err) {
        console.log("Error retrieving facts: %s", err);
        return res.status(400).json('Error retrieving facts, see backend console for details');
    }
});

//#endregion

//#region user-management

app.post('/google_login', authenticateToken, async (req, res) => {
    let credential = req.body.credential;
    let client_id = req.body.client_id;
    let inUsername = req.body.inUsername;
    let inEmail = req.body.email;

    try {
        // const ticket = await oauthClient.verifyIdToken({
        //     idToken: credential,
        //     audience: client_id,
        // });

        // const payload = ticket.getPayload();
        // const userid = payload['sub'];
        // console.log(userid);
        let msg = "";
        let user;
        let stats;

        const rows = await promiseQuery("SELECT * FROM users WHERE id=?", [client_id]);
        console.log(rows);
        
        // If the user already exists, just return that.
        if (rows && rows.length) {
            user = rows;
            msg = "Authentication Successful for existing user";
        } else {
            // New user creation
            if (!inUsername) {
                return res.status(400).json('Must submit a username for new user setup');
            }
            if (!client_id) {
                return res.status(400).json('Must submit a valid token for new user setup');
            }
            if (!inEmail) {
                return res.status(400).json("Must submit an email or a bunch of stuff breaks");
            }
            
            const currentDate = new Date();
            
            // Insert new user
            await promiseQuery(
                "INSERT INTO users (id, username, permissions, dateJoined, lastLoginDay, email) VALUES(?,?,?,?,?,?)", 
                [client_id, inUsername, 0, currentDate, currentDate, inEmail]
            );
            
            // Fetch the newly created user
            const newUserRows = await promiseQuery("SELECT * FROM users WHERE id=?", [client_id]);
            user = newUserRows;
            msg = "Authentication Successful for new user";
            
            if (!user) {
                console.log("Error: User was not created properly");
                return res.status(400).json('Error creating user');
            }
            
            // Insert stats for new user
            await promiseQuery(
                "INSERT INTO stats (id, level, xp, daysUsed, factsViewed, factsPlaced, userRange) VALUES(?, ?, ?, ?, ?, ?, ?)", 
                [client_id, 0, 0, 1, 0, 0, 100]
            );
            
            // Fetch stats
            const achievementRows = await promiseQuery("SELECT * FROM stats WHERE id=?", [client_id]);
            stats = achievementRows;

            // Insert achievements for new user
            await promiseQuery(
                "INSERT INTO achievements (id) VALUES(?)",
                [client_id]
            );

            // We don't need to return achievements, they're all null
        }
        
        console.log("Fetched user: " + user);
        return res.status(200).json({ message: msg, user, stats });
   } catch (err) {
        console.log(err);
        return res.status(400).json({ err });
   }
});

app.post('/change_username', authenticateToken, async (req, res) => {
    let inID = req.body.id;
    let newUsername = req.body.username;

    if (!inID) {
        return res.status(400).json('Must submit a user ID for valid access');
    }

    await pool.query("UPDATE users SET username=? WHERE id=?", [newUsername, inID],
        async function(err, row) {
            if (err) {
                console.log("Error getting user: %s", err);
                return res.status(400).json('Error getting user, see backend console for details');
            } else {
                return res.status(200).json({msg: 'Username updated', user: row});
            }
        }
    );
});

app.post('/change_permissions', authenticateToken, async (req, res) => {
    let inID = req.body.id;
    let newPermLevel = req.body.permLevel;

    if (!inID) {
        return res.status(400).json('Must submit a user ID for valid access');
    }

    await pool.query("UPDATE users SET permissions=? WHERE id=?", [newPermLevel, inID],
        async function(err, row) {
            if (err) {
                console.log("Error getting user: %s", err);
                return res.status(400).json('Error getting user, see backend console for details');
            } else {
                return res.status(200).json({msg: 'Permissions updated', user: row});
            }
        }
    );
});

app.post('/update_achievement', authenticateToken, async (req, res) => {
    let inID = req.body.id;
    let inStat = req.body.stat;
    let inStatValue = req.body.statValue;

    if (!inID) {
        return res.status(400).json('Must submit a user ID for valid access');
    }

    if (!inStat) {
        return res.status(400).json('Must submit a stat to update');
    }

    if (!inStatValue) {
        return res.status(400).json("Must submit a new value for the stat");
    }

    await pool.query("UPDATE stats SET ?=? WHERE id=?", [inStat, inStatValue, inID],
        async function(err, row) {
            if (err) {
                console.log("Error getting user: %s", err);
                return res.status(400).json('Error getting user, see backend console for details');
            } else {
                return res.status(200).json('User stats updated');
            }
        }
    );
});

app.post('/add_to_achievement', authenticateToken, async (req, res) => {
    let inID = req.body.id;
    let inStat = req.body.stat;
    let inStatValue = req.body.statValue;

    if (!inID) {
        return res.status(400).json('Must submit a user ID for valid access');
    }

    if (!inStat) {
        return res.status(400).json('Must submit a stat to update');
    }

    if (!inStatValue) {
        return res.status(400).json("Must submit a new value for the stat");
    }

    await pool.query(`UPDATE stats SET ${inStat}=${inStat}+? WHERE id=?`, [inStatValue, inID],
        async function(err) {
            if (err) {
                console.log("Error updating achievement: %s", err);
                return res.status(400).json('Error updating achievement, see backend console for details');
            } else {
                // Gain appropriate xp, handle potential level + range up, and return the user
                // UPDATE doesn't return the modified row, so get that
                await pool.query(`SELECT * FROM stats WHERE id=?`, [inID], 
                    async function(err, row) {
                        if (err) {
                            console.log("Error getting user: %s", err);
                            return res.status(400).json('Error getting user, see backend console for details');
                        } else {
                            // Hacky fix for not actually storing the old value
                            let userUpdated = await handleXPLevelAndRange(inID, inStat, inStatValue - 1, inStatValue, row[0].level, row[0].xp, row[0].userRange);
                            console.log(userUpdated);
                            return res.status(200).json(userUpdated);
                        }
                    }
                )
            }
        }
    );
});

app.post('/set_achievement_complete', authenticateToken, async (req, res) => {
    let inID = req.body.id;
    let inStat = req.body.stat;

    if (!inID) {
        return res.status(400).json('Must submit a user ID for valid access');
    }

    if (!inStat) {
        return res.status(400).json('Must submit a stat to update');
    }

    try {
        let msg = "";
        let user;
        let achievements;

        const rows = await promiseQuery(`UPDATE achievements SET ${sanitizeColumnName(inStat)}=1 WHERE id=?`, [inID]);
        achievements = rows[0];

        return res.status(200).json({ message: msg, achievements });
   } catch (err) {
        console.log(err);
        return res.status(400).json({ err });
   }
});

//#endregion

//#region get-user-info

app.get('/get_user_by_id', async (req, res) => {
    let inID = req.query.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    await pool.query("SELECT * FROM users WHERE id=?", [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving user: %s", err);
                return res.status(400).json('Error retrieving user, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_username_by_id', async (req, res) => {
    let inID = req.query.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    await pool.query("SELECT username FROM users WHERE id=?", [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving user: %s", err);
                return res.status(400).json('Error retrieving user, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_user_perms_by_id', async (req, res) => {
    let inID = req.query.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    await pool.query("SELECT perms FROM users WHERE id=?", [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving user: %s", err);
                return res.status(400).json('Error retrieving user, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_user_level_by_id', async (req, res) => {
    let inID = req.query.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    await pool.query("SELECT level FROM stats WHERE id=?", [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving achievement: %s", err);
                return res.status(400).json('Error retrieving achievement, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_user_xp_by_id', async (req, res) => {
    let inID = req.query.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    await pool.query("SELECT xp FROM stats WHERE id=?", [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving achievement: %s", err);
                return res.status(400).json('Error retrieving achievement, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_user_days_by_id', async (req, res) => {
    let inID = req.query.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    await pool.query("SELECT daysUsed FROM stats WHERE id=?", [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving achievement: %s", err);
                return res.status(400).json('Error retrieving achievement, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_user_facts_viewed_by_id', async (req, res) => {
    let inID = req.query.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    await pool.query("SELECT factsViewed FROM stats WHERE id=?", [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving achievement: %s", err);
                return res.status(400).json('Error retrieving achievement, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_user_facts_placed_by_id', async (req, res) => {
    let inID = req.query.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    await pool.query("SELECT factsPlaced FROM stats WHERE id=?", [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving achievement: %s", err);
                return res.status(400).json('Error retrieving achievement, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_user_range_by_id', async (req, res) => {
    let inID = req.query.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    await pool.query("SELECT userRange FROM stats WHERE id=?", [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving achievement: %s", err);
                return res.status(400).json('Error retrieving achievement, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_user_all_stats_by_id', async (req, res) => {
    let inID = req.query.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    await pool.query("SELECT * FROM stats WHERE id=?", [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving achievement: %s", err);
                return res.status(400).json('Error retrieving achievement, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_user_all_achievements_by_id', async (req, res) => {
    let inID = req.query.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    await pool.query("SELECT * FROM achievements WHERE id=?", [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving achievement: %s", err);
                return res.status(400).json('Error retrieving achievement, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_user_specific_achievement', async (req, res) => {
    let inID = req.query.id;
    let achievement = req.query.achievement;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }

    if (!achievement) {
        return res.status(400).json('Must submit an achievement to get for valid access');
    }
    
    await pool.query(`SELECT ${sanitizeColumnName(achievement)} FROM stats WHERE id=?`, [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving achievement: %s", err);
                return res.status(400).json('Error retrieving achievement, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

//#endregion

//#region app-launch

app.listen(appPort, () => {
    console.log('Research Geocaching backend live on port %d \n', appPort);

    console.log('Testing DB connection...\n');

    try {
        pool.query('SELECT NOW()', (err, result) => {
            console.log(result);
        });
    } catch(err) {
        console.log(err);
    }
});

//#endregion
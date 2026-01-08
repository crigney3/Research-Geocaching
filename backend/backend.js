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
        await pool.query("UPDATE achievements SET level=?, xp=?, userRange=? WHERE id=?", [levelResults[1], levelResults[2], calculatedRange, id]);

        const rows = await promiseQuery("SELECT * FROM achievements WHERE id=?", [id]);              

        jsonOut = {error: false, leveled: true, user: rows[0]};

    } else {

        // We only need to update internal xp

        await pool.query("UPDATE achievements SET xp=xp+? WHERE id=?", [xpToAdd, id]);

        const rows = await promiseQuery("SELECT * FROM achievements WHERE id=?", [id]);              

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

    if (!categoryTitle) {
        return res.status(400).json('Title cannot be blank');
    }

    // Generate a uuid for this category
    let newID = uuidv4();

    await pool.query("INSERT INTO categories (id, title) VALUES(UNHEX(REPLACE(?, '-', '')),?)", [newID, categoryTitle], 
        function(err, rows) {
            if (err) {
                console.log("Error inserting into categories: %s", err);
                return res.status(400).json('Error inserting into categories, see backend console for details');
            } else {
                return res.status(200).json('Category successfully inserted');
            }
        }
    );
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
        function(err, rows) {
            if (err) {
                console.log("Error removing category: %s", err);
                return res.status(400).json('Error removing category, see backend console for details');
            } else {
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

    await pool.query("DELETE users, achievements FROM users INNER JOIN achievements WHERE users.id=? AND achievements.id=?", [inID, inID], 
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
    
    await pool.query("SELECT * FROM facts WHERE id=UNHEX(?)", [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving fact: %s", err);
                return res.status(400).json('Error retrieving fact, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_category_by_id', async (req, res) => {
    let inID = req.query.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }
    
    await pool.query("SELECT * FROM categories WHERE id=UNHEX(?)", [inID], 
        function(err, rows) {
            if (err) {
                console.log("Error retrieving category: %s", err);
                return res.status(400).json('Error retrieving category, see backend console for details');
            } else {
                return res.status(200).json(rows);
            }
        }
    );
});


app.get('/get_all_facts_of_category', async (req, res) => {
    let inID = req.body.category;

    if (!inID) {
        return res.status(400).json('Must submit an Category for valid access');
    }
    
    await pool.query("SELECT * FROM facts WHERE category=UNHEX(?)", [inID], 
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

//#endregion

//#region user-management

// Deprecated, moving to google login
// app.post('/user_login', async (req, res) => {
//     let inID = req.body.id;
//     let inUsername = req.body.user;
//     let inPerm = req.body.permission;

//     if (!inID) {
//         return res.status(400).json('Must submit a user ID for valid access');
//     }

//     await pool.query("SELECT * FROM users WHERE id=?", [inID],
//         async function(err, row) {
//             if (err) {
//                 console.log("Error getting user: %s", err);
//                 return res.status(400).json('Error getting user, see backend console for details');
//             }

//             // If the user already exists, just return that.
//             // If not, add them to the table and return the new data.
//             if (row && row.length) {
//                 res.status(200).json(row);
//             } else {
//                 // We need to check that username and permissions exist
//                 // for first time setup only
//                 if (!inUsername) {
//                     return res.status(400).json('Must submit a username for new user setup');
//                 }
                
//                 if (!inPerm) {
//                     return res.status(400).json('Must submit a permission level for new user setup');
//                 }

//                 await pool.query("INSERT INTO users (id, username, permissions) VALUES(?,?,?)", [inID, inUsername, inPerm],
//                     function (err, row) {
//                         if (err) {
//                             console.log("Error inserting into users: %s", err);
//                             return res.status(400).json('Error inserting into users, see backend console for details');
//                         } else {
//                             res.status(200).json('User successfully inserted');
//                         }
//                     }
//                 ); 
//             }
//         }
//     )
// });

app.post('/google_login', authenticateToken, async (req, res) => {
    let credential = req.body.credential;
    let client_id = req.body.client_id;
    let inUsername = req.body.inUsername;

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
        let achievements;

        const [rows] = await promiseQuery("SELECT * FROM users WHERE id=?", [client_id]);
        
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
            
            const currentDate = new Date();
            
            // Insert new user
            await promiseQuery(
                "INSERT INTO users (id, username, permissions, dateJoined, lastLoginDay) VALUES(?,?,?,?,?)", 
                [client_id, inUsername, 0, currentDate, currentDate]
            );
            
            // Fetch the newly created user
            const [newUserRows] = await promiseQuery("SELECT * FROM users WHERE id=?", [client_id]);
            user = newUserRows;
            msg = "Authentication Successful for new user";
            
            if (!user) {
                console.log("Error: User was not created properly");
                return res.status(400).json('Error creating user');
            }
            
            // Insert achievements for new user
            await promiseQuery(
                "INSERT INTO achievements (id, level, xp, daysUsed, factsViewed, factsPlaced, userRange) VALUES(?, ?, ?, ?, ?, ?, ?)", 
                [client_id, 0, 0, 1, 0, 0, 100]
            );
            
            // Fetch achievements
            const [achievementRows] = await promiseQuery("SELECT * FROM achievements WHERE id=?", [client_id]);
            achievements = achievementRows;
        }
        
        console.log("Fetched user: " + user);
        return res.status(200).json({ message: msg, user, achievements });
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

// Deprecated, see helper functions
// app.post('/set_level', authenticateToken, async (req, res) => {
//     let inID = req.body.id;
//     let newLevel = req.body.level; // Level isn't required, we default to adding one

//     let rangeOut;

//     if (!inID) {
//         return res.status(400).json('Must submit a user ID for valid access');
//     }

//     if (newLevel) {
//         await pool.query("UPDATE achievements SET level=? WHERE id=?", [newLevel, inID],
//             async function(err, row) {
//                 if (err) {
//                     console.log("Error getting user: %s", err);
//                     return res.status(400).json('Error getting user, see backend console for details');
//                 } else {
//                     await pool.query("UPDATE achievements SET range=? WHERE id=?", 100 + 50 * Math.log2(newLevel + 1), inID,
//                         function(err, row2) {
//                             if (err) {
//                                 console.log("Error getting user: %s", err);
//                                 return res.status(400).json('Error getting user, see backend console for details');
//                             } else {      
//                                 rangeOut = row2[0].range;
//                             }
//                         }
//                     );

//                     return res.status(200).json({msg: 'User level updated', achievements: row, range: rangeOut});
//                 }
//             }
//         );
//     } else {
//         await pool.query("UPDATE achievements SET level = level + 1 WHERE id=?", [inID],
//             async function(err, row) {
//                 if (err) {
//                     console.log("Error getting user: %s", err);
//                     return res.status(400).json('Error getting user, see backend console for details');
//                 } else {
//                     await pool.query("UPDATE achievements SET range=? WHERE id=?", 100 + 50 * Math.log2(row[0].level + 1), inID,
//                         function(err, row2) {
//                             if (err) {
//                                 console.log("Error getting user: %s", err);
//                                 return res.status(400).json('Error getting user, see backend console for details');
//                             } else {      
//                                 rangeOut = row2[0].range;
//                             }
//                         }
//                     );

//                     return res.status(200).json({msg: 'User level updated', achievements: row});
//                 }
//             }
//         );
//     }
// });

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

    await pool.query("UPDATE achievements SET ?=? WHERE id=?", [inStat, inStatValue, inID],
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

    await pool.query(`UPDATE achievements SET ${inStat}=${inStat}+? WHERE id=?`, [inStatValue, inID],
        async function(err) {
            if (err) {
                console.log("Error updating achievement: %s", err);
                return res.status(400).json('Error updating achievement, see backend console for details');
            } else {
                // Gain appropriate xp, handle potential level + range up, and return the user
                // UPDATE doesn't return the modified row, so get that
                await pool.query(`SELECT * FROM achievements WHERE id=?`, [inID], 
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
    
    await pool.query("SELECT level FROM achievements WHERE id=?", [inID], 
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
    
    await pool.query("SELECT xp FROM achievements WHERE id=?", [inID], 
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
    
    await pool.query("SELECT daysUsed FROM achievements WHERE id=?", [inID], 
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
    
    await pool.query("SELECT factsViewed FROM achievements WHERE id=?", [inID], 
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
    
    await pool.query("SELECT factsPlaced FROM achievements WHERE id=?", [inID], 
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
    
    await pool.query("SELECT userRange FROM achievements WHERE id=?", [inID], 
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
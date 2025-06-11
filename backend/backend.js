const express = require('express');
const bodyParser = require('body-parser');
const secrets = require('../src/secrets');
const { v4: uuidv4 } = require('uuid');
const sql = require('mysql');
const cors = require("cors");

const appPort = 3330;
const app = express();
app.use(bodyParser.json());

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

//#region additions
app.post('/add_fact', async (req, res) => {
    let inTitle = req.body.title;
    let inDescription = req.body.description;
    let inLat = req.body.lat;
    let inLng = req.body.lng;
    let inCategory = req.body.category;

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

    // Generate a uuid for this entry
    let newID = uuidv4();

    var data = {
        id: newID,
        title: inTitle,
        description: inDescription,
        lat: inLat,
        lng: inLng,
        category: inCategory
    }

    await pool.query("INSERT INTO facts set ? ", data, 
        function(err, rows) {
            if (err) {
                res.status(400).json('Error inserting into facts, see backend console for details');
                console.log("Error inserting into facts: %s", err);
            } else {
                res.status(200).json('Fact successfully inserted');
            }
        }
    );
});

app.post('/add_category', async (req, res) => {
    let categoryTitle = req.body.title;

    if (!categoryTitle) {
        return res.status(400).json('Title cannot be blank');
    }

    // Generate a uuid for this category
    let newID = uuidv4();

    var data = {
        id: newID,
        title: categoryTitle
    }

    await pool.query("INSERT INTO categories set ? ", data, 
        function(err, rows) {
            if (err) {
                res.status(400).json('Error inserting into categories, see backend console for details');
                console.log("Error inserting into categories: %s", err);
            } else {
                res.status(200).json('Category successfully inserted');
            }
        }
    );
});
//#endregion

//#region deletions
app.post('/remove_fact_by_id', async (req, res) => {
    let inID = req.body.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid deletion');
    }

    var data = {
        id: inID
    }

    await pool.query("DELETE FROM facts WHERE id=? ", data, 
        function(err, rows) {
            if (err) {
                res.status(400).json('Error removing fact, see backend console for details');
                console.log("Error removing fact: %s", err);
            } else {
                res.status(200).json('Fact successfully removed');
            }
        }
    );
});

app.post('/remove_category_by_id', async (req, res) => {
    let inID = req.body.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid deletion');
    }

    var data = {
        id: inID
    }

    await pool.query("DELETE FROM categories WHERE id=? ", data, 
        function(err, rows) {
            if (err) {
                res.status(400).json('Error removing category, see backend console for details');
                console.log("Error removing category: %s", err);
            } else {
                res.status(200).json('Category successfully removed');
            }
        }
    );
});

app.post('/remove_all_facts_in_category', async (req, res) => {
    let inCategory = req.body.category;

    if (!inCategory) {
        return res.status(400).json('Must submit a category for valid deletion');
    }

    var data = {
        category: inCategory
    }

    await pool.query("DELETE FROM facts WHERE category=? ", data, 
        function(err, rows) {
            if (err) {
                res.status(400).json('Error removing facts, see backend console for details');
                console.log("Error removing facts: %s", err);
            } else {
                res.status(200).json('Facts successfully removed');
            }
        }
    );
});

app.post('/remove_all_categories', async (req, res) => {
    await pool.query("DELETE * FROM categories", data, 
        function(err, rows) {
            if (err) {
                res.status(400).json('Error removing category, see backend console for details');
                console.log("Error removing category: %s", err);
            } else {
                res.status(200).json('Category successfully removed');
            }
        }
    );
});

app.post('/remove_all_facts', async (req, res) => {
    await pool.query("DELETE * FROM facts", data, 
        function(err, rows) {
            if (err) {
                res.status(400).json('Error removing fact, see backend console for details');
                console.log("Error removing fact: %s", err);
            } else {
                res.status(200).json('Fact successfully removed');
            }
        }
    );
});
//#endregion

//#region get-all
app.get('/get_all_facts', async (req, res) => {
    await pool.query("SELECT * FROM facts", 
        function(err, rows) {
            if (err) {
                res.status(400).json('Error retrieving facts, see backend console for details');
                console.log("Error retrieving facts: %s", err);
            } else {
                res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_all_categories', async (req, res) => {
    await pool.query("SELECT * FROM categories", 
        function(err, rows) {
            if (err) {
                res.status(400).json('Error retrieving categories, see backend console for details');
                console.log("Error retrieving categories: %s", err);
            } else {
                res.status(200).json(rows);
            }
        }
    );
});
//#endregion

//#region get-specific

app.get('/get_fact_by_id', async (req, res) => {
    let inID = req.body.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }

    var data = {
        id: inID
    }
    
    const client = await pool.connect();
    
    const query = await client.query("SELECT FROM facts WHERE id=?", data, 
        function(err, rows) {
            if (err) {
                res.status(400).json('Error retrieving fact, see backend console for details');
                console.log("Error retrieving fact: %s", err);
            } else {
                res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_category_by_id', async (req, res) => {
    let inID = req.body.id;

    if (!inID) {
        return res.status(400).json('Must submit an ID for valid access');
    }

    var data = {
        id: inID
    }
    
    const client = await pool.connect();
    
    const query = await client.query("SELECT FROM categories WHERE id=?", data, 
        function(err, rows) {
            if (err) {
                res.status(400).json('Error retrieving category, see backend console for details');
                console.log("Error retrieving category: %s", err);
            } else {
                res.status(200).json(rows);
            }
        }
    );
});

app.get('/get_all_facts_of_category', async (req, res) => {
    let inCategory = req.body.category;

    if (!inCategory) {
        return res.status(400).json('Must submit an Category for valid access');
    }

    var data = {
        category: inCategory
    }
    
    const client = await pool.connect();
    
    const query = await client.query("SELECT FROM facts WHERE category=?", data, 
        function(err, rows) {
            if (err) {
                res.status(400).json('Error retrieving facts, see backend console for details');
                console.log("Error retrieving facts: %s", err);
            } else {
                res.status(200).json(rows);
            }
        }
    );
});

//#endregion

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
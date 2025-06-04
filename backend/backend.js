const express = require('express');
const bodyParser = require('body-parser');
const secrets = require('../src/secrets');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const appPort = 3330;
const app = express();
app.use(bodyParser.json());

const pool = new Pool({
        host: secrets.DB_HOST,
        user: secrets.DB_USER,
        password: secrets.DB_PASSWORD,
        port: secrets.DB_PORT,
        database: secrets.DB_NAME
    });

app.post('/add_fact', async (req, res) => {
    let { inTitle, inDescription, inLat, inLng, inCategory } = req.body;

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

    const client = await pool.connect();

    const query = await client.query("INSERT INTO facts set ? ", data, 
        function(err, rows) {
            if (err) {
                res.status(400).json('Error inserting into facts, see backend console for details');
                console.log("Error inserting into facts: %s", err);
            } else {
                res.status(200).json('Fact successfully inserted');
            }
        }
    );

    client.release();
});

app.get('/get_all', async (req, res) => {
    const client = await pool.connect();

    const query = await client.query("SELECT * FROM facts", 
        function(err, rows) {
            if (err) {
                res.status(400).json('Error retrieving facts, see backend console for details');
                console.log("Error retrieving facts: %s", err);
            } else {
                res.status(200).json(rows);
            }
        }
    );

    client.release();
})

app.listen(appPort, () => {
    console.log('Research Geocaching backend live on port %d', appPort);
})
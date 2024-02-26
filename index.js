require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;
const { body, validationResult } = require('express-validator');

app.use(express.static('public'));
app.use(bodyParser.json());

const user = process.env.DB_USER;
const password = process.env.DB_PASS;
const dbName = process.env.DB_NAME;
const connectionString = `mongodb+srv://${user}:${password}@cluster0.rub3ouf.mongodb.net/?retryWrites=true&w=majority`;
const rateLimit = require('express-rate-limit');

const client = new MongoClient(connectionString);
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });
async function main() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
        const db = client.db(dbName);

        app.post('/register', async (req, res) => {
            try {
                const { username, password } = req.body;
                const registrationResult = await registerUser(db, { username, password });
                res.status(201).json(registrationResult);
            } catch (error) {
                res.status(500).json({ message: 'Error registering user', error: error });
            }
        });

        app.post('/login', async (req, res) => {
            try {
                const { username, password } = req.body;
                const isAuthenticated = await authenticateUser(db, { username, password });
                if (isAuthenticated) {
                    res.status(200).json({ message: 'Authentication successful' });
                } else {
                    res.status(401).json({ message: 'Authentication failed' });
                }
            } catch (error) {
                res.status(500).json({ message: 'Error authenticating user', error: error });
            }
        });

    } catch (e) {
        console.error('Error connecting to MongoDB:', e);
    }
}






async function registerUser(db, { username, password }) {
    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
        return { message: 'Username already exists' };
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await usersCollection.insertOne({
        username,
        password: hashedPassword,
    });
    console.log(`New user created with the following id: ${result.insertedId}`);
    return { message: 'User registered successfully', userId: result.insertedId };
}

async function authenticateUser(db, { username, password }) {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ username });
    if (!user) {
        console.log('Authentication failed: User not found');
        return false;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
        console.log('User authenticated successfully');
        return true;
    } else {
        console.log('Authentication failed: Password is incorrect');
        return false;
    }
}

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    main();
});

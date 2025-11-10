const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// Set up the database
// This will create 'kbc_database.sqlite' if it doesn't exist
const db = new sqlite3.Database('./kbc_database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create tables if they don't exist
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question TEXT NOT NULL,
                answers TEXT NOT NULL,
                correct INTEGER NOT NULL,
                difficulty INTEGER NOT NULL
            )`, (err) => {
                if(err) console.error("Error creating questions table", err);
            });

            db.run(`CREATE TABLE IF NOT EXISTS leaderboard (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                prize_money TEXT NOT NULL,
                score INTEGER NOT NULL
            )`, (err) => {
                if(err) console.error("Error creating leaderboard table", err);
            });
        });
    }
});

// Middleware
app.use(express.json()); // To parse JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// ---------- API Endpoints ----------

// --- Questions API (CRUD) ---

// GET: Get 15 questions for the game, sorted by difficulty
app.get('/api/questions/game', (req, res) => {
    // This query selects 15 questions, ordered by difficulty
    const sql = `SELECT * FROM questions ORDER BY difficulty, RANDOM() LIMIT 15`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Parse the 'answers' string back into an array
        const questions = rows.map(row => ({
            ...row,
            answers: JSON.parse(row.answers)
        }));
        res.json(questions);
    });
});

// GET: Get ALL questions for the admin panel
app.get('/api/questions/all', (req, res) => {
    const sql = `SELECT * FROM questions ORDER BY difficulty, id`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const questions = rows.map(row => ({
            ...row,
            answers: JSON.parse(row.answers)
        }));
        res.json(questions);
    });
});

// POST: Create a new question
app.post('/api/questions', (req, res) => {
    const { question, answers, correct, difficulty } = req.body;
    // Store answers as a JSON string
    const answersJson = JSON.stringify(answers);
    const sql = `INSERT INTO questions (question, answers, correct, difficulty) VALUES (?, ?, ?, ?)`;
    
    db.run(sql, [question, answersJson, correct, difficulty], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: 'Question created' });
    });
});

// PUT: Update an existing question
app.put('/api/questions/:id', (req, res) => {
    const { question, answers, correct, difficulty } = req.body;
    const answersJson = JSON.stringify(answers);
    const sql = `UPDATE questions SET question = ?, answers = ?, correct = ?, difficulty = ? WHERE id = ?`;
    
    db.run(sql, [question, answersJson, correct, difficulty, req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Question updated', changes: this.changes });
    });
});

// DELETE: Delete a question
app.delete('/api/questions/:id', (req, res) => {
    const sql = `DELETE FROM questions WHERE id = ?`;
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Question deleted', changes: this.changes });
    });
});

// --- Leaderboard API ---

// GET: Get all leaderboard scores
app.get('/api/leaderboard', (req, res) => {
    const sql = `SELECT name, prize_money FROM leaderboard ORDER BY score DESC, id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// POST: Add a new score to the leaderboard
app.post('/api/leaderboard', (req, res) => {
    const { name, prize_money, score } = req.body;
    const sql = `INSERT INTO leaderboard (name, prize_money, score) VALUES (?, ?, ?)`;
    
    db.run(sql, [name, prize_money, score], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: 'Score added' });
    });
});

// DELETE: Clear the entire leaderboard (Host Panel)
app.delete('/api/leaderboard/all', (req, res) => {
    const sql = `DELETE FROM leaderboard`;
    db.run(sql, [], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Also reset the auto-increment counter for a clean slate
        db.run(`DELETE FROM sqlite_sequence WHERE name='leaderboard'`, [], (err) => {
             res.json({ message: 'Leaderboard cleared', changes: this.changes });
        });
    });
});


// ---------- Serve Frontend ----------
// All other requests serve the main index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`KBC server running at http://localhost:${port}`);
});
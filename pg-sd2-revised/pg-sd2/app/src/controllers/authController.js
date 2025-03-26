const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

// Controller for registration
async function postRegister(req, res) {
    try {
        const { username, email, password, full_name } = req.body;

        // Check if user already exists
        const [existingUser] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, full_name]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
}

// Controller for login
async function postLogin(req, res) {
    try {
        const { username, password } = req.body;

        // Get user from database
        const [users] = await pool.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check if password is valid
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Set user session
        req.session.userId = user.id;
        req.session.username = user.username;

        res.json({ message: 'Logged in successfully', user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
}

// Logout route
function logout(req, res) {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.json({ message: 'Logged out successfully' });
    });
}

// Get current user
async function getMe(req, res) {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const [users] = await pool.query(
            'SELECT id, username, email, full_name FROM users WHERE id = ?',
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
}

module.exports = {
    postRegister,
    postLogin,
    logout,
    getMe
};

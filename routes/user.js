const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret';

router.get('/generate-code', (req, res) => {
    const screenSize = req.query.screenSize;
    let securityCode;

    if (screenSize === 'small') {
        
        securityCode = Math.floor(10000 + Math.random() * 90000).toString();
    } else {
        
        securityCode = Math.floor(100000 + Math.random() * 900000).toString();
    }

    req.session.securityCode = securityCode;
    res.json({ securityCode });
});

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter both username and password' });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password, securityCode } = req.body;

    if (!username || !password || !securityCode) {
        return res.status(400).json({ message: 'Please enter username, password, and security code' });
    }

    if (securityCode !== req.session.securityCode) {
        return res.status(400).json({ message: 'Invalid security code' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

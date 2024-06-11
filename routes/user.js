const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const LoginDetail = require('../models/logindetail');
const session = require('express-session');

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret';

router.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

router.get('/generate-code', (req, res) => {
    const securityCode = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.securityCode = securityCode;
    res.json({ securityCode });
});
router.get('/login-details', async (req, res) => {
    try {
        const loginDetails = await LoginDetail.find().sort({ count: 1 }).limit(50);
        res.json(loginDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/register', async (req, res) => {
    const { mobileNumber, password, username } = req.body;

    if (!mobileNumber || !password || !username) {
        return res.status(400).json({ message: 'Please enter mobile number, username, and password' });
    }

    try {
        const existingUser = await User.findOne({ mobileNumber });
        const existingUsername = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this mobile number already exists' });
        }
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate a unique memberId based on mobileNumber
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const memberId = `RL${mobileNumber.slice(-7)}${randomSuffix}`; // e.g., RL12345670001

        const newUser = new User({ mobileNumber, password: hashedPassword, memberId, username });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});



router.post('/login', async (req, res) => {
    const { mobileNumber, password, securityCode } = req.body;

    if (!mobileNumber || !password || !securityCode) {
        return res.status(400).json({ message: 'Please enter mobile number, password, and security code' });
    }

    if (securityCode !== req.session.securityCode) {
        return res.status(400).json({ message: 'Invalid security code' });
    }

    try {
        const user = await User.findOne({ mobileNumber });
        if (!user) {
            return res.status(400).json({ message: 'Invalid mobile number or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid mobile number or password' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET);

        const loginDetailCount = await LoginDetail.countDocuments();
        const isRebirth = loginDetailCount < 3000 && (loginDetailCount + 1) % 50 === 0;

        // Generate random leftCustomer, rightCustomer, and amount based on logic
        const leftCustomer = Math.floor(Math.random() * 20);
        const rightCustomer = Math.floor(Math.random() * 20);
        const amount = (leftCustomer + rightCustomer) * 25;

        // Find the current count for the user
        const userLoginCount = await LoginDetail.countDocuments({ mobileNumber });

        const loginDetail = new LoginDetail({
            mobileNumber,
            memberId: user.memberId,
            leftCustomer,
            rightCustomer,
            amount,
            rebirth: isRebirth,
            count: userLoginCount + 1
        });
        await loginDetail.save();

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

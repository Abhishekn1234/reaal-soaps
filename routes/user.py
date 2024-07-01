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
        const loginDetails = await LoginDetail.find().sort().limit(50);
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
        const allUsernames = await User.find({}, { username: 1, _id: 0 }).lean();

        if (existingUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        if (existingUser) {
            return res.status(400).json({
                message: 'User with this mobile number already exists',
                usernames: allUsernames.map(user => user.username)
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const memberId = `RL${mobileNumber.slice(-7)}${randomSuffix}`;

        const newUser = new User({ mobileNumber, password: hashedPassword, memberIds: [memberId], username });

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

        const userLoginCount = await LoginDetail.countDocuments({ mobileNumber });
        const isRebirth = (userLoginCount + 1) % 50 === 0 || (userLoginCount + 1) % 100 === 0;

        if (isRebirth) {
            const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const newMemberId = `RL${mobileNumber.slice(-7)}${randomSuffix}`;
            user.memberIds.push(newMemberId);
            await user.save();
        }

        const leftCustomer = Math.floor(Math.random() * 20);
        const rightCustomer = Math.floor(Math.random() * 20);
        const amount = (leftCustomer + rightCustomer) * 25;

        let income = amount;
        if (isRebirth) {
            if (amount > 1000) {
                const rebirthBonus = amount * 0.15;
                income += rebirthBonus;
            } else if (amount > 500) {
                const rebirthBonus = amount * 0.10;
                income += rebirthBonus;
            } else {
                const rebirthBonus = amount * 0.05;
                income += rebirthBonus;
            }
        }

        // Assign siNo based on count, ensuring it does not exceed 8192
        const siNo = Math.min(userLoginCount + 1, 8192);

        const formattedDate = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const loginDetail = new LoginDetail({
            mobileNumber,
            memberId: user.memberIds[user.memberIds.length - 1],
            leftCustomer,
            rightCustomer,
            amount,
            income,
            rebirth: isRebirth,
            count: userLoginCount + 1,
            siNo: siNo,
            formattedDate: formattedDate
        });
        await loginDetail.save();

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/total-amount', async (req, res) => {
    try {
        const totalAmountResult = await LoginDetail.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);

        const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;
        const discount = calculateDiscount(totalAmount);

        res.json({ totalAmount, discount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


function calculateDiscount(totalAmount) {
    
    return totalAmount * 0.15;
}

module.exports = router;


const mongoose = require('mongoose');

const LoginDetailSchema = new mongoose.Schema({
    mobileNumber: { type: String, required: true },
    memberId: { type: String, required: true },
    leftCustomer: { type: Number, required: true },
    rightCustomer: { type: Number, required: true },
    amount: { type: Number, required: true },
    loginTime: { type: Date, default: Date.now },
    rebirth: { type: Boolean, required: true },
    count: { type: Number, required: true }
});

module.exports = mongoose.model('LoginDetail', LoginDetailSchema);

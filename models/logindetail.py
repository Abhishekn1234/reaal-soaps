
const mongoose = require('mongoose');

const loginDetailSchema = new mongoose.Schema({
    mobileNumber: {
        type: String,
        required: true
    },
    memberId: {
        type: String,
        required: true
    },
    leftCustomer: {
        type: Number,
        default: 0
    },
    rightCustomer: {
        type: Number,
        default: 0
    },
    amount: {
        type: Number,
        default: 0
    },
    rebirth: {
        type: Boolean,
        required: true
    },
    income: {
        type: Number,
        default: 0
    },
    count: {
        type: Number,
        required: true
    },
    siNo: {  
        type: Number,
        required: true
    },
    formattedDate: { 
        type: String,
        required: true
    }
}, { timestamps: true });

const LoginDetail = mongoose.model('LoginDetail', loginDetailSchema);

module.exports = LoginDetail;

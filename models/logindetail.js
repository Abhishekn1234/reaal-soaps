
const mongoose = require('mongoose');

const loginDetailSchema = new mongoose.Schema({
    username: { type: String, required: true },
    loginTime: { type: Date, default: Date.now },
    rebirth: { type: Boolean, default: false }
});

module.exports = mongoose.model('LoginDetail', loginDetailSchema);

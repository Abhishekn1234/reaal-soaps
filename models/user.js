const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    mobileNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    memberId: { type: String, required: true, unique: true },
    username: { type: String }
});

module.exports = mongoose.model('User', UserSchema);

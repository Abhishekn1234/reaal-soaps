const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(session({
    secret: 'your_session_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));


mongoose.connect('mongodb://localhost:27017/myloginapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));


app.use('', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

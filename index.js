if (process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
};

const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const methodOverride = require('method-override');
const initializePassport = require('./passport-config');
const nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');
const path = require('path');
const User = require('./model/user');

const app = express();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clothingdealfinder', { useNewUrlParser: true, useUnifiedTopology: true},
    err => {
        if (err) {
            throw err;
        }
        console.log('Connected to MongoDB')
    }
);

// middlwear
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('view engine', 'handlebars');
app.engine('handlebars', exphbs.engine({ extname: '.handlebars', defaultLayout: "main"}));
app.use(express.static(path.join(__dirname, 'Main')));
app.use(flash());
app.use(session({
    secret: (process.env.SESSION_SECRET || 'this is a secret'),
    resave: false,
    saveUninitialized: false
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// passport.js
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

initializePassport(passport, email => {
    return User.findOne({ email : email })
});

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    } else {
        res.redirect('/login');
    }
}
function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/')
    }
    next()
}

// routes
app.get('/', checkAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '/Main/Home.html'));
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/register', checkNotAuthenticated, function(req, res){
    res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async function(req, res){
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const new_user_instance = new User({
            name: req.body.name,
            username: req.body.email,
            password: hashedPassword
        });
        new_user_instance.save(function(error){
            if (error){
                return error
            }
        });
        console.log('user added');
        res.redirect('/login');
    } catch {
        res.redirect('/register');
    }
});

app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { 
        return next(err); 
        }
      res.redirect('/');
    });
});

app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname, '/Main/Support.html'));
});

app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, '/Main/faq.html'));
});

app.get('/feedback', checkAuthenticated, (req, res) => {
    res.render('feedback.handlebars', {layout: false});
});

app.post('/send_feedback', (req, res) => {
    const user_feedback = `
        <p>Feedback from user</p>
        <ul>
            <li>Name: ${req.body.name}</li>
            <li>Email: ${req.body.email}</li>
            <li>Experience: ${req.body.experience}</li>
            <li>Favorite Store: ${req.body.store}</li>
        </ul>
        <h3>User feedback</h3>
        <p>Message: ${req.body.message}</p>
    `;
    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL, // generated ethereal user
          pass: process.env.PASSWORD, // generated ethereal password
        },
      });

    let info = transporter.sendMail({
        from: `${req.body.email}`,
        to: process.env.EMAIL, // list of receivers
        subject: "Clothing Deal Finder Customer Review", // Subject line
        text: "Hello world?", // plain text body
        html: user_feedback, // html body
    });
    res.render('feedback', {msg: 'Message sent, thank you!', layout: false});
});

app.get('/tos', (req, res) => {
    res.sendFile(path.join(__dirname, '/Main/tos.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, '/Main/privacyPolicy.html'));
});

app.listen(process.env.PORT || 8000, function(){
    console.log('Connected to localhost:8000');
});
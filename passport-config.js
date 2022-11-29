const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./model/user');

function initialize (passport, getUserByEmail) {
    const authenticateUser = async function authenticateUser(email, password, done) {
        const user = await getUserByEmail(email)
        if (user == null) {
            return done(null, false, {message : 'No user with that email.'});
        } else {
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) throw err ;
                if (isMatch) {
                    return done(null, user)
                } else {
                return done(null, false, {message : 'Password incorrect!'});
                }
            });
        }
    }
    passport.use(new localStrategy({ usernameField : 'email'}, authenticateUser));
    passport.serializeUser(function(user, done){
        return done(null, user.id);
    });
    passport.deserializeUser(function(id, done){
        return done(null, async function(id){
            const query = User.findById({ id : id });
            const user = await query.exec();
            return user
        })
    })
}

module.exports = initialize;
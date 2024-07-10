
// This code has been taken from passport-config.js from Erno Vanhalas course material sources.

const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, getUserByUsername, getUserById) {
    const authenticateUser = async (username, password, done) => {
        const user = getUserByUsername(username);
        if (user == null) {
            console.log("User not found");
            return done(null, false, { message: "No user with that username" });
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                console.log("Password match:", user);
                return done(null, user);
            } else {
                console.log("Password incorrect:", user);
                return done(null, false, { message: "Password incorrect" });
            }
        } catch (err) {
            return done(err);
        }
    };

    passport.use(new LocalStrategy(authenticateUser));
    passport.serializeUser((user, done) => {
        console.log("Serial:", user);
        done(null, user.id);
    });
    passport.deserializeUser((id, done) => {
        console.log("Deserial:", id);
        return done(null, getUserById(id));
    });
}

module.exports = initialize;

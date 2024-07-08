
// This code has been taken from passport-config.js from Erno Vanhalas course material sources.

const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

function init(passport, getUserByUsername, getUserById) {
    const authUsr = async (usrname, password, done) => {
        const usr = getUserByUsername(usrname);
        if (usr === null) {
            console.log("User not found");
            return done(null, false);
        }

        try {
            if (await bcrypt.compare(password, usr.password)) {
                return done(null, usr);
            } else {
                return done(null, false);
            }
        } catch (err) {
            return done(e);
        }
    }


    passport.use(new LocalStrategy(authUsr));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        return done(null, getUserById(id));
    });
}


module.exports = init;

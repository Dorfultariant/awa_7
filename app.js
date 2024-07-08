
/*
 NOTE: This weekly task relies hevily upon example code from Erno Vanhalas course material

 */


const { users, getUserById, getUserByUsername } = require("./data/data");

const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const passport = require("passport");
const passport_local = require("passport-local");

const jwt = require("jsonwebtoken");

// little help from src: https://refine.dev/blog/node-js-uuid/#2-uuid-npm-package
const { v4: uuidv4 } = require("uuid");

const session = require("express-session");
const cookie_parser = require("cookie-parser");

const app = express();

const dotenv = require("dotenv").config();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


const initialize_passport = require("./passport-config");
initialize_passport(passport, getUserByUsername, getUserById);


app.use(cookie_parser());
const supersecret = "supersecret";

app.use(session({
    secret: supersecret, // process.env.SECRET
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, sameSite: "lax" },
    maxAge: 1000 * 60 * 5 // 1000ms * 60 sec * 5 = 5 min
}));


app.use(passport.initialize());
app.use(passport.session());



app.get("/", async (req, res, next) => {
    res.send("<h1>Hello There</h1>");
});


app.post("/api/user/register", checkNotAuthenticated, async (req, res, next) => {
    try {
        const user = getUserByUsername(req.body.username);

        if (user) {
            res.status(400).send("User already exists");
        } else {
            // hashing process src: https://www.freecodecamp.org/news/how-to-hash-passwords-with-bcrypt-in-nodejs/
            bcrypt.genSalt(10, (err, salt) => {
                if (err) {
                    console.log(err);
                    return res.status(400).send("Could not create user");
                }
                console.log(req.body.password, " ### ", salt);
                bcrypt.hash(req.body.password, salt, (err, hash) => {
                    if (err) {
                        console.log(err);
                        return res.status(400).send("Could not create user"); register
                    }
                    const new_user = {
                        id: uuidv4(),
                        username: req.body.username,
                        password: hash
                    }
                    users.push(new_user);
                    res.status(200).json(new_user);
                });
            });
        }
    } catch (err) {
        console.error("Error while register: ", err);
        return res.status(500).send("Internal server error");
    }
});


app.post("/api/user/login", checkNotAuthenticated, async (req, res, next) => {
    try {
        console.log("This is login code");
        const found_usr = getUserByUsername(req.body.username);

        if (!found_usr) {
            return res.status(401).json({ msg: "User not found" });
        }
        const comp = await bcrypt.compare(req.body.password, found_usr.password);
        console.log("Is passwd valid: ", comp);
        if (comp) {
            // JWT token for authentication
            const jwt_token = jwt.sign({ username: found_usr.username }, supersecret, { expiresIn: "1h" });

            // session cookie
            res.cookie("connect.sid", jwt_token, { httpOnly: true });
            res.redirect("/api/secret");
        } else {
            return res.status(401).send("Invalid credentials");
        }
    } catch (err) {
        console.error("Error while login: ", err);
        return res.status(500).send("Internal Server Error");
    }
});



app.get("/api/secret", checkAuthenticated, async (req, res, next) => {
    res.status(200).json({ msg: "This is Very Secret place." });
});

app.get("/api/user/list", async (req, res, next) => {
    try {
        res.status(200).json(users);
    } catch (err) {
        console.error("Error while getting  users: ", err);
        return res.status(500).send("Internal Server error");
    }
});


function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        console.log("Is authenticated, apparently");
        return next()
    }

    return res.redirect("/")
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        console.log("Is authenticated also");
        return res.redirect("/api/secret");
    }
    return next()
}


function verifyToken(req, res, next) {
    const extracted_token = req.cookies["connect.sid"];

    if (!extracted_token) {
        return res.status(401).send("No token received");
    }

    try {
        const verify_token = jwt.verify(extracted_token, supersecret);
        // req.user = verify_token;
        // next();

    } catch (err) {
        console.error("Error while verifying token: ", err);
        return res.status(403).send("Invalid token");
    }
}

app.listen(process.env.PORT, () => {
    console.log("Server started at", process.env.PORT);
});




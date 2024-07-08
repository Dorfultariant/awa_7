const { users, getUserById, getUserByUsername } = require("./data/data");

const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
// const passport = require("passport");
const jwt = require("jsonwebtoken");

// little help from src: https://refine.dev/blog/node-js-uuid/#2-uuid-npm-package
const { v4: uuidv4 } = require("uuid");

const session = require("express-session");
const cookie_parser = require("cookie-parser");

const app = express();

const dotenv = require("dotenv").config();

app.use(express.static("public"));
app.use(express.json());
/*
const initPassport = require("./passport-config");
initPassport(passport, getUserByUsername, getUserById);*/

app.use(cookie_parser());
const supersecret = "supersecret";

app.use(session({
    secret: supersecret, // process.env.SECRET
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
    maxAge: 1000 * 60 * 5 // 1000ms * 60 sec * 5 = 5 min
}));

/*
app.use(passport.initialize());
app.use(passport.session());*/


app.get("/", async (req, res, next) => {
    res.send("<h1>Hello There</h1>");
});


app.post("/api/user/register", async (req, res, next) => {
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
                        return res.status(400).send("Could not create user");
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


app.post("/api/user/login", async (req, res, next) => {
    try {

        const found_usr = getUserByUsername(req.body.username);

        if (!found_usr) {
            return res.status(401);
        }
        const comp = await bcrypt.compare(req.body.password, found_usr.password);
        console.log(comp);
        if (comp) {
            // JWT token for authentication
            const jwt_token = jwt.sign({ username: found_usr.username }, supersecret, { expiresIn: "1h" });

            // session cookie
            res.cookie("connect.sid", jwt_token, { httpOnly: true });
            res.status(200).send("Successful login").sid;
        } else {
            return res.status(401).send("Invalid credentials");
        }
    } catch (err) {
        console.error("Error while login: ", err);
        return res.status(500).send("Internal Server Error");
    }
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
        return next();
    }

    return res.redirect("/api/user/login");
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    return next();
}



app.listen(process.env.PORT, () => {
    console.log("Server started at", process.env.PORT);
});




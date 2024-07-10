/*
 *
 * NOTE: This weekly task relies hevily upon example code from Erno Vanhalas course material
 *
 */

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const session = require('express-session');
const path = require("path");
const cookieParser = require("cookie-parser");

// little help from src: https://refine.dev/blog/node-js-uuid/#2-uuid-npm-package
const { v4: uuidv4 } = require("uuid");

const dotenv = require("dotenv").config();


const initialize = require("./passport-config");
initialize(passport, getUserByUsername, getUserById);


const users = [];
const todos = [];

function getUserById(id) {
    return users.find((usr) => usr.id === id);
}


function getUserByUsername(username) {
    return users.find((usr) => usr.username === username);
}

const supersecret = "supersecret";

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: supersecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 15
    }
}));


app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    console.log("Cookies:", req.cookies);
    console.log("Session:", req.session);
    next();
});


app.get("/", (req, res) => {
    res.status(200).send("<h1>Hello Also There</h1>");
});
app.get("/invalid", (req, res) => {
    res.status(401).send("Wrong credentials");
});


app.get("/api/secret", checkAuthenticated, (req, res) => {
    res.status(200).send("This is Very Secret place.");
});

app.get('/api/user/list', (req, res) => {
    try {
        res.status(200).json(users);
    } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Internal server error");
    }
});

app.get('/api/todos/list', (req, res) => {
    try {
        res.status(200).json(todos);
    } catch (err) {
        console.error("Error:", err);
        res.status(500).send("internal server error");
    }
});

app.post("/api/user/register", checkNotAuthenticated, async (req, res) => {
    try {
        const user = getUserByUsername(req.body.username);

        if (user) {
            res.status(400).json({ msg: "User already exists" });
        } else {
            // hashing process src: https://www.freecodecamp.org/news/how-to-hash-passwords-with-bcrypt-in-nodejs/
            bcrypt.genSalt(10, (err, salt) => {
                if (err) {
                    console.log(err);
                    return res.status(400).send("Could not create user");
                }
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
        res.status(500).send("Internal server error");
    }
});

app.post('/api/user/login', checkNotAuthenticated, passport.authenticate('local', { failureRedirect: "/invalid" }), (req, res) => {
    res.status(200).send("Login successful");
});

app.post('/api/todos', checkAuthenticated, async (req, res, next) => {
    try {
        const found_todo = todos.find((todo) => todo.id === req.user.id);

        if (found_todo) {
            found_todo.todos.push(req.body.todo);
            console.log(found_todo);
            return res.status(200).json(found_todo);
        }

        todos.push({
            id: req.user.id,
            todos: [req.body.todo]
        });
        const added_todo = todos.find((todo) => todo.id === req.user.id);
        res.status(200).json(added_todo);

    } catch (err) {
        console.error("Error:", err);
        res.status(500).send("internal server error");
    }
});



function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).send("Not valid");
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    return next();
}

const port = 3000;

app.listen(port, () => {
    console.log("Server started at", port);
});




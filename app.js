const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const dbrepo = require("./dbrepo")

const app = express();

var repo;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static("static"));
app.use(cookieParser('sdfgh12735e68jgasdhjasduo113$%^&$#'));
app.use(express.urlencoded({
    extended: true
}));

app.use((req, res, next) => {
    repo = new dbrepo.Repository();
    next();
});

app.get("/", (req, res) => {
    var data = repo.retrieveRandom(3);
    res.render("index", { prods: { items: data }, user: req.signedCookies.user });
});

app.get("/games", (req, res) => {
    var data = [];
    if (req.query.search) {
        data = repo.retrieveBySearch(req.query.search);
    } else {
        data = repo.retrieve();
    }
    res.render("view-all", { prods: { items: data }, user: req.signedCookies.user });
});

app.get("/games/:id", (req, res) => {
    var data = repo.retrieveByID(Number(req.params.id));
    res.render("view-details", { item: data, user: req.signedCookies.user });
});

app.get("/login", (req, res) => {
    if (req.signedCookies.user) {
        res.redirect("/");
    }
    res.render("login", { user: req.signedCookies.user });
});

app.post("/login", (req, res) => {
    var login = req.body.txtlogin;
    var pwd = req.body.txtpwd;
    var corrPwd = repo.getPasswordForUsr(login)
    if (corrPwd == null) {
        res.render("login", { msg: "Błędny login", user: req.signedCookies.user });
    } else if (pwd == corrPwd) {
        res.cookie("user", { login: login }, { maxAge: 900000, signed: true });
        if (req.query.returnUrl) {
            res.redirect(req.query.returnUrl);
        } else {
            res.redirect("/");
        }
    } else {
        res.render("login", { msg: "Błędne hasło", user: req.signedCookies.user });
    }
});

app.get("/logout", (req, res) => {
    res.cookie("user", "", { maxAge: -1 });
    res.redirect("/");
});

app.get("/my-account", (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    res.render("my-account", { user: req.signedCookies.user });
});

app.get("/cart", (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    res.render("cart", { user: req.signedCookies.user });
});

app.get("/admin", (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    res.render("admin-panel", { user: req.signedCookies.user });
});

app.use((req, res) => {
    res.render("404", { url: req.url });
});

app.listen(3000, () => {
    console.log("Working on port 3000");
});
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const moment = require("moment");

const dbrepo = require("./db")

const app = express();

var repo;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static("static"));
app.use(cookieParser('sdfgh12735e68jgasdhjasduo113$%^&$#'));
app.use(express.urlencoded({
    extended: true
}));

function isUser(usr) {
    return usr.isuser;
}

function isAdmin(usr) {
    return usr.isadmin;
}

function authorize(role) {
    return function (req, res, next) {
        if (req.signedCookies.user) {
            if (role == "admin") {
                if (isAdmin(req.signedCookies.user)) {
                    return next();
                }
            } else if (role == "user") {
                if (isUser(req.signedCookies.user)) {
                    return next();
                }
            }
            console.log("Błąd autoryzacji - niewystarczające uprawnienia dostępu");
            res.redirect("/");
        } else {
            res.redirect("/login?returnUrl=" + req.url);
        }
    }
}

function authorizeOrder() {
    return async function (req, res, next) {
        if (req.signedCookies.user) {
            var order = await repo.getOrderInfo(req.params.id);
            if (!order) {
                res.redirect("/");
            }
            if (isAdmin(req.signedCookies.user) || order.customer_id == req.signedCookies.user.id) {
                return next();
            }
        }
        console.log("Błąd autoryzacji - niewystarczające uprawnienia dostępu");
        res.redirect("/");
    }
}

app.use((req, res, next) => {
    repo = new dbrepo.Repository();
    next();
});

app.get("/", async (req, res) => {
    var data = await repo.retrieveRandom(3);
    res.render("index", { prods: { items: data }, user: req.signedCookies.user });
});

app.get("/games", async (req, res) => {
    var data = [];
    if (req.query.search) {
        data = await repo.retrieveBySearch(req.query.search);
    } else {
        data = await repo.retrieve();
    }
    res.render("view-all", { prods: { items: data }, user: req.signedCookies.user });
});

app.get("/games/:id", async (req, res) => {
    var data = await repo.retrieveByID(Number(req.params.id));
    if (!data) {
        res.redirect("/");
    }
    res.render("view-details", { item: data, user: req.signedCookies.user });
});

app.get("/login", (req, res) => {
    if (req.signedCookies.user) {
        res.redirect("/");
    }
    res.render("login", { user: req.signedCookies.user });
});

app.post("/login", async (req, res) => {
    var login = req.body.txtlogin;
    var pwd = req.body.txtpwd;
    var pwdHash = await repo.getPasswordForUsr(login)
    if (pwdHash == null) {
        res.render("login", { msg: "Błędny login", user: req.signedCookies.user });
    } else if (await bcrypt.compare(pwd, pwdHash)) {
        res.cookie("user", await repo.getUsr(login), { maxAge: 1800000, signed: true });
        if (req.query.returnUrl) {
            res.redirect(req.query.returnUrl);
        } else {
            res.redirect("/");
        }
    } else {
        res.render("login", { msg: "Błędne hasło", user: req.signedCookies.user });
    }
});

app.get("/signup", (req, res) => {
    if (req.signedCookies.user) {
        res.redirect("/");
    }
    res.render("signup", { user: req.signedCookies.user });
});

app.post("/signup", async (req, res) => {
    var login = req.body.txtlogin;
    var pwd = req.body.txtpwd;
    var repwd = req.body.txtrepwd;
    var pwdHash = await repo.getPasswordForUsr(login)
    if (pwdHash) {
        res.render("signup", { msg: "Podany login już istnieje", user: req.signedCookies.user });
    } else if (pwd != repwd) {
        res.render("signup", { msg: "Hasła się nie zgadzają", user: req.signedCookies.user });
    } else {
        var hash = await bcrypt.hash(pwd, 12);
        repo.createUsr(login, hash, true, false);
        if (req.query.returnUrl) {
            res.redirect(req.query.returnUrl);
        } else {
            res.redirect("/");
        }
    }
});

app.get("/logout", (req, res) => {
    res.cookie("user", "", { maxAge: -1 });
    res.redirect("/");
});

app.get("/my-account", authorize("user"), async (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    var data = await repo.getOrdersInfo(req.signedCookies.user.id, null);
    res.render("my-account", { user: req.signedCookies.user, orders: data, moment: moment });
});

app.get("/cart", authorize("user"), (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    res.render("cart", { user: req.signedCookies.user });
});

app.get("/orders/:id", authorizeOrder(), async (req, res) => {
    var data = await repo.getOrderInfo(Number(req.params.id));
    if (!data) {
        res.redirect("/");
    }
    var contents = await repo.getOrderContents(Number(req.params.id));
    res.render("order-details", { order: data, contents: contents, user: req.signedCookies.user, moment: moment });
});

app.get("/admin", authorize("admin"), (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    res.render("admin-panel", { user: req.signedCookies.user });
});

app.get("/admin/orders", authorize("admin"), async (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    var realized = await repo.getOrdersInfo(null, true);
    var notrealized = await repo.getOrdersInfo(null, false);
    res.render("admin-orders", { user: req.signedCookies.user, realized: realized, notrealized: notrealized, moment: moment });
});

app.get("/admin/users", authorize("admin"), async (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    var usrs = await repo.getUsrs();
    res.render("admin-users", { user: req.signedCookies.user, usrs: usrs });
});

app.use((req, res) => {
    res.render("404", { url: req.url });
});

app.listen(3000, () => {
    console.log("Working on port 3000");
});
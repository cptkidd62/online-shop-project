const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const moment = require("moment");
const multer = require("multer");
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');

const dbrepo = require("./db");

const app = express();

var repo;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static("static"));
app.use(cookieParser('sdfgh12735e68jgasdhjasduo113$%^&$#'));
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

var fileStoreOptions = {};

app.use(session({
    store: new FileStore(fileStoreOptions),
    resave: true,
    saveUninitialized: true,
    secret: 'keyboard cat'
}));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./static/img");
    },
    filename: (req, file, cb) => {
        const fileName = file.originalname.toLowerCase().split(' ').join('-');
        cb(null, fileName)
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "image/gif") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Allowed only .png, .jpg, .jpeg and .gif'));
        }
    }
});

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

function validatePrice(price) {
    return price >= 0;
}

function validateYear(year) {
    return year >= 1900;
}

app.use((req, res, next) => {
    repo = new dbrepo.Repository();
    next();
});

app.get("/", async (req, res) => {
    var data = await repo.retrieveRandom(3);
    res.render("index", { prods: { items: data }, user: req.signedCookies.user, cart: req.signedCookies.cart });
});

app.get("/games", async (req, res) => {
    var data = [];
    if (req.query.search) {
        data = await repo.retrieveBySearch(req.query.search);
    } else {
        data = await repo.retrieve();
    }
    res.render("view-all", { prods: { items: data }, user: req.signedCookies.user, cart: req.signedCookies.cart });
});

app.get("/games/:id", async (req, res) => {
    var data = await repo.retrieveByID(Number(req.params.id));
    if (!data) {
        res.redirect("/");
    }
    res.render("view-details", { item: data, user: req.signedCookies.user, cart: req.signedCookies.cart });
});

app.post("/games/:id", authorize("user"), (req, res) => {
    var cart = [];
    if (req.signedCookies.cart) {
        cart = req.signedCookies.cart;
    }
    if (!cart.includes(req.params.id)) {
        cart.push(req.params.id);
    }
    res.cookie("cart", cart, { maxAge: 7200000, signed: true });
    res.redirect("/games/" + req.params.id);
});

app.get("/games/:id/delete", authorize("admin"), async (req, res) => {
    try {
        await repo.deleteGame(Number(req.params.id));
    } catch (e) {
        console.log("Delete error");
    }
    res.redirect("/games");
});

app.get("/login", (req, res) => {
    if (req.signedCookies.user) {
        res.redirect("/");
    }
    res.render("login", { user: req.signedCookies.user, cart: req.signedCookies.cart });
});

app.post("/login", async (req, res) => {
    var login = req.body.txtlogin;
    var pwd = req.body.txtpwd;
    var pwdHash = await repo.getPasswordForUsr(login)
    if (pwdHash == null) {
        res.render("login", { msg: "Błędny login", user: req.signedCookies.user, cart: req.signedCookies.cart });
    } else if (await bcrypt.compare(pwd, pwdHash)) {
        res.cookie("user", await repo.getUsr(login), { maxAge: 7200000, signed: true });
        if (req.query.returnUrl) {
            res.redirect(req.query.returnUrl);
        } else {
            res.redirect("/");
        }
    } else {
        res.render("login", { msg: "Błędne hasło", user: req.signedCookies.user, cart: req.signedCookies.cart });
    }
});

app.get("/signup", (req, res) => {
    if (req.signedCookies.user) {
        res.redirect("/");
    }
    res.render("signup", { user: req.signedCookies.user, cart: req.signedCookies.cart });
});

app.post("/signup", async (req, res) => {
    var login = req.body.txtlogin;
    var pwd = req.body.txtpwd;
    var repwd = req.body.txtrepwd;
    var pwdHash = await repo.getPasswordForUsr(login)
    if (pwdHash) {
        res.render("signup", { msg: "Podany login już istnieje", user: req.signedCookies.user, cart: req.signedCookies.cart });
    } else if (pwd != repwd) {
        res.render("signup", { msg: "Hasła się nie zgadzają", user: req.signedCookies.user, cart: req.signedCookies.cart });
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
    res.cookie("cart", [], { maxAge: -1 });
    res.redirect("/");
});

app.get("/my-account", authorize("user"), async (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    var data = await repo.getOrdersInfo(req.signedCookies.user.id, null);
    res.render("my-account", { user: req.signedCookies.user, orders: data, moment: moment, cart: req.signedCookies.cart });
});

app.get("/cart", authorize("user"), async (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    var items = [];
    var cart = req.signedCookies.cart;
    if (cart) {
        for (var i = 0; i < cart.length; i++) {
            var data = await repo.retrieveByID(cart[i]);
            if (data) {
                items.push(data);
            }
        }
    }
    res.render("cart", { user: req.signedCookies.user, cart: cart, items: items });
});

app.post("/cart", authorize("user"), async (req, res) => {
    var cart = req.signedCookies.cart;
    if (!req.signedCookies.user || !cart || cart == []) {
        res.redirect("/");
    } else {
        await repo.createOrder(req.signedCookies.user.id, cart);
        res.cookie("cart", [], { maxAge: -1 });
        res.redirect("/my-account");
    }
});

app.get("/orders/:id", authorizeOrder(), async (req, res) => {
    var data = await repo.getOrderInfo(Number(req.params.id));
    if (!data) {
        res.redirect("/");
    }
    var contents = await repo.getOrderContents(Number(req.params.id));
    res.render("order-details", { order: data, contents: contents, user: req.signedCookies.user, moment: moment, cart: req.signedCookies.cart });
});

app.get("/admin", authorize("admin"), (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    res.render("admin-panel", { user: req.signedCookies.user, cart: req.signedCookies.cart });
});

app.get("/admin/orders", authorize("admin"), async (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    var realized = await repo.getOrdersInfo(null, true);
    var notrealized = await repo.getOrdersInfo(null, false);
    res.render("admin-orders", { user: req.signedCookies.user, realized: realized, notrealized: notrealized, moment: moment, cart: req.signedCookies.cart });
});

app.get("/admin/users", authorize("admin"), async (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    var usrs = await repo.getUsrs();
    res.render("admin-users", { user: req.signedCookies.user, usrs: usrs, cart: req.signedCookies.cart });
});

app.get("/admin/edit", authorize("admin"), (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    res.render("edit-game", { user: req.signedCookies.user, cart: req.signedCookies.cart });
});

app.post("/admin/edit", authorize("admin"), upload.single("pic"), async (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    if (!req.body.name || !req.body.developer || !req.body.description || !req.body.price || !req.body.year
        || !validatePrice(req.body.price) || !validateYear(req.body.year)) {
        var item = {
            name: req.body.name,
            developer: req.body.developer,
            description: req.body.description,
            price: req.body.price,
            year: req.body.year
        }
        var msg = "Niepoprawne wartości w formularzu";
        res.render("edit-game", { user: req.signedCookies.user, item: item, msg: msg, cart: req.signedCookies.cart });
    } else {
        var img_name = "no-img.jpg";
        if (req.file) {
            img_name = req.file.filename;
        }
        await repo.createGame(req.body.name, img_name, req.body.developer, req.body.description, req.body.price, req.body.year);
        res.redirect("/admin");
    }
});

app.get("/admin/edit/:id", authorize("admin"), async (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    var data = await repo.retrieveByID(Number(req.params.id));
    res.render("edit-game", { item: data, user: req.signedCookies.user, cart: req.signedCookies.cart });
});

app.post("/admin/edit/:id", authorize("admin"), upload.single("pic"), async (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/");
    }
    if (!req.body.name || !req.body.developer || !req.body.description || !req.body.price || !req.body.year
        || !validatePrice(req.body.price) || !validateYear(req.body.year)) {
        var item = {
            name: req.body.name,
            developer: req.body.developer,
            description: req.body.description,
            price: req.body.price,
            year: req.body.year
        }
        var msg = "Niepoprawne wartości w formularzu";
        res.render("edit-game", { user: req.signedCookies.user, item: item, msg: msg, cart: req.signedCookies.cart });
    } else {
        try {
            var img_name = "";
            if (req.file) {
                img_name = req.file.filename;
            }
            await repo.updateGame(Number(req.params.id), req.body.name, img_name, req.body.developer, req.body.description, req.body.price, req.body.year);
        } catch (e) {
            console.log("Update error");
        }
        res.redirect("/admin");
    }
});

app.use((req, res) => {
    res.render("404", { url: req.url });
});

app.listen(3000, () => {
    console.log("Working on port 3000");
});
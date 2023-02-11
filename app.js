const express = require("express");
const path = require("path");

const dbrepo = require("./dbrepo")

const app = express();

var repo;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static("static"));

app.use((req, res, next) => {
    repo = new dbrepo.Repository();
    next();
});

app.get("/", (req, res) => {
    var data = repo.retrieveRandom(3);
    res.render("index", { prods: { items: data } });
});

app.get("/games", (req, res) => {
    var data = repo.retrieve();
    res.render("view-all", { prods: { items: data } });
});

app.get("/games/:id", (req, res) => {
    var data = repo.retrieveByID(Number(req.params.id));
    res.render("view-details", { item: data });
});

app.use((req, res) => {
    res.render("404", { url: req.url });
});

app.listen(3000, () => {
    console.log("Working on port 3000");
});
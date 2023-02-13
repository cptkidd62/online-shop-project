const { Pool } = require("pg");

exports.Repository = class Repository {
    pool = null;
    constructor() {
        this.pool = new Pool({
            user: "cptkidd",
            host: "localhost",
            database: "shop_test_db",
            port: 5432,
        });
    }

    async retrieve() {
        var data = await this.pool.query("SELECT * FROM games");
        console.log(data.rows);
        return data.rows;
    }

    async retrieveByID(id) {
        var data = await this.pool.query("SELECT * FROM games WHERE id = $1", [id]);
        console.log(data.rows);
        if (data.rows.length != 0) {
            return data.rows[0];
        } else {
            return null;
        }
    }

    async retrieveBySearch(txt) {
        var data = await this.pool.query("SELECT * FROM games WHERE UPPER(name) LIKE UPPER('%' || $1 || '%') OR UPPER(developer) LIKE UPPER('%' || $1 || '%') OR UPPER(description) LIKE UPPER('%' || $1 || '%')", [txt]);
        console.log(data.rows);
        return data.rows;
    }

    async retrieveRandom(n) {
        var data = await this.pool.query("SELECT * FROM games ORDER BY RANDOM() LIMIT $1", [n]);
        console.log(data.rows);
        return data.rows;
    }

    async getPasswordForUsr(login) {
        var data = await this.pool.query("SELECT pwdhash FROM users WHERE login = $1", [login]);
        console.log(data.rows);
        if (data.rows.length != 0) {
            return data.rows[0].pwdhash;
        } else {
            return null;
        }
    }

    async getUsr(login) {
        var data = await this.pool.query("SELECT * FROM users WHERE login = $1", [login]);
        console.log(data.rows);
        return data.rows[0];
    }

    async createUsr(login, pwdhash, user, admin) {
        await this.pool.query("INSERT INTO users (login, pwdhash, isuser, isadmin) VALUES ($1, $2, $3, $4)", [login, pwdhash, user, admin]);
    }

    async getOrderInfo(id) {
        var data = await this.pool.query("SELECT * FROM orders WHERE id = $1", [id]);
        console.log(data.rows);
        if (data.rows.length != 0) {
            return data.rows[0];
        } else {
            return null;
        }
    }
}
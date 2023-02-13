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

    async createGame(name, img_name, developer, description, price, year) {
        await this.pool.query("INSERT INTO games (name, img_name, developer, description, price, year) VALUES ($1, $2, $3, $4, $5, $6)",
            [name, img_name, developer, description, price, year]);
    }

    async updateGame(id, name, img_name, developer, description, price, year) {
        await this.pool.query("UPDATE games SET name = $1, img_name = $2, developer = $3, description = $4, price = $5, year = $6 WHERE id = $7",
            [name, img_name, developer, description, price, year, id]);
    }

    async deleteGame(id) {
        await this.pool.query("DELETE FROM games WHERE id = $1", [id]);
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

    async getUsrs() {
        var data = await this.pool.query("SELECT * FROM users");
        console.log(data.rows);
        return data.rows;
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

    async getOrdersInfo(c_id, realized) {
        var data;
        if (c_id && realized != null) {
            data = await this.pool.query("SELECT * FROM orders WHERE customer_id = $1 AND realized = $2", [c_id, realized]);
        } else if (c_id) {
            data = await this.pool.query("SELECT * FROM orders WHERE customer_id = $1", [c_id]);
        } else if (realized != null) {
            data = await this.pool.query("SELECT * FROM orders WHERE realized = $1", [realized]);
        } else {
            data = await this.pool.query("SELECT * FROM orders");
        }
        console.log(data.rows);
        return data.rows;
    }

    async getOrderContents(id) {
        var data = await this.pool.query("SELECT games.id AS id, name, orders_games.price AS price, img_name, developer, year FROM (SELECT * FROM orders_games WHERE order_id = $1) AS orders_games LEFT JOIN games ON orders_games.game_id = games.id", [id]);
        console.log(data.rows);
        return data.rows;
    }

    async createOrder(cust_id, contentsList) {
        var data = await this.pool.query("INSERT INTO orders (customer_id, date, realized) VALUES ($1, $2, False) RETURNING id", [cust_id, new Date()]);
        console.log(data.rows);
        var oid = data.rows[0].id;
        for (var i = 0; i < contentsList.length; i++) {
            var dat = await this.pool.query("SELECT price FROM games WHERE id = $1", [contentsList[i]]);
            var price = dat.rows[0].price;
            await this.pool.query("INSERT INTO orders_games (order_id, game_id, price) VALUES ($1, $2, $3)", [oid, contentsList[i], price]);
        }
    }
}
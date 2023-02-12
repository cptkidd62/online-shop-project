exports.Repository = class Repository {
    data = [
        {
            id: 1,
            name: "Game 1",
            price: 50.0,
            img: "no-img.jpg",
            year: 2010,
            developer: "Dev 1",
        },
        {
            id: 2,
            name: "Game 2",
            price: 70.0,
            img: "no-img.jpg",
            year: 2013,
            developer: "Dev 1",
        },
        {
            id: 3,
            name: "Game 3",
            price: 150.0,
            img: "no-img.jpg",
            year: 2020,
            developer: "Dev 2",
        },
        {
            id: 4,
            name: "Game 4",
            price: 250.0,
            img: "no-img.jpg",
            year: 2021,
            developer: "Dev 1",
        },
        {
            id: 5,
            name: "Game 5",
            price: 200.0,
            img: "no-img.jpg",
            year: 2023,
            developer: "Dev 2",
        },
    ]

    users = [
        {
            id: 1,
            login: "kasia_p",
            pwd: "abcd",
            user: true,
            admin: false,
        },
        {
            id: 2,
            login: "admin_marcin",
            pwd: "admin",
            user: true,
            admin: true,
        },
        {
            id: 3,
            login: "wiola_jola",
            pwd: "1234",
            user: true,
            admin: false,
        },
    ]

    retrieve() {
        return this.data;
    }

    retrieveByID(id) {
        let val = null;
        this.data.forEach(e => {
            if (e.id == id) {
                val = e;
            }
        });
        return val;
    }

    retrieveBySearch(txt) {
        var res = [];
        this.data.forEach(e => {
            if (e.name.toLowerCase().includes(txt.toLowerCase()) ||
                e.developer.toLowerCase().includes(txt.toLowerCase())) {
                res.push(e);
            }
        });
        return res;
    }

    retrieveRandom(n) {
        var res = [];
        var vals = [];
        var v = 0;
        n = Math.min(n, this.data.length);
        for (let i = 0; i < n; i++) {
            do {
                v = Math.floor(Math.random() * this.data.length);
            } while (vals.includes(v));
            vals.push(v);
            res.push(this.data[v]);
        }
        return res;
    }

    getPasswordForUsr(login) {
        let pwd = null;
        this.users.forEach(u => {
            if (u.login == login) {
                pwd = u.pwd;
            }
        });
        return pwd;
    }
}
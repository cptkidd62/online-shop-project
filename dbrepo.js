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
}
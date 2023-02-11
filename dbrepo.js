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
    ]

    retrieve() {
        return this.data;
    }
}
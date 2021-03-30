const express = require('express');
const app = express();
const port = 4000;
const cors = require('cors');
const axios = require("axios");
const cheerio = require('cheerio');
const request = require('request');
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://DanielChung:Fufupapachon23@cluster0.6z8gr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("This is cookiy testapp back-end");
});

app.post('/allrecipes', (req, res) => {
    let url = req.body.linkUrl;

    request(url, (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            let title = $('.headline-wrapper').text().trim();
            let ingredientList = [];
            let picture = $('div[class="image-container"]').children().attr('data-src');
            $(".ingredients-section li").each((i, el) => {
                ingredientList.push($(el).text().trim());
            });

            console.log(title);
            console.log(picture);
            console.log(ingredientList);

        }
    });
    res.sendStatus(200);
})

app.post('/pinterest', (req, res) => {
    let url = req.body.linkUrl;

    request(url, (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            let title = $('.lH1.dyH.iFc.ky3.pBj.DrD.IZT').text();
            console.log(title);
        }
    });

    console.log(req.body);
    res.sendStatus(200);
})


app.get("saved", (req, res) => {
    console.log(req.body);
});


app.post('/login', (req, res) => {
    const {username: usernameDB, password: passwordDB} = req.body;
    console.log(usernameDB, passwordDB);
    if (usernameDB != null || password != null){
        client.connect(async (err) => {
            const collection = client.db("cookiy-testapp").collection("users");
            const user = await collection.findOne({username: usernameDB, password: passwordDB});
            if (user){
                console.log(user);
                console.log("Exists user");
                res.sendStatus(200);
                client.close();
            }
            else{
                res.sendStatus(404);
            }
        });
    }
});

app.post('/signup', (req, res) => {
    const { name: nameDB, last: lastDB, email: emailDB, username: usernameDB, password: passwordDB, passwordVerification: passwordVerDB} = req.body;
    if(passwordDB == passwordVerDB){
        if(lastDB != '' && nameDB != '' && emailDB != '' && usernameDB != ''){
            client.connect(async (err) => {
                const collection = client.db("cookiy-testapp").collection("users");
                const user = {
                    name: nameDB,
                    last: lastDB,
                    email: emailDB,
                    username: usernameDB,
                    password: passwordDB,
                    recipes: [],
                    followers: [],
                    following: [],
                    cookbooks: []
                }
                const existsEmail = await collection.findOne({email: emailDB});
                const existsUsername = await collection.findOne({username: usernameDB});
                if (!existsEmail && !existsUsername){
                    await collection.insertOne(user);
                    client.close();
                    console.log(req.body);
                    console.log("User has been added");
                    res.sendStatus(201);
                }
                else{
                    res.sendStatus(400);
                    console.log("user already exists");
                }
            });
        }
        else{
            res.sendStatus(406);
        }
    }
    else {
        res.sendStatus(409);
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

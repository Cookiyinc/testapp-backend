const express = require('express');
const app = express();
const port = 4000;
const cors = require('cors');
const cheerio = require('cheerio');
const request = require('request');
const uuid = require('uuid');
const Webscraper = require('./Webscraper');
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://DanielChung:Fufupapachon23@cluster0.6z8gr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: false });

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("This is cookiy testapp back-end");
});

app.put('/allrecipes', (req, res) => {
    const url = req.body.linkUrl;
    const user = req.body.user;
    const recipe = Webscraper.allRecipes(url, user);
    const recipeID = {
        _id: recipe._id
    }
    client.connect(async (err) => {
        const collection = client.db("cookiy-testapp").collection("users");
        const recipes = client.db("cookiy-testapp").collection("recipes");
        const query = {username: user};
        await recipes.insertOne(recipe);
        const recipeQuery = {$push: {recipes: recipeID}};
        await collection.updateOne(query, recipeQuery, (err, res) => {
            if (err) throw err;
            console.log("1 recipe added");
        });
    });
    res.sendStatus(200);
})

app.put('/foodnetwork', (req, res)=> {
    const url = req.body.linkUrl;
    const user = req.body.user;
    const recipe = Webscraper.foodNetwork(url, user);
    console.log(recipe);
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


app.get("/saved?:user",(req, res) => {
    const user = req.query.user;
    console.log(user);
    let recipes = [];
    client.connect(async (err) => {
        const collection = client.db("cookiy-testapp").collection("recipes");
        const userSaved = await collection.find({"user": user})
        .forEach((recipe)=>{
            recipes.push(recipe)
        });
        console.log(recipes);
        res.send(recipes);
    });
});

app.get("/profile?:user",(req, res) => {
    const user = req.query.user;
    client.connect(async (err) => {
        const collection = client.db("cookiy-testapp").collection("users");
        const userSaved = await collection.findOne({"username": user})
        console.log(userSaved);
        res.json(userSaved);
    });
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
            }
            else{
                console.log("Wrong credentials");
                res.sendStatus(404);
            }
        });
    }
});

app.post('/signup',(req, res) => {
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
                console.log(existsEmail);
                const existsUsername = await collection.findOne({username: usernameDB});
                if (!existsEmail && !existsUsername){
                    await collection.insertOne(user);
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
    console.log(`Cookiy app listening at http://localhost:${port}`)
})


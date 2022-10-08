const express = require('express');
const app = express();
const port = 4000;
const cors = require('cors');
const cheerio = require('cheerio');
const request = require('request');
const uuid = require('uuid');
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://DanielChung:<password>@cluster0.6z8gr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: false });

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("This is cookiy testapp back-end");
});

app.put('/allrecipes', (req, res) => {
    const url = req.body.linkUrl;
    const user = req.body.user;
    request(url, (error, response, html) => {
        const $ = cheerio.load(html);
        let title = $('.headline-wrapper').text().trim();
        let ingredientList = [];
        let instructionList = [];
        let picture = $('div[class="image-container"]').children().attr('data-src');
        $(".ingredients-section li").each((i, el) => {
            ingredientList.push($(el).text().trim());
        });
        $(".instructions-section p").each((i, el) => {
            instructionList.push($(el).text());
        });
        let id = uuid.v4();
        let times = [];
        $('.recipe-meta-item-body').each((i, el) => {
            times.push($(el).text().trim());
        });
        let totalTime = times[2];
        let totalServings = times[3];
        const recipeID = {
            _id: id
        }
        const recipe = {
            _id: id,
            title: title,
            user: user,
            pictureLink: picture,
            ingredientList: ingredientList,
            instructionList: instructionList,
            time: totalTime,
            servings: totalServings,
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
    })
    res.sendStatus(200);
});

app.put('/foodnetwork', (req, res)=> {
    const url = req.body.linkUrl;
    const user = req.body.user;
    request(url, (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            let title = $(".o-AssetTitle__a-HeadlineText").text();
            let ingredientList = [];
            let instructionList = [];
            let totalTime = $(".m-RecipeInfo__a-Description--Total").text().slice(1,7);
            let picture = null;
            let totalServings = null;
            let id = uuid.v4();
            $(".o-RecipeInfo__m-Yield > li").each((i, el)=> {
                if (i === 0){
                    totalServings = $(el).text().trim().slice(6, 17).trim();
                }
            });
            $(".m-MediaBlock__a-Image.a-Image").each((i, el) => {
                if ( i === 0){
                    picture = "https://" + $(el).attr("src").slice(2);
                }
            });
            $(".o-Ingredients__a-Ingredient--CheckboxLabel").each((i, el) => {
                if (i > 0){
                    ingredientList.push($(el).text().trim());
                }
            })
            $(".o-Method__m-Step").each((i, el)=>{
                instructionList.push($(el).text().trim());
            });
            const recipeID = {
                _id: id
            }
            const recipe = {
                _id: id,
                title: title,
                user: user,
                pictureLink: picture,
                ingredientList: ingredientList,
                instructionList: instructionList,
                time: totalTime,
                servings: totalServings,
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
        }
    });
    res.sendStatus(200);
});

app.delete('/deleterecipe', (req, res)=> {
    const user = req.body.user;
    const recipeID = req.body.recipeID;
    client.connect(async (err) => {
        const recipeCollection = client.db("cookiy-testapp").collection("recipes");
        const userCollection = client.db("cookiy-testapp").collection("users");
        const query = {username: user};
        const recipeQuery = {_id: recipeID};
        const deleteQuery = {$pull: {recipes:{_id: recipeID}}}
        await recipeCollection.deleteOne(recipeQuery);
        await userCollection.updateOne(query, deleteQuery, (err, res)=> {
            if (err) throw err;
            console.log("1 recipe deleted.")
        });
    });
    res.sendStatus(200);
});

app.get('/getRecipe?:id', (req, res) => {
    let recipeID = req.query.id;
    console.log(recipeID);
    client.connect( async (err)=>{
        const collection = client.db("cookiy-testapp").collection("recipes");
        const recipe = await collection.findOne({"_id": recipeID});
        console.log(recipe);
        res.json(recipe);
    });
});

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
});


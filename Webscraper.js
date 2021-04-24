const request = require('request');
const cheerio = require('cheerio');
const uuid = require('uuid');

module.exports = {
    // Allrecipes.com webscraper
    allRecipes: function(url, user){
        let allRecipeRecipe = new Object();
        request(url, (error, response, html) => {
            if (!error && response.statusCode == 200) {
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
                allRecipeRecipe._id = id;
                allRecipeRecipe.title = title;
                allRecipeRecipe.user = user;
                allRecipeRecipe.pictureLink = picture;
                allRecipeRecipe.ingredientList = ingredientList;
                allRecipeRecipe.instructionList = instructionList;
                allRecipeRecipe.time = totalTime;
                allRecipeRecipe.servings = totalServings;
            }
        });
        return allRecipeRecipe;
    },
    // foodnetwork.com webscraper
    foodNetwork: function(url, user){
        let foodNetworkRecipe = new Object();
        let temp = null;
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
                        picture = $(el).attr("src").slice(2);
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
                foodNetworkRecipe._id = id;
                foodNetworkRecipe.title = title;
                foodNetworkRecipe.user = user;
                foodNetworkRecipe.pictureLink = picture;
                foodNetworkRecipe.ingredientList = ingredientList;
                foodNetworkRecipe.instructionList = instructionList;
                foodNetworkRecipe.time = totalTime;
                foodNetworkRecipe.servings = totalServings;

                console.log(foodNetworkRecipe);
            }
        });
    }
};

const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const multer = require('multer')
const mongoose = require("mongoose")


const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploaded-images/')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage: fileStorage })

const app = express()

app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))

mongoose.connect("mongodb://localhost:27017/recipesDB")

const recipeSchema = new mongoose.Schema({
    name: String,
    desc: String,
    ingredients: String,
    imageNames: [String]
})

const Recipe = mongoose.model("Recipe", recipeSchema)


/**************************Routes*************************/

app.get("/", (req, res) => {
    Recipe.find(function (err, recipes) {
        res.render("home", ({ recipes: recipes.slice(0, 5) }))
    })
})

app.get("/add-recipe", (req, res) => {
    res.render("addrecipe")
})

app.post("/add-recipe", upload.array('recipe-images', 5), (req, res) => {
    //console.log(req.files[0].filename);
    const imageNames = []

    req.files.forEach(file => {
        imageNames.push(file.filename);
    })

    //console.log(fileNames)
    const title = req.body.title
    const desc = req.body.description
    const ingredients = req.body.ingredients
    const newRecipe = new Recipe({
        name: title,
        desc: desc,
        ingredients: ingredients,
        imageNames: [...imageNames]
    })
    newRecipe.save(function (err) {
        if (!err) {
            res.redirect("/")
        }
    })

    //console.log(newRecipe)
})

app.get("/recipes/:recipeId", (req, res) => {
    const recipeId = req.params.recipeId

    Recipe.find(function (err, recipes) {
        recipes.forEach(recipe => {
            //console.log(recipe.id);
            if (recipe.id === recipeId) {
                res.render("recipe", ({ recipe: recipe }))
            }
        })
    })
})

app.get("/all-recipes/:classification", (req, res) => {

    const category = req.params.classification

    Recipe.find(function (err, recipes) {
        if (category === "Latest") {
            res.render("allrecipes", ({ category: category, recipes: recipes.slice(recipes.length - 5) }))
        } else {
            res.render("allrecipes", ({ category: category, recipes: recipes }))
        }
    })


})


app.post("/search", (req, res) => {

    //console.log(req.body.searchId)

    const searchq = req.body.searchId
    // const foundMatches = []
    var rgxp = new RegExp(searchq, "i");

    Recipe.find({ name: rgxp })
        .then((results) => {
            res.render("search", ({ searchQuery: searchq, recipes: results }))
        })
        .catch(err => {
            console.log(err);
        })
    // Recipe.find(function (err, recipes) {

    //     recipes.forEach(recipe => {
    //         if (recipe.name.match(rgxp)) {
    //             console.log("here")
    //             foundMatches.push(recipe)
    //             console.log(foundMatches)
    //         }
    //     })

    //     res.render("search", ({ searchQuery: searchq, recipes: foundMatches }))
    // })

    // console.log(foundMatches.length)
})
app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/login", (req, res) => {
    const username = req.body.username
    const password = req.body.password
    console.log(username, password);
    res.redirect("/")
})

app.get("/about", (req, res) => {
    res.render("about")
})

app.listen(3000, (err) => {
    if (!err) {
        console.log("Server running on port 3000")
    }
})




/*font-family: 'Merriweather Sans', sans-serif;
font-family: 'Montserrat', sans-serif;
font-family: 'Ubuntu', sans-serif;
font-family: 'Varela Round', sans-serif;*/
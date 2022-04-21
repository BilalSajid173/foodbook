
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const multer = require('multer')
//const upload = multer({ dest: 'public/uploaded-images/' })

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


const recipes = [
]






app.get("/", (req, res) => {
    res.render("home", ({ recipes: recipes.slice(0, 5) }))
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
    const newRecipe = {
        name: title,
        desc: desc,
        ingredients: ingredients,
        imageNames: [...imageNames]
    }

    //console.log(newRecipe)
    recipes.push(newRecipe)
    res.redirect("/")
})

app.get("/about", (req, res) => {
    res.render("about")
})

app.get("/recipes/:recipe", (req, res) => {
    const recipeName = req.params.recipe

    recipes.forEach(recipe => {
        if (recipeName === recipe.name) {
            res.render("recipe", ({ recipe: recipe }))
        }
    })
})

app.get("/all-recipes/:classification", (req, res) => {

    const category = req.params.classification

    if (category === "Latest") {
        res.render("allrecipes", ({ category: category, recipes: recipes.slice(recipes.length - 5) }))
    } else {
        res.render("allrecipes", ({ category: category, recipes: recipes }))
    }


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

app.listen(3000, (err) => {
    if (!err) {
        console.log("Server running on port 3000")
    }
})




/*font-family: 'Merriweather Sans', sans-serif;
font-family: 'Montserrat', sans-serif;
font-family: 'Ubuntu', sans-serif;
font-family: 'Varela Round', sans-serif;*/
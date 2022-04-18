
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')


const app = express()

app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))


const recipes = [
    {
        name: "Chicken",
        desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Rhoncus est pellentesque elit ullamcorper dignissim cras.Mauris si"
    },
    {
        name: "Mutton",
        desc: "Venenatis lectus magna fringilla urna porttitor rhoncus dolor purus non. Dignissim sodales ut eu sem integer vitae justo eget."
    },
    {
        name: "Biryani",
        desc: "Venenatis lectus magna fringilla urna porttitor rhoncus dolor purus non. Dignissim sodales ut eu sem integer vitae justo eget."
    },
    {
        name: "Chicken",
        desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Rhoncus est pellentesque elit ullamcorper dignissim cras.Mauris si"
    },
    {
        name: "Mutton",
        desc: "Venenatis lectus magna fringilla urna porttitor rhoncus dolor purus non. Dignissim sodales ut eu sem integer vitae justo eget."
    },
    {
        name: "Biryani",
        desc: "Venenatis lectus magna fringilla urna porttitor rhoncus dolor purus non. Dignissim sodales ut eu sem integer vitae justo eget."
    },
    {
        name: "Chicken",
        desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Rhoncus est pellentesque elit ullamcorper dignissim cras.Mauris si"
    },
    {
        name: "Mutton",
        desc: "Venenatis lectus magna fringilla urna porttitor rhoncus dolor purus non. Dignissim sodales ut eu sem integer vitae justo eget."
    },
    {
        name: "Biryani",
        desc: "Venenatis lectus magna fringilla urna porttitor rhoncus dolor purus non. Dignissim sodales ut eu sem integer vitae justo eget."
    }
]






app.get("/", (req, res) => {
    res.render("home", ({ recipes: recipes.slice(0, 5) }))
})

app.get("/add-recipe", (req, res) => {
    res.render("addrecipe")
})

app.post("/add-recipe", (req, res) => {
    const title = req.body.title
    const desc = req.body.desc
    const newRecipe = {
        name: title,
        desc: desc
    }
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
app.listen(3000, (err) => {
    if (!err) {
        console.log("Server running on port 3000")
    }
})




/*font-family: 'Merriweather Sans', sans-serif;
font-family: 'Montserrat', sans-serif;
font-family: 'Ubuntu', sans-serif;
font-family: 'Varela Round', sans-serif;*/
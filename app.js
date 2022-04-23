
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const multer = require('multer')
const mongoose = require("mongoose")
const session = require('express-session')
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")


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

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/recipesDB")

const recipeSchema = new mongoose.Schema({
    name: String,
    desc: String,
    ingredients: String,
    imageNames: [String],
    addedBy: String,
    favouritedBy: [String],
})


const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    address: String,
    about: String,
    recipes: [recipeSchema],
    age: String,
    phoneNum: Number,
    hobbies: String,
    profilePicName: String,
    favRecipes: [recipeSchema]
})

userSchema.plugin(passportLocalMongoose)

const Recipe = mongoose.model("Recipe", recipeSchema)

const User = mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id)
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user)
    })
});

/**************************Routes*************************/

app.get("/", (req, res) => {
    Recipe.find(function (err, recipes) {
        res.render("home", ({ recipes: recipes.slice(0, 3) }))
    })
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

    // Recipe.find(function (err, recipes) {
    //     if (category === "Latest") {
    //         res.render("allrecipes", ({ category: category, recipes: recipes.slice(recipes.length - 3) }))
    //     } else {
    //         res.render("allrecipes", ({ category: category, recipes: recipes }))
    //     }
    // })

    if (category === "Latest") {
        Recipe.find((err, recipes) => {
            res.render("allrecipes", ({ category: category, recipes: recipes.slice(recipes.length - 3) }))
        })
    } else if (category === "Top-Rated") {
        Recipe.find((err, recipes) => {
            res.render("allrecipes", ({ category: category, recipes: recipes }))
        })
    } else {
        console.log("here")
        Recipe.find((err, recipes) => {
            res.render("allrecipes", ({ category: category, recipes: recipes }))
        })
    }


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

app.get("/signup", (req, res) => {
    res.render("signup")
})

app.get("/landing-page", (req, res) => {

    if (req.isAuthenticated()) {
        res.render("landing-page", ({ user: req.user, recipes: req.user.recipes }))
    } else {
        res.redirect("/login")
    }
})


app.post("/signup", (req, res) => {

    const newUser = new User({
        name: req.body.name,
        username: req.body.username,
        address: req.body.address,
        about: req.body.about,
        age: null,
        phoneNum: null,
        hobbies: null
    })

    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/signup")
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/landing-page")
            })
        }
    })

})

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/signup', failureMessage: true }),
    function (req, res) {
        res.redirect("landing-page");
    });

// app.post("/login", (req, res) => {
//     const user = new User({
//         username: req.body.username,
//         password: req.body.password
//     })

//     req.login(user, function (err) {
//         if (err) {
//             console.log(err);
//         } else if (!user) {
//             passport.authenticate("local", { failureRedirect: '/signup', failureMessage: true })(req, res, function () {
//                 res.redirect("/landing-page")
//             })
//             // res.redirect("/signup")
//         }
//     })
// })

app.get("/add-recipe", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("addrecipe")
    } else {
        res.redirect("/login")
    }

})

app.post("/add-recipe", upload.array('recipe-images', 5), (req, res) => {
    //console.log(req.files[0].filename);

    const imageNames = []

    req.files.forEach(file => {
        imageNames.push(file.filename);
    })

    const title = req.body.title
    const desc = req.body.description
    const ingredients = req.body.ingredients
    const newRecipe = new Recipe({
        name: title,
        desc: desc,
        ingredients: ingredients,
        imageNames: [...imageNames],
        addedBy: req.user.name
    })
    newRecipe.save(function (err) {
        if (!err) {
            req.user.recipes.push(newRecipe)
            req.user.save()
            res.render("landing-page", ({ user: req.user, recipes: req.user.recipes }))
        } else {
            console.log(err)
        }
    })



    //console.log(fileNames)
    //console.log(newRecipe)
})

app.get("/logout", function (req, res) {
    req.logout();
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
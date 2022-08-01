const path = require("path");
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const multer = require("multer");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { cloudinary } = require("./utils/cloudinary");

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploaded-images/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, callback) => {
  var ext = path.extname(file.originalname);
  if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
    return callback(new Error("Only images are allowed"));
  }
  callback(null, true);
};

const upload = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 },
});

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const dburl = process.env.DB_URL;
mongoose.connect(dburl, {
  usenewurlparser: true,
  useunifiedtopology: true,
});
// mongoose.connect("mongodb://localhost:27017/recipesDB")

const recipeSchema = new mongoose.Schema({
  name: String,
  desc: String,
  ingredients: String,
  imageNames: [String],
  addedBy: String,
  favouritedBy: [String],
});

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
  favRecipesId: [String],
});

userSchema.plugin(passportLocalMongoose);

const Recipe = mongoose.model("Recipe", recipeSchema);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

/**************************Routes*************************/

app.get("/", (req, res) => {
  Recipe.find(function (err, recipes) {
    if (recipes) {
      const latest = recipes.slice(recipes.length - 6);
      latest.reverse();
      recipes.sort((a, b) => {
        return b.favouritedBy.length - a.favouritedBy.length;
      });

      const topRated = recipes.slice(0, 6);
      res.render("home", { topRated: topRated, latest: latest });
    } else {
      console.log(err);
    }
  });
});

app.get("/recipes/:recipeId", (req, res) => {
  const recipeId = req.params.recipeId;

  //logic for favourite recipes
  let fav = false;
  if (req.user) {
    const foundfavourite = req.user.favRecipesId.find((recipeID) => {
      return recipeID === recipeId;
    });
    if (foundfavourite) {
      fav = true;
    }
  }

  Recipe.find(function (err, recipes) {
    if (recipes) {
      recipes.forEach((recipe) => {
        //console.log(recipe.id);
        if (recipe.id === recipeId) {
          res.render("recipe", { recipe: recipe, fav: fav });
        }
      });
    } else {
      console.log(err);
    }
  });
});

app.get("/all-recipes/:classification", (req, res) => {
  const category = req.params.classification;

  if (category === "Latest") {
    Recipe.find((err, recipes) => {
      res.render("allrecipes", {
        category: category,
        recipes: recipes.slice(recipes.length - 12).reverse(),
      });
    });
  } else if (category === "Top-Rated") {
    Recipe.find((err, recipes) => {
      recipes.sort((a, b) => {
        return b.favouritedBy.length - a.favouritedBy.length;
      });

      const topRated = recipes.slice(0, 12);
      res.render("allrecipes", { category: category, recipes: topRated });
    });
  } else {
    Recipe.find((err, recipes) => {
      recipes.sort((a, b) => {
        return b.favouritedBy.length - a.favouritedBy.length;
      });
      res.render("allrecipes", { category: category, recipes: recipes });
    });
  }
});

app.post("/search", (req, res) => {
  const searchq = req.body.searchId;
  var rgxp = new RegExp(searchq, "i");

  Recipe.find({ name: rgxp })
    .then((results) => {
      res.render("search", { searchQuery: searchq, recipes: results });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/landing-page", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("landing-page", { user: req.user, recipes: req.user.recipes });
  } else {
    res.redirect("/login");
  }
});

app.post("/signup", (req, res) => {
  const newUser = new User({
    name: req.body.name,
    username: req.body.username,
    address: req.body.address,
    about: req.body.about,
    age: null,
    phoneNum: null,
    hobbies: null,
  });

  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/signup");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/landing-page");
      });
    }
  });
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/signup",
    failureMessage: true,
  }),
  function (req, res) {
    res.redirect("landing-page");
  }
);

app.get("/add-recipe", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("addrecipe");
  } else {
    res.redirect("/login");
  }
});

app.post("/add-recipe", upload.array("recipe-images", 5), (req, res) => {
  const imageNames = [];
  const title = req.body.title;
  const desc = req.body.description;
  const ingredients = req.body.ingredients;
  let count = 0;
  req.files.forEach(async (file) => {
    try {
      const response = await cloudinary.uploader.upload(file.path, {
        upload_preset: "recipe-app-preset",
      });
      //publicId = response.public_id;
      console.log(response.url);
      imageNames.push(response.url);
      count++;
      if (count == req.files.length) {
        const newRecipe = new Recipe({
          name: title,
          desc: desc,
          ingredients: ingredients,
          imageNames: [...imageNames],
          addedBy: req.user.name,
        });

        newRecipe.save(function (err) {
          if (!err) {
            req.user.recipes.push(newRecipe);
            req.user.save();
            res.redirect("/landing-page");
          } else {
            console.log(err);
          }
        });
      }
    } catch (error) {
      console.log(error);
    }
  });
});

app.get("/edit-profile", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("edit-profile", { user: req.user });
  } else {
    res.redirect("/login");
  }
});

app.post("/edit-profile", (req, res) => {
  req.user.name = req.body.name;
  req.user.username = req.body.username;
  req.user.address = req.body.address;
  req.user.age = req.body.age;
  req.user.phoneNum = req.body.phone;
  req.user.hobbies = req.body.hobbies;
  req.user.about = req.body.about;
  req.user
    .save()
    .then((savedUser) => {
      res.redirect("/landing-page");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/edit-recipe/:recipeID", (req, res) => {
  if (req.isAuthenticated()) {
    //console.log(req.params.recipeID)
    Recipe.findOne({ _id: req.params.recipeID }, (err, foundRecipe) => {
      if (foundRecipe) {
        res.render("edit-recipe", { recipe: foundRecipe });
      } else {
        console.log(err);
      }
    });
  } else {
    res.redirect("/login");
  }
});

//find a better way for this one
app.post("/edit-recipe", upload.array("recipe-images", 5), (req, res) => {
  const recipeId = req.body.recipeId;

  Recipe.findOne({ _id: recipeId }, (err, foundRecipe) => {
    if (foundRecipe) {
      foundRecipe.name = req.body.title;
      foundRecipe.desc = req.body.description;
      foundRecipe.ingredients = req.body.ingredients;

      if (req.files.length !== 0) {
        //if new images are added, then we overwrite the previous ones otherwise we keep them
        const imageNames = [];
        let count = 0;
        req.files.forEach(async (file) => {
          try {
            const response = await cloudinary.uploader.upload(file.path, {
              upload_preset: "recipe-app-preset",
            });
            imageNames.push(response.url);
            count++;
            if (count == req.files.length) {
              foundRecipe.imageNames = [];
              foundRecipe.imageNames = [...imageNames];
              foundRecipe.save();
              User.findOneAndUpdate(
                { _id: req.user.id },
                { $pull: { recipes: { _id: req.body.recipeId } } },
                function (err, foundRec) {
                  if (!err) {
                    //console.log(foundRecipe)
                    req.user.recipes.push(foundRecipe);
                    req.user.save().then((result) => {
                      res.redirect("/landing-page");
                    });
                  } else {
                    console.log(err);
                  }
                }
              );
            }
          } catch (error) {
            console.log(error);
          }
        });
      } else {
        foundRecipe.save();
        User.findOneAndUpdate(
          { _id: req.user.id },
          { $pull: { recipes: { _id: req.body.recipeId } } },
          function (err, foundRec) {
            if (!err) {
              //console.log(foundRecipe)
              req.user.recipes.push(foundRecipe);
              req.user.save().then((result) => {
                res.redirect("/landing-page");
              });
            } else {
              console.log(err);
            }
          }
        );
      }
    }
  });
});

app.post("/delete-recipe", (req, res) => {
  const recipeId = req.body.recipeId;

  Recipe.findOneAndDelete({ _id: recipeId }, (err, foundRecipe) => {
    if (!err) {
      //console.log(foundRecipe);
      User.findOneAndUpdate(
        { _id: req.user.id },
        { $pull: { recipes: { _id: recipeId } } },
        function (err, foundRecipe) {
          if (!err) {
            res.redirect("/landing-page");
          } else {
            console.log(err);
          }
        }
      );
    } else {
      console.log(err);
    }
  });
});

app.post("/add-to-favourite", (req, res) => {
  if (req.isAuthenticated()) {
    const recid = req.body.recipeId;
    Recipe.findOne({ _id: recid }, (err, foundRecipe) => {
      if (foundRecipe) {
        foundRecipe.favouritedBy.push(req.user.id);
        foundRecipe.save();
        req.user.favRecipesId.push(recid);
        req.user.save();
        res.redirect(`/recipes/${recid}`);
      } else {
        console.log(err);
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/remove-from-favourite", (req, res) => {
  const recid = req.body.recipeId;

  Recipe.findOne({ _id: recid }, (err, recipe) => {
    if (recipe) {
      const userindex = recipe.favouritedBy.findIndex((id) => {
        return id === req.user.id;
      });

      recipe.favouritedBy.splice(userindex, userindex + 1);
      recipe.save();

      const recindex = req.user.favRecipesId.findIndex((id) => {
        return id === recid;
      });

      req.user.favRecipesId.splice(recindex, recindex + 1);
      req.user
        .save()
        .then(() => {
          res.redirect(`/recipes/${recid}`);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });
});

app.get("/favourite-recipes", (req, res) => {
  if (req.isAuthenticated()) {
    const favrecipes = [];
    let counter = 0;

    if (req.user.favRecipesId.length === 0) {
      res.render("favourites", { recipes: favrecipes });
    } else {
      req.user.favRecipesId.forEach((id) => {
        Recipe.findById(id, (err, foundRecipe) => {
          counter++;
          if (foundRecipe) {
            favrecipes.push(foundRecipe);
          }

          if (counter === req.user.favRecipesId.length) {
            res.render("favourites", { recipes: favrecipes });
          }
        });
      });
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, (err) => {
  if (!err) {
    console.log("Server running on port 3000");
  }
});

/*font-family: 'Merriweather Sans', sans-serif;
font-family: 'Montserrat', sans-serif;
font-family: 'Ubuntu', sans-serif;
font-family: 'Varela Round', sans-serif;*/

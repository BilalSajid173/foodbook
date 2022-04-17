
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')


const app = express()

app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))

app.get("/", (req, res) => {
    res.render("home")
})

app.get("/add-recipe", (req, res) => {
    res.render("addrecipe")
})
app.listen(3000, (err) => {
    if (!err) {
        console.log("Server running on port 3000")
    }
})
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const Mongoose = require("mongoose");
var dns = require("dns");
// Basic Configuration
const port = process.env.PORT || 3000;
Mongoose.connect(process.env.MONGO_URI)
  .then((data) => {
    console.log("connected");
  })
  .catch((e) => {
    console.log("error");
  });
const MyModel = Mongoose.model(
  "URL",
  new Mongoose.Schema({
    url: String,
    short_url: { type: Number, require: true },
  })
);
app.use(cors());
app.use("/public", express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/shorturl/:short_url", function (req, res) {
  if (!req.params.short_url || isNaN(Number(req.params.short_url)))
    return res.send("Not Found");
  MyModel.findOne({ short_url: Number(req.params.short_url) })
    .then((data) => {
      console.log(data.url);
      return res.redirect(data.url);
    })
    .catch((e) => {
      console.log(e);
      return res.send("Not Found");
    });
});
app.post("/api/shorturl", function (req, res) {
  let input = "",
    domain = "",
    param = "",
    short = 0;

  //Post url from user input
  input = req.body.url;
  if (input === null || input === "") {
    return res.json({ error: "invalid url" });
  }

  //matches a string with regular expr => return array
  //url should contains : http:// or https://
  domain = input.match(
    /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/gim
  );
  //search a string with regular expr, and replace the string -> delete https://
  param = domain[0].replace(/^https?:\/\//i, "");

  dns.lookup(param, (err, address, family) => {
    if (err) {
      return res.json({ error: "invalid URL" });
    } else {
      var new_url = new MyModel({
        url: req.body.url,
        short_url: Math.floor(Math.random() * req.body.url.length),
      });
      new_url
        .save()
        .then((data) => {
          return res.json({
            original_url: data.url,
            short_url: data.short_url,
          });
        })
        .catch((e) => {
          console.log(e);
          return res.json({ error: "invalid e" });
        });
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

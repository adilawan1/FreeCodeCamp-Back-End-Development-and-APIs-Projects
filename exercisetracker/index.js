const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const Mongoose = require("mongoose");
require("dotenv").config();
Mongoose.connect(process.env.MONGO_URI)
  .then((data) => {
    console.log("connected");
  })
  .catch((e) => {
    console.log("error");
  });
const ExcerciseModel = Mongoose.model(
  "Excercise",
  new Mongoose.Schema({
    username: String,
    description: String,
    duration: Number,
    date: Date,
  })
);
const UserModel = Mongoose.model(
  "User",
  new Mongoose.Schema({
    username: String,
  })
);

const LogModel = Mongoose.model(
  "Log",
  new Mongoose.Schema({
    username: String,
    count: Number,
    log: [{ description: String, duration: Number, date: Date }],
  })
);
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.get("/api/users", function (req, res) {
  UserModel.find({})
    .then((data) => res.json(data))
    .catch((e) => res.send("error"));
});

app.get("/api/users/:_id/logs", function (req, res) {
  let limit = req.query?.limit ? req.query.limit : 0;
  let from = req.query?.from ? new Date(req.query.from) : null;
  let to = req.query?.to ? new Date(req.query.to) : null;
  let dateFilters =
    to && from
      ? { $gte: from, $lte: to }
      : to && !from
      ? { $lte: to }
      : !to && from
      ? { $gte: from }
      : null;
  let filters = {};
  UserModel.findById(req.params._id)
    .then((data) => {
      filters.username = data.username;
      if (dateFilters) filters.date = dateFilters;
      ExcerciseModel.find({
        $and: [filters],
      })
        .limit(limit)
        .then((data2) => {
          res.json({
            _id: data._id,
            username: data.username,
            log: data2.map((ex) => {
              return {
                description: ex.description,
                duration: ex.duration,
                date: ex?.date
                  ? new Date(ex?.date).toDateString()
                  : new Date().toDateString(),
              };
            }),
            count: data2.length,
          });
        })
        .catch();
    })
    .catch((e) => res.send("error"));
});

app.post("/api/users", function (req, res) {
  const user = new UserModel({ username: req.body.username });
  user
    .save()
    .then((data) => res.json({ username: data.username, _id: data._id }))
    .catch((e) => res.send("error"));
});

app.post("/api/users/:_id/exercises", function (req, res) {
  const username = UserModel.findById(req.params._id)
    .then((data) => {
      const excercise = new ExcerciseModel({
        username: data.username,
        description: req.body.description,
        duration: req.body.duration,
        date: req?.body?.date ? new Date(req?.body?.date) : new Date(),
      });
      excercise
        .save()
        .then((data) =>
          res.json({
            _id: req.params._id,
            username: data.username,
            date: data.date.toDateString(),
            duration: data.duration,
            description: data.description,
          })
        )
        .catch((e) => {
          console.log(e);
          res.send("error");
        });
    })
    .catch((e) => console.log(e));
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

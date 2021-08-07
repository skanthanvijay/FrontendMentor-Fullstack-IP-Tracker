// Setup Code
const dotenv = require('dotenv').config({path: __dirname + '/.env'});
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const lodash = require("lodash");
const https = require('https');

const app = express();

const dataSchema = new mongoose.Schema({
  ipAddress: String,
  location: String,
  timezone: String,
  isp: String,
  lat: Number,
  lng: Number
});

const Datum = mongoose.model("Datum", dataSchema);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGO_URL + "/ipDB", { useNewUrlParser: true });


// Default Page Loading
app.get("/", function(req, res) {
  res.render("index", {
    ipadd: "0.0.0.0",
    locn: "Orlando, Florida",
    tz: "-5:00",
    intSP: "Example ISP",
    latd: 28.557,
    lngd: -81.38,
    alertComment: "//",
  });
});


// IP Submission Page Loading
app.post("/", function(req, res) {
  const ipAddr = req.body.ipInput;

  https.get("https://geo.ipify.org/api/v1?apiKey=" + process.env.IPLOC_KEY + "&ipAddress=" + ipAddr, function(response) {

    if (response.statusCode === 200) {

    response.on('data', function(data) {
      const newData = JSON.parse(data);

      const datum = new Datum ({
        ipAddress: ipAddr,
        location: newData.location.city + ", " + newData.location.region,
        timezone: newData.location.timezone,
        isp: newData.isp,
        lat: newData.location.lat,
        lng: newData.location.lng
      });

      datum.save();
      console.log(datum);

      res.render("index", {
        ipadd: datum.ipAddress,
        locn: datum.location,
        tz: datum.timezone,
        intSP: datum.isp,
        latd: datum.lat,
        lngd: datum.lng,
        alertComment: "//"
      });
    }); }

    else {

      console.log(response.statusCode);

      res.render("index", {
        ipadd: "0.0.0.0",
        locn: "Orlando, Florida",
        tz: "-5:00",
        intSP: "Example ISP",
        latd: 28.557,
        lngd: -81.385,
        alertComment: ""
      });
    }

  });
});


// Server Porting
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});

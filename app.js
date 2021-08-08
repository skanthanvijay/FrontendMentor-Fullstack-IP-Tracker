// Setup Code
const dotenv = require('dotenv').config({path: __dirname + '/.env'});
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const https = require('https');
const dns = require("dns");

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

const letters = ["g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGO_URL + "/ipDB", { useNewUrlParser: true });



// Default Page Loading
app.get("/", function(req, res) {
  let ipAddrs = req.headers['x-forwarded-for'];

  https.get("https://geo.ipify.org/api/v1?apiKey=" + process.env.IPLOC_KEY + "&ipAddress=" + ipAddrs, function(response) {

    response.on('data', function(data) {
      const newData = JSON.parse(data);

      const datum = new Datum ({
        ipAddress: ipAddrs,
        location: newData.location.city + ", " + newData.location.region,
        timezone: newData.location.timezone,
        isp: newData.isp,
        lat: newData.location.lat,
        lng: newData.location.lng
      });

      datum.save();
      console.log(datum);

      res.render("index", {
        ipadd: ipAddrs,
        locn: datum.location,
        tz: datum.timezone,
        intSP: datum.isp,
        latd: datum.lat,
        lngd: datum.lng,
      });
    });
  });
});



// IP Submission Page Loading
app.post("/", function(req, res) {

  var ipAddr = req.body.ipInput.toLowerCase();
  var isDomain = false;

  letters.forEach(function(letter) {
    if (ipAddr.includes(letter)) { isDomain = true; }
  });

  if (isDomain) {
    dns.lookup(ipAddr, {all: true}, function(err, newIp) {
      if (err) { console.log (err) }
      getPage(newIp[0].address);
    });
  }

  else { getPage(ipAddr); }


  // Function to get new page from input
  function getPage(ipIn) {

    https.get("https://geo.ipify.org/api/v1?apiKey=" + process.env.IPLOC_KEY + "&ipAddress=" + ipIn, function(response) {

      if (response.statusCode === 200) {

      response.on('data', function(data) {
        const newData = JSON.parse(data);

        const datum = new Datum ({
          ipAddress: newData.ip,
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
        });
      }); }

      else { res.redirect("/"); }

    });
  }

});



// Server Porting
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});

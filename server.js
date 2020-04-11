'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
// Application Setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());

app.get('/', (request, response) => {
  response.send('Home Page!');
});
//Route Definitions

app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailsHandler);

app.use(errorHandler);
let lat;
let lon;

//Route Handlers
function locationHandler(request, response) {
    const city = request.query.city;
    superagent(
        `https://eu1.locationiq.com/v1/search.php?key=${process.env.GEOCODE_API_KEY}&q=${city}&format=json`).then((res) => {
            const geoData = res.body;
            const locationData = new Location(city, geoData);
            lat=locationData.latitude;
            lon=locationData.longitude;
            response.status(200).json(locationData);
        })
        .catch((err) => errorHandler(err, request, response));

}


function weatherHandler(request, response) {
    superagent(`https://api.weatherbit.io/v2.0/forecast/daily?city=${request.query.search_query}&key=${process.env.WEATHER_API_KEY}`).then((weatherData) => {
        const weatherSummaries = weatherData.body.data.map((day) => {
        
            return new Weather(day);
        });
        // const weatherSummaries = weatherData.body.data.map((day) => {
        //     return new Weather(day);
        // });
        response.status(200).json(weatherSummaries);
    })
        .catch(err => errorHandler(err, request, response));

}

function trailsHandler(request, response) {
    const lat = request.query.latitude;
    const lon = request.query.longitude;
    getTrailData(lat, lon)
        .then((trailData) =>
         response.status(200).json(trailData));
}

function getTrailData(lat, lon) {
    const url = `https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=500&key=${process.env.TRAIL_API_KEY}`; 
    return superagent.get(url).then((trailData) => {
        let trailsSummaries = trailData.body.trails.map((val) => {
            return new Trail(val);
        }); return trailsSummaries;
    });
}

app.use('*', notFoundHandler);
//constructorfor yhe trail

///constructor function for Location
function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].latitude;
    this.longitude = geoData[0].longitude;
}

///constructor for the weather
function Weather(day) {
    this.forecast = day.weather.description;
    this.time = new Date(day.valid_date).toDateString();
}

//constructorfor yhe trail
function Trail(trailsCon) {
    this.name = trailsCon.name;
    this.location = trailsCon.location;
    this.length = trailsCon.length;
    this.stars = trailsCon.stars;
    this.star_votes = trailsCon.starVotes;
    this.summary = trailsCon.summary;
    this.trail_url = trailsCon.url;
    this.conditions = trailsCon.conditionDetails;
    this.condition_date = trailsCon.conditionDate.substring(0, 11);
    this.condition_time = trailsCon.conditionDate.substring(11);

}

// {
//   "name": "Rattlesnake Ledge",
//   "location": "Riverbend, Washington",
//   "length": "4.3",
//   "stars": "4.4",
//   "star_votes": "84",
//   "summary": "An extremely popular out-and-back hike to the viewpoint on Rattlesnake Ledge.",
//   "trail_url": "https://www.hikingproject.com/trail/7021679/rattlesnake-ledge",
//   "conditions": "Dry: The trail is clearly marked and well maintained.",
//   "condition_date": "2018-07-21",
//   "condition_time": "0:00:00 "
// }
// //that will handle any other request that doesn't match our route
function notFoundHandler(request, response) {
    response.status(404).send('Sorry, something went wrong');
}
function errorHandler(error, request, response) {
    response.status(500).send(error);
}
app.listen(PORT, () => console.log(`the server is up and running on ${PORT}`));


'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
//Application Setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());
app.get('/', (request, response) => {
    response.send('Home Page!');
});
//Route Definitions
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

//Route Handlers
function locationHandler(request, response) {
    const city = request.query.city;
    superagent(
        `https://eu1.locationiq.com/v1/search.php?key=${process.env.GEOCODE_API_KEY}&q=${city}&format=json`).then((res) => {
            const geoData = res.body;
            const locationData = new Location(city, geoData);
            response.status(200).json(locationData);
        })
        .catch((err) => errorHandler(err, request, response));

}


function weatherHandler(request, response) {
    superagent(`https://api.weatherbit.io/v2.0/forecast/daily?city=${request.query.search_query}&key=${process.env.WEATHER_API_KEY}`).then((weatherData) => {
        const weatherSummaries = weatherData.body.data.map((day) => {
            return new Weather(day);
        });
        response.status(200).json(weatherSummaries);
        })
        .catch(err => errorHandler(err,request,response));

}
    
function trailHandler(request, response) {
    superagent(`https://www.hikingproject.com/data/get-trails?lat=${request.query.latitude}&lon=${request.query.longitude}&maxDistance=10&key=${process.env.TRAIL_API_KEY}`).then (trailData =>{
        const trailSummaries = trailData.body.trails.map(trail =>{
            return new Trail(trail);
        });
        response.status(200).json(trailSummaries);
    })
        .catch(err => errorHandler(err,request,response));
    
}

///constructor function for Location
function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;
}


///constructor for the weather
function Weather(day) {
    this.forecast = day.weather.description;
    this.time = new Date(day.valid_date).toString().slice(0, 15);
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

//constructorfor yhe trail
function Trail(trailsCon){
    this.name = trailsCon.name;
    this.location = trailsCon.location;
    this.length = trailsCon.length; 
    this.stars = trailsCon.stars;
    this.star_votes = trailsCon.star_votes;
    this.summary = trailsCon.summary;
    this.trail_url = trailsCon.url;
    this.conditions = trailsCon.conditions;
    this.condition_date = trailsCon.conditionDate.toString().slice(0,10);
    this.condition_time = trailsCon.conditionTime.toString().slice(11,19);

}

//that will handle any other request that doesn't match our route
function notFoundHandler(request, response) {
    response.status(404).send('Sorry, something went wrong');
}
function errorHandler(error, request, response) {
    response.status(500).send("error");
}
app.listen(PORT, () => console.log(`the server is up and running on ${PORT}`));


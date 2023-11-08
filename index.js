const dotenv = require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const date = new Date();
const time = date.getHours() + " : " + date.getMinutes();
const TOKEN = process.env.TOKEN
const PORT = process.env.PORT || 3000;

const options = {
    key: fs.readFileSync('./certs/key.key'),
    cert: fs.readFileSync('./certs/cert.pem')
};

const app = express();
const server = https.createServer(options, app);


app.listen(
    PORT,
    () => console.log("API is Runnig")
)

app.get('/', (req, res) => {
    res.status(200).send({
        API: "working"
    })
})

app.get('/checkTime', (req, res) => {
    res.status(200).send({
        time: time
    })
})

app.get('/checkDeploy', (req, res) => {
    res.status(200).send({
        Deploy: "ok"
    })
})

app.get('/checkTeam', (req, res) => {
    res.status(200).send({
        team: "ok"
    })
})
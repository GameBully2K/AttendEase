const app = require('express')();
const https = require('https')();
const fs = require('fs')();
const date = new Date();
const time = date.getHours() + " : " + date.getMinutes();
const PORT = 443;

const options = {
    key: fs.readFileSync(''),
    cert: fs.readFileSync('')
}

const server = https.createServer(options, app);


app.listen(
    PORT,
    () => console.log("API is Runnig")
)

app.get('/checkTime', (req, res) => {
    res.status(200).send({
        time: time
    })
})
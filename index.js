const app = require('express')();
const https = require('https')();
const date = new Date();
const time = date.getHours() + " : " + date.getMinutes();



app.listen(
    80,
    () => console.log("API is Runnig")
)

app.get('/checkTime', (req, res) => {
    res.status(200).send({
        time: time
    })
})
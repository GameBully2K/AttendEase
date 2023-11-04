const app = require('express')();
const date = new Date();
const time = date.getHours() + " : " + date.getMinutes();

app.listen(
    443,
    () => console.log("API is Runnig")
)

app.get('/checkTime', (req, res) => {
    res.status(200).send({
        time: time
    })
})
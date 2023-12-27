const dotenv = require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const https = require('https');
const fs = require('fs');
const accessTokenPass = process.env.ACCESS_TOKEN_SECRET;
const refreshToken = process.env.REFRESH_TOKEN_SECRET;
const PORT = process.env.PORT || 3000;

//Get current time
function getDateTime() {
  let hour = new Date().getHours();
  let minutes = new Date().getMinutes();
  hour ++;
  hour = hour%24;
}


//----------------------------------------------
// Database connection
//----------------------------------------------
'use strict';
const mysql = require('mysql2');

const conn = mysql.createConnection({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  ssl: {
    key: fs.readFileSync(process.env.DB_SSL_KEY),
    cert: fs.readFileSync(process.env.DB_SSL_CERT),
    ca: fs.readFileSync(process.env.DB_SSL_CA)
  }
},
console.log("Connected to database"));

const options = {
    key: fs.readFileSync('./certs/key.key'),
    cert: fs.readFileSync('./certs/cert.pem')
};

const app = express();
app.use(express.json());

//const server = https.createServer(options, app);

app.listen(
    PORT,
    () => console.log("API is Runnig")
)

app.get('/', (req, res) => {
    res.status(200).send({
        API: "working",
        Connection: "Secured",
        Name: "Attendora",
        version: "0.1.1"
    })
})

app.post('/getstudent', async (req, res)  => {
  let firstname = "";
  let lastname = "";
  try {
    const result = await conn.promise().query('select Nom_etd, Prenom_etd from Etudiant where NumeroCarteRFID = "'+req.body.studentId+'"');
    firstname = result[0][0].Prenom_etd;
    lastname = result[0][0].Nom_etd;
  } catch (err) {
    console.log(err);
  };
  res.status(200).send({
      prenom: firstname,
      nom: lastname
  })
})

app.get('/checkTime', authenticateToken, (req, res) => {
    hour++;
    hour = hour%24;
    const time = hour + " : " + minutes;
    res.status(200).send({
        time: time
    })
})

app.post('/signup', async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      const user = { name: req.body.name, password: hashedPassword }
      users.push(user)
      res.status(201).send(
        {
            "status" : "ok"
        }
      )
    } catch (err) {
      res.status(500).send()
      console.log(err) 
    }
  })

  function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)
  
    jwt.verify(token, accessTokenPass, (err, user) => {
      console.log(err)
      if (err) return res.sendStatus(403)
      req.user = user
      next()
    })
  }
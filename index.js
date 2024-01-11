const dotenv = require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const https = require('https');
const fs = require('fs');
const accessTokenPass = process.env.ACCESS_TOKEN_SECRET;
const refreshToken = process.env.REFRESH_TOKEN_SECRET;
const PORT = process.env.PORT || 3000;


//GET TIME
function getHours() {
  const date = new Date();
  var hour = date.getHours();
  //hour++
  hour = hour%24;
  return hour;
}
function getMinutes() {
    const date = new Date();
    var minute = date.getMinutes();
    return minute.toString();
}
function getDay() {
  return ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][new Date().getDay()]
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
    key: fs.readFileSync('./certs/localhost.key'),
    cert: fs.readFileSync('./certs/localhost.crt')
};

const app = express();
app.use(express.json());

const server = https.createServer(options, app);


app.listen(
    PORT,
    () => console.log("API is Runnig")
);

app.get('/', (req, res) => {
    res.status(200).send({
        API: "working",
        Connection: "Secured",
        Name: "Attendora",
        version: "0.1.1"
    })
})

app.post('/getstudents', async (req, res)  => {
  let firstname = "";
  let lastname = "";
  try {
    const result = await conn.promise().query('select NumeroCarteRFID from Etudiant where filiere = "'+req.body.studentId+'"');
    firstname = result[0][0].Prenom_etd;
    lastname = result[0][0].Nom_etd;
    res.status(200).send({
      prenom: firstname,
      nom: lastname
    })
    console.log("GetStudent Called, status ok ✅");
  } catch (err) {
    console.log(err);
    
  };
})

app.get('/checkTime', /*authenticateToken,*/ (req, res) => {
    let time = getHours()+":"+getMinutes();
    res.status(200).send({
        time: time
    })
})

app.post('/createSession', async (req, res) => {
  let arduinoId = req.body.arduinoId;
  let teacherId = req.body.teacherId;
  arduinoId = await conn.promise().query('select salle from Arduino where Numero = '+arduinoId+' AND Active = 1');
  salle = arduinoId[0][0].salle;
  teacherId = await conn.promise().query('select * from Enseignants where NumRFID = "'+teacherId+'"');
  teacherName = teacherId[0][0].Nom_E;
  teacherId = teacherId[0][0].ID_ens;
  let emploiId = await determineEmploi(teacherId);
  emploiId++;
  let result = await conn.promise().query('INSERT INTO Seance (Type, Emploi, Enseignant, Salle) VALUES ("Normal", '+teacherId+', '+emploiId+', "'+salle+'")');
  let elementName = await conn.promise().query('Select * from Emploi where ID_emp = '+emploiId+'');
  let filiereName = elementName[0][0].filiere;
  elementName = await conn.promise().query('SELECT * from Element where ID_elm = '+elementName[0][0].Element+'');
  res.status(200).send({
    sessionId: result[0].insertId,
    Element: elementName[0][0].Abreviation,
    teacherName: teacherName,
    salle: salle,
    filiere : filiereName
  })
  console.log(elementName[0][0].Abreviation);
  
  console.log("createSession Called, status ok ✅");
})

app.post('/makeAbsent', async (req, res) => {
  let firstname = "";
  let lastname = "";
  try {
    const result = await conn.promise().query('select Nom_etd, Prenom_etd from Etudiant where NumeroCarteRFID = "'+req.body.studentRFID+'"');
    firstname = result[0][0].Prenom_etd;
    lastname = result[0][0].Nom_etd;
    let studentRFID = req.body.studentRFID;
    let studentId = await conn.promise().query('select IDetudiant from Etudiant where NumeroCarteRFID = "'+studentRFID+'"');
    studentId = studentId[0][0].IDetudiant;
    let sessionId = req.body.sessionId;
    let resulta = await conn.promise().query('INSERT INTO Absence (Etudiant, Seance) VALUES ("'+studentId+'", '+sessionId+')');
    res.status(200).send({
      status: "Marked",
      prenom: firstname,
      nom: lastname
    })
    console.log("makeAbsent Called, status ok ✅");
  } catch (err) {
    console.log(err);
  };

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

  async function determineEmploi(teacherId) {
    let weekday = getDay();
    let result = await conn.promise().query('Select * from Emploi where Enseignant = '+teacherId+' AND Jour = "Vendredi"');//"'+weekday+'"
    let res = result[0]
    hours = []
    for (let i = 0; i < res.length; i++) {
      res[i].HeureDebut = res[i].HeureDebut.split(":")
      hours.push(parseInt(res[i].HeureDebut[0]))
    }
    //time = parseFloat(getHours()+"."+getMinutes());
    //console.log(time)
    time = 7.8
    for (let i = 0; i < hours.length; i++) {
      hours[i] = Math.abs(hours[i] - time)
    }
    return hours.indexOf(Math.min(...hours))
  }


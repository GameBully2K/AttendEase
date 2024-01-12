'use strict';
require('dotenv').config();

const fs = require('fs');
const mysql = require('mysql2');
const { env } = require('process');
const bcrypt = require('bcrypt');

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

conn.query('show databases;', function(err, res) {
  console.log(res);
  //console.log(JSON.stringify(res));
  if (err) console.log(err);

});

async function insertArduino() {
const hashedPassword = await bcrypt.hash("AWALARDUINO", 10)
console.log(hashedPassword)
conn.query('INSERT INTO Arduino (Numero, Password, Salle, Active) VALUES (111, "'+hashedPassword+'", "2-2", 1);', function(err, res) {
  console.log(res);
  //console.log(JSON.stringify(res));
  if (err) console.log(err);

});
}

//insertArduino();

conn.query('Select * from Emploi where Jour = "Vendredi"', function(err, res) {
  let splitedTime =  res[0].HeureDebut.split(":")
  console.log(res)
  for (let i = 0; i < splitedTime.length; i++) {
    splitedTime[i] = parseInt(splitedTime[i])
  }
  console.log(splitedTime)
  //console.log(JSON.stringify(res));
  if (err) console.log(err);

});

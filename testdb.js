'use strict';
require('dotenv').config();

const fs = require('fs');
const mysql = require('mysql2');
const { env } = require('process');

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

/*conn.query('Insert into Etudiant values ("03", "aljirafe", "ibtissam","3333","MTI")', function(err, res) {
  console.log(res);
  //console.log(JSON.stringify(res));
  if (err) console.log(err);

});*/

conn.end();
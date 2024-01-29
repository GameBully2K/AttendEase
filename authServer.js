import dotenv from 'dotenv';
dotenv.config();
import crypto from 'crypto';

'use strict';
import mysql from 'mysql2';


import bcrypt from 'bcrypt';
import express from 'express';
const app = express();
import fs from 'fs';
import jwt from 'jsonwebtoken';

import { authenticateToken, generateAccessToken } from './src/methods/auth/token.js';
import { sendVerificationEmail } from './src/methods/email/emailing.js';

const accessTokenPass = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenPass = process.env.REFRESH_TOKEN_SECRET;
const PORT = process.env.AUTHPORT || 3001;

const conn = mysql.createPool({
  connectionLimit: 10, // Adjust as necessary
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    key: fs.readFileSync(process.env.DB_SSL_KEY),
    cert: fs.readFileSync(process.env.DB_SSL_CERT),
    ca: fs.readFileSync(process.env.DB_SSL_CA)
  }
},
console.log("Connected to database"));
let refreshTokens = [];
let emailVerificationCode = new Map(); 

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});
app.listen(
  PORT,
  () => console.log("AUTH is Runnig on port " + PORT + "")
);

app.get('/', (req, res) => {
  res.send({
    "message": "Auth server is running",
    "status": "ok"
  });
});
app.post('/expiry', authenticateToken, (req, res) => {
  res.sendStatus(200);
});

app.post('/token', (req, res) => {
  console.log("calling token...");
  const refreshToken = req.body.rftoken;
  if (refreshToken == null) return res.sendStatus(401);
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(404);
  jwt.verify(refreshToken, refreshTokenPass, (err, user) => {
    if (err) return res.status(403).send(err);
    delete user.iat;
    delete user.exp;
    const accessToken = generateAccessToken(user);
    res.status(200).send({
      "accessToken": accessToken
    });
    console.log("token called successfully ✅");
  });
});



app.post('/sendverifEmail', async (req, res) => {
  console.log("calling verifyEmail...");
  try {
    const code = crypto.randomUUID().substring(0, 6).toUpperCase();
    console.log(code);
    emailVerificationCode.set(req.body.teacherEmail, [code.toString(), Date.now()]);
    await sendVerificationEmail(req.body.teacherEmail, code);
    console.log(emailVerificationCode.get(req.body.teacherEmail));
    res.status(200).send(
      {
        "code": code
      }
    );
    console.log("verifyEmail called successfully ✅");
  } catch (err) {
    res.status(500).send();
    console.log(err);
  }
});

app.post('/signup', async (req, res) => {
  try {
    console.log("calling signup...");
    if (emailVerificationCode.get(req.body.teacherEmail) == null) {
      return res.status(404).send('no code found');
    }
    console.log(Date.now() - emailVerificationCode.get(req.body.teacherEmail)[1]);
    if (emailVerificationCode.get(req.body.teacherEmail)[0] != req.body.code || Date.now() - emailVerificationCode.get(req.body.teacherEmail)[1]> 600000 ){
      return res.status(401).send('wrong or expired code');
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const insert = await conn.promise().query('INSERT INTO Enseignants (Nom_E,Prenom_E,Email_E,Pass_E,NumRFID)VALUES ("'+ req.body.teacherLastName +'", "'+req.body.teacherName+'", "'+req.body.teacherEmail+'", "'+hashedPassword+'", "'+req.body.rfid+'")');
    if(insert[0].affectedRows == 0) {
      res.status(400).send('Cannot create user');
    }
    res.status(200).send(
      {
          "teacherId" : insert[0].insertId
      }
    );
    console.log("signup called successfully ✅");
  } catch (err) {
    res.status(500).send();
    console.log(err);
  }
});

app.post('/logout', authenticateToken, (req, res) => {
  console.log("calling logout...");
  if (refreshTokens.length == 0) return res.status(200).send("clean refresh tokens");
  if (req.body.rftoken == null) return res.status(404).send("no refresh token provided");
  refreshTokens = refreshTokens.filter(token => token !== req.body.rftoken);
  res.status(204).send();
  console.log(refreshTokens);
  console.log("logout called successfully ✅");
});

app.post('/login', async (req, res) => {
    console.log("calling login...");
    let user = await conn.promise().query('SELECT * FROM Enseignants WHERE 	ID_ens = "'+req.body.teacherId+'"');
    if(user[0].length == 0) {
      console.log("Cannot find user");
      return res.status(404).send('Cannot find user');
    }
    let password = user[0][0].Pass_E;
    user= {
      id:user[0][0].ID_ens,
      name:user[0][0].Nom_E,
      lastName:user[0][0].Prenom_E,
      email:user[0][0].Email_E,
      rfid:user[0][0].NumRFID
    };
    if (user == null) {
      return res.status(400).send('Cannot find user');
    }
    try {
      if(await bcrypt.compare(req.body.password,password  )) {
        const accessToken = generateAccessToken(user);
        const refreshToken = jwt.sign(user, refreshTokenPass);
        refreshTokens.push(refreshToken);
        console.log(refreshTokens);
        res.status(200).send(
          {
            "accessToken": accessToken,
            "refreshToken": refreshToken
          }
        );
      } else {
        res.status(401).send('wrong credentials');
      }
      console.log("login called successfully ✅");
    } catch (err) {
      res.status(500).send();
      console.log("Calle Errored with", err);
    }
  
  });

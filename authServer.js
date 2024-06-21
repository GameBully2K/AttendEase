import dotenv from 'dotenv';
dotenv.config();
import crypto from 'crypto';

'use strict';
import mysql from 'mysql2';
import { redisClient } from './src/methods/storage/redis.js';

import bcrypt from 'bcrypt';
import express from 'express';
const app = express();
import fs from 'fs';
import jwt from 'jsonwebtoken';

import { authenticateToken, generateAccessToken } from './src/methods/auth/token.js';
import { sendVerificationEmail } from './src/methods/email/emailing.js';
import e from 'express';

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
},
console.log("Connected to database"));


// let refreshTokens = [];
// let emailVerificationCode = new Map();

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
    "status": "OK 200"
  });
});
app.post('/expiry', authenticateToken, (req, res) => {
  res.sendStatus(200);
  console.log("expiry called successfully ✅");
});

app.post('/token', async (req, res)  => {
  console.log("calling token...");
  if (req.body.rftoken == null) return res.sendStatus(401);
  const refreshToken = req.body.rftoken;
  // if (!refreshTokens.includes(refreshToken)) return res.sendStatus(404);
  // const token = await redisClient.get(req.body.user.id);
  // if (token) return res.sendStatus(404);
  if (!await redisClient.exists(req.body.teacherId)) return res.sendStatus(404);
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
    let rfid = await conn.promise().query('SELECT NumRFID FROM Enseignants ORDER BY ID_ens DESC LIMIT 1');
    const code = crypto.randomUUID().substring(0, 6).toUpperCase();
    await redisClient.set(req.body.teacherEmail.toString(), code.toString());
    await redisClient.expire(req.body.teacherEmail.toString(),  10*60); // 10 minutes in seconds
    await sendVerificationEmail(req.body.teacherEmail, code);
    rfid = parseInt(rfid[0][0].NumRFID)+1
    rfid = rfid.toString()
    let negativeLengt = 4-rfid.length
    for (let i = 0; i < negativeLengt; i++) {
      rfid = "0" + rfid
    }
    res.send({
      "nextRFID":rfid
    }).status(200)
    console.log("verifyEmail called successfully ✅");
  } catch (err) {
    res.status(500).send();
    console.log(err);
  }
});

app.post('/signup', async (req, res) => {
  try {
    console.log("calling signup...");
    if (req.body.code == null) return res.status(403).send("no code provided");
    if (!await redisClient.exists(req.body.teacherEmail)){
      return res.status(404).send('wrong or expired code');
    }
    if (req.body.code != await redisClient.get(req.body.teacherEmail)){
      return res.status(404).send('wrong code');
    }
    await redisClient.del(req.body.teacherEmail);
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

app.post('/logout', authenticateToken, async (req, res) => {
  console.log("calling logout...");
  if (req.body.rftoken == null) return res.status(404).send("no refresh token provided");
  // refreshTokens = refreshTokens.filter(token => token !== req.body.rftoken);
  await redisClient.del(req.user.id.toString());
  res.status(204).send();
  // console.log(refreshTokens);
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
        //refreshTokens.push(refreshToken);
        await redisClient.set(user.id.toString(), refreshToken.toString()); // 30 days in seconds
        await redisClient.expire(user.id.toString(),  24*60*60); // 1 day in seconds
        // console.log(refreshTokens);
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

app.post('/resetPasswordEmail', async (req, res) => {
  console.log("calling forgotPassword...");
  try {
    const code = crypto.randomUUID().substring(0, 6).toUpperCase();
    let result = await conn.promise().query('SELECT * FROM Enseignants WHERE Email_E = "'+req.body.teacherEmail+'"');
    if(result[0].length == 0) {
      return res.status(401).send('not registered');
    }
    await redisClient.set(req.body.teacherEmail.toString(), code.toString());
    await redisClient.expire(req.body.teacherEmail.toString(),  10*60); // 10 minutes in seconds
    await sendVerificationEmail(req.body.teacherEmail, code);
    res.sendStatus(200);
    // res.status(200).send({
    //   "code": code
    // })
    console.log("forgotPassword called successfully ✅");
  } catch (err) {
    res.status(503).send();
    console.log(err);
  }
});

app.post('/resetPassword', async (req, res) => {
  console.log("calling forgotPassword...");
  try {
    if (req.body.code == null) return res.status(403).send("no code provided");
    if (!await redisClient.exists(req.body.teacherEmail)){
      return res.status(404).send('expired code');
    }
    if (req.body.code != await redisClient.get(req.body.teacherEmail)){
      return res.status(405).send('wrong code');
    }
    await redisClient.del(req.body.teacherEmail);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const update = await conn.promise().query('UPDATE Enseignants SET Pass_E = "'+hashedPassword+'" WHERE Email_E = "'+req.body.teacherEmail+'"');
    if(update[0].affectedRows == 0) {
      return res.status(406).send('Cannot update password');
    }
    res.status(200).send();
    console.log("forgotPassword called successfully ✅");
  } catch (err) {
    res.status(500).send();
    console.log(err);
  }
});

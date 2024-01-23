require('dotenv').config()

'use strict';
const mysql = require('mysql2');

const bcrypt = require('bcrypt')
const express = require('express')
const { access } = require('fs')
const app = express()
const jwt = require('jsonwebtoken')
const PORT = process.env.AUTHPORT || 4000

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

app.use(express.json())
app.listen(
  PORT,
  () => console.log("AUTH is Runnig on port " + PORT + "")
);

app.get('/', (req, res) => {
  res.send(<h1>Auth Server working</h1>)
})


let refreshTokens = []

app.post('/token', (req, res) => {
  const refreshToken = req.body.token
  if (refreshToken == null) return res.sendStatus(401)
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403)
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    const accessToken = generateAccessToken({ name: user.name })
    res.json({ accessToken: accessToken })
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

app.delete('/logout', (req, res) => {
  refreshTokens = refreshTokens.filter(token => token !== req.body.token)
  res.sendStatus(204)
})

app.post('/login', async (req, res) => {
    const user = users.find(user => user.name === req.body.name)
    if (user == null) {
      return res.status(400).send('Cannot find user')
    }
    try {
      if(await bcrypt.compare(req.body.password, user.password)) {
        const accessToken = generateAccessToken({ name : user.name})
        const refreshToken = jwt.sign({ name : user.name}, process.env.REFRESH_TOKEN_SECRET)
        refreshTokens.push(refreshToken) 
        res.json(
          {
            accessToken: accessToken,
            refreshToken: refreshToken
          }
        )
      } else {
        res.send('Not signed')
      }
    } catch {
      res.status(500).send()
    }
  })

app.post('/users', authenticateToken, (req, res) => {
    res.json(
        users
        )
    })

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '3600s' })
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      console.log(err)
      if (err) return res.sendStatus(403)
      req.user = user
      next()
    })
  }

app.listen(
    4000,
    console.log('Api working!')
    )
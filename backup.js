const dotenv = require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const https = require('https');
const fs = require('fs');

'use strict';
const mysql = require('mysql2');

const accessTokenPass = process.env.ACCESS_TOKEN_SECRET;
const PORT = process.env.APIPORT || 3000;


//GET TIME
function getHours() {
  const date = new Date();
  var hour = date.getHours();
  hour++
  return hour%24;
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

const options = {
    key: fs.readFileSync('./certs/localhost.key'),
    cert: fs.readFileSync('./certs/localhost.pem')
};

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});


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
  try {
    console.log("calling getstudents...");
    const result = await conn.promise().query('select NumeroCarteRFID from Etudiant where filiere = "'+req.body.filiere+'"');
    console.log(result[0]);
    let list = {
      count:result[0].length
    };
    for (let i = 0; i < result[0].length; i++) {
      list = {...list, [result[0][i].NumeroCarteRFID]: 0}
    } 
    res.status(200).send(list)
    console.log("GetStudent Called, status ok ✅");
  } catch (err) {
    console.log(err);
    
  };
})

app.get('/checkTime', (req, res) => {
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
  
  console.log("createSession Called: status ok ✅");
})

app.post('/markAbsent', async (req, res) => {
  try {
    console.log("calling makeAbsent...");
    const absentRFIDs = Object.keys(req.body).filter(key => req.body[key] === 0);

    // for (let i = 0; i < absentRFIDs.length; i++) {
    //   const studentRFID = absentRFIDs[i];
    //   const studentId = await conn.promise().query('SELECT IDetudiant FROM Etudiant WHERE NumeroCarteRFID = "' + studentRFID + '"');
    //   const sessionId = req.body.sessionId;
    //   await conn.promise().query('INSERT INTO Absence (Etudiant, Seance) VALUES ("' + studentId[0][0].IDetudiant + '", ' + sessionId + ')');
    // }
    const sessionId = parseInt(req.body.sessionId);
    const insertQuery = `INSERT INTO Absence (Etudiant, Seance)
      SELECT IDetudiant, ? AS Seance FROM Etudiant
      WHERE NumeroCarteRFID IN (?)`;


    if (absentRFIDs.length === 0) {
      res.status(200).send({
        status: "2"
      })
      console.log("makeAbsent Called: status ok ✅");
      return;
    } else {
          await conn.promise().query(insertQuery, [sessionId, absentRFIDs]);
        
        res.status(200).send({
          status: "1"
        })
        console.log("makeAbsent Called: status ok ✅");
    }
  } catch (err) {
    console.log(err);
  };

})

app.post('/teachersSession', async (req, res) => {
  try {
    console.log("calling teachersSession...");
    const teacherId = parseInt(req.body.teacherId);
    const result = await conn.promise().query('SELECT * FROM Seance WHERE Enseignant = ' + teacherId);
    res.status(200).send(result[0]);
    console.log("teachersSession Called: status ok ✅");
  } catch (err) {
    console.log(err);
  };
})

app.post('/teachersSessionCount', authenticateToken, async (req, res) => {
  try {
    console.log("calling teachersSessionCount...");
    const teacherId = req.body.teacherId;
    const result = await conn.promise().query('SELECT COUNT(*) AS count FROM Seance WHERE Enseignant = ' + teacherId + ' AND Type = "Normal"');
    res.status(200).send(result[0][0]);
    console.log("teachersSessionCount Called: status ok ✅");
  } catch (err) {
    console.log(err);
  };
})

app.post('/teachername', authenticateToken, async (req, res) => {
  try {
    console.log("calling teachername...");
    const teacherId = req.body.teacherId;
    const result = await conn.promise().query('SELECT * FROM Enseignants WHERE ID_ens = ' + teacherId);
    res.status(200).send(result[0][0]);
    console.log("teachername Called: status ok ✅");
  } catch (err) {
    console.log(err);
  };
})

app.post('/filierecount', authenticateToken, async (req, res) => {
  try {
    console.log("calling filierecount...");
    const teacherId = req.body.teacherId;
    const result = await conn.promise().query('SELECT DISTINCT COUNT(filiere) AS count FROM Emploi WHERE Enseignant = "' + teacherId + '"');
    res.status(200).send(
      {count: result[0][0].count}
    );
    console.log("filierecount Called: status ok ✅");
  } catch (err) {
    console.log(err);
  };
})
app.post('/studentcount', authenticateToken, async (req, res) => {
  try {
    console.log("calling studentcount...");
    const teacherId = req.body.teacherId;
    const result = await conn.promise().query('SELECT DISTINCT filiere FROM Emploi WHERE Enseignant = "' + teacherId + '"');
    if (result[0].length === 0) {
      res.status(200).send(
        {count: 0}
      );
      console.log("studentcount Called: status ok ✅");
      return;
    }
    let filarray="(";
    for (let i = 0; i < result[0].length; i++) {
      filarray = filarray + "\"" +result[0][i].filiere+ "\"" + ",";
    }
    filarray = filarray.slice(0, -1);
    filarray += ")";
    const studentCount = await conn.promise().query('SELECT COUNT(*) AS count FROM Etudiant WHERE filiere in ' + filarray + '');
    res.status(200).send(
      {count: studentCount[0][0].count}
    );
    console.log("studentcount Called: status ok ✅");
  } catch (err) {
    console.log(err);
  };
})

  function authenticateToken(req, res, next) {
    // const authHeader = req.headers['authorization']
    // const token = authHeader && authHeader.split(' ')[1]
    const token = req.body.token

    jwt.verify(token, accessTokenPass, (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).send('Token expired')
        }
        return res.sendStatus(403)
      }
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















  ///////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////
        require('dotenv').config()

        'use strict';
        const mysql = require('mysql2');
        
        //email API
        // const SibApiV3Sdk = require('sib-api-v3-sdk');
        // const defaultClient = SibApiV3Sdk.ApiClient.instance;
        // const apiKey = defaultClient.authentications['api-key'];
        // apiKey.apiKey = process.env.EMAIL_API_KEY;
        // const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        
        
        const bcrypt = require('bcrypt')
        const express = require('express')
        const { access } = require('fs')
        const app = express()
        const fs = require('fs');
        const jwt = require('jsonwebtoken')
        
        import {authenticateToken, generateAccessToken } from ( './src/methods/auth/token.js')
        
        const accessTokenPass = process.env.ACCESS_TOKEN_SECRET;
        const refreshTokenPass = process.env.REFRESH_TOKEN_SECRET;
        const PORT = process.env.AUTHPORT || 3001
        
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
        
        app.use(express.json())
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
          })
        })
        
        app.post('/token', (req, res) => {
          const refreshToken = req.body.rftoken
          if (refreshToken == null) return res.sendStatus(401)
          if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403)
          jwt.verify(refreshToken, refreshTokenPass, (err, user) => {
            if (err) return res.sendStatus(403)
            const accessToken = generateAccessToken({ name: user.name })
            res.json({ accessToken: accessToken })
          })
        })
        
        app.post('/signup', async (req, res) => {
          try {
            console.log("calling signup...")
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            const insert = await conn.promise().query('INSERT INTO Enseignants (Nom_E,Prenom_E,Email_E,Pass_E,NumRFID)VALUES ("'+ req.body.teacherLastName +'", "'+req.body.teacherName+'", "'+req.body.teacherEmail+'", "'+hashedPassword+'", "'+req.body.rfid+'")');
            if(insert[0].affectedRows == 0) {
              res.status(400).send('Cannot create user')
            }
            res.status(200).send(
              {
                  "teacherId" : insert[0].insertId
              }
            )
            console.log("signup called successfully ✅")
          } catch (err) {
            res.status(500).send()
            console.log(err) 
          }
        })
        
        app.post  ('/logout', authenticateToken, (req, res) => {
          console.log("calling logout...")
          if (refreshTokens.length == 0) return res.status(200).send("clean refresh tokens")
          if (req.body.rftoken == null) return res.status(404).send("no refresh token provided")
          refreshTokens = refreshTokens.filter(token => token !== req.body.rftoken)
          res.status(204).send()
          console.log(refreshTokens)
          console.log("logout called successfully ✅")
        })
        
        app.post('/login', async (req, res) => {
            console.log("calling login...")
            let user = await conn.promise().query('SELECT * FROM Enseignants WHERE 	ID_ens = "'+req.body.teacherId+'"');
            if(user[0].length == 0) {
              console.log("Cannot find user")
              return res.status(404).send('Cannot find user')
            }
            let password = user[0][0].Pass_E
            user= {
              id:user[0][0].ID_ens,
              name:user[0][0].Nom_E,
              lastName:user[0][0].Prenom_E,
              email:user[0][0].Email_E,
              rfid:user[0][0].NumRFID
            }
            if (user == null) {
              return res.status(400).send('Cannot find user')
            }
            try {
              if(await bcrypt.compare(req.body.password,password  )) {
                const accessToken = generateAccessToken(user)
                const refreshToken = jwt.sign(user, refreshTokenPass)
                refreshTokens.push(refreshToken)
                console.log(refreshTokens)
                res.status(200).send(
                  {
                    "accessToken": accessToken,
                    "refreshToken": refreshToken
                  }
                )
              } else {
                res.status(401).send('wrong credentials')
              }
              console.log("login called successfully ✅")
            } catch (err) {
              res.status(500).send()
              console.log("Calle Errored with", err) 
            }
          
          })
        
        
        
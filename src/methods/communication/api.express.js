import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import fs from 'fs';
//import dashboard from '../../routes/dashboard/dashboard.js';


dotenv.config();

const PORT = process.env.APIPORT || 3000;
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

//define Routes


const sslOptions = {
  key: fs.readFileSync('./certs/localhost.key'),
  cert: fs.readFileSync('./certs/localhost.pem'),
};

const server = http.createServer(sslOptions, app);


app.listen(PORT, () => console.log("API is Runnig"));
//app.use('/dashboard', dashboard);
export {app, server};



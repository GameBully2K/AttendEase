import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { redisClient } from '../storage/redis.js'
dotenv.config()
const accessTokenPass = process.env.ACCESS_TOKEN_SECRET


export async function authenticateToken(req, res, next) {
  // const authHeader = req.headers['authorization']
  // const token = authHeader && authHeader.split(' ')[1]
  const token = req.body.token;
  if (token == null) return res.sendStatus(404)
  

  jwt.verify(token, accessTokenPass, async (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).send('Token expired');
      }
      return res.sendStatus(403);
    }
    req.user = user;
    if (!await redisClient.exists(user.id.toString())) return res.sendStatus(401);
    next();
  });
}

export function generateAccessToken(user) {
    return jwt.sign(user, accessTokenPass, { expiresIn: '15m' })
}
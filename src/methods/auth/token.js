import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()
const accessTokenPass = process.env.ACCESS_TOKEN_SECRET


export function authenticateToken(req, res, next) {
  // const authHeader = req.headers['authorization']
  // const token = authHeader && authHeader.split(' ')[1]
  const token = req.body.token;

  jwt.verify(token, accessTokenPass, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).send('Token expired');
      }
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

export function generateAccessToken(user) {
    return jwt.sign(user, accessTokenPass, { expiresIn: '10s' })
}
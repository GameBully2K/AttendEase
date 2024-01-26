import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()
const accessTokenPass = process.env.ACCESS_TOKEN_SECRET


export function authenticateToken(req, res, next) {
    const authHeader = req.body.token
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)
  
    jwt.verify(token, accessTokenPass, (err, user) => {
      console.log(err)
      if (err) return res.sendStatus(403)
      req.user = user
      next()
    })
  }

export function generateAccessToken(user) {
    return jwt.sign(user, accessTokenPass, { expiresIn: '15m' })
}
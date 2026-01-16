const jwt = require('jsonwebtoken');
const {jwtSecret} = require('../config/auth');

//Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader  = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({error: 'Access token required'});
    }

    // verify token
    jwt.verify(token, jwtSecret, (err, user) => {
        if(err){
            return res.status(403).json({error: 'Invalid or expired token'});
        }

        // add user info to request
        req.user = user;
        next();
    });
};

//Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if(req.user.role !== 'admin'){
        return res.status(403).json({error: 'Admin access required'});
    }
    next();
};

module.exports = {authenticateToken, isAdmin};
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const {jwtSecret, jwtExpiration, saltRounds} = require('../config/auth');

//POST register new user
router.post('/register', async (req, res) => {
    const {email, password, first_name, last_name, phone, address} = req.body;

    //Validation
    if(!email || !password){
        return res.status(400).json({error: 'Email and password are required'});
    }

    if(password.length < 6){
        return res.status(400).json({error: 'Password must be at least 6 characters'});
    }

    //Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.text(email)){
        return res.status(400).json({error: 'Invalid email format'});
    }

    try{
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = `INSERT INTO users (email, password, first_name, last_name, phone, address)
                     VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.run(sql, [email, hashedPassword, first_name, last_name, phone, address], function(err){
            if(err){
                if(err.message.includes('UNIQUE')){
                    return res.status(409).json({error: 'Email already registered'});
                }
                return res.status(500).json({error: err.message});
            }

            res.status(201).json({
                message: 'User registered successfully',
                data: {
                    id: this.lastID,
                    email
                }
            });
        });
    }catch(err){
        res.status(500).json({error: 'Error hashing password'});
    }
});

//POST login
router.post('/login', (req, res) => {
    const {email, password} = req.body;

    if(!email || !password){
        return res.status(400).json({error: 'Email and password are required'});
    }

    db.get('SELECT * FROM users WHERE email = ?', [emaili], async (err, user) => {
        if(err){
            return res.status(500).json({error: err.message});
        }

        if(!user){
            return res.status(401).json({error: 'Invalid email or password'});
        }
        
        try{
            const validPassword = await bcrypt.compare(password, user.password);

            if(!validPassword){
                return res.status(401).json({error: 'Invalid email or password'});
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                jwtSecret,
                {expiresIn: jwtExpiration}
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role
                }
            });
        }catch(err){
            res.status(500).json({error: 'Error verifying password'});
        }
    });
});

module.exports = router;
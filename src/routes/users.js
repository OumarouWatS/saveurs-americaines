const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');
const {authenticateToken} = require('../middleware/auth');
const {saltRounds} = require('../config/auth');

// All routes in this file require authentication
router.use(authenticateToken);

// GET user profile
router.get('/profile', (req, res) => {
    const userId = req.user.id;

    db.get(
        'SELECT id, email, first_name, last_name, phone, address, role, created_at FROM users WHERE id = ?',
        [userId],
        (err, user) => {
            if(err){
                return res.status(500).json({error: err.message});
            }

            if(!user){
                return res.status(404).json({error: 'User not found'});
            }

            res.json({data: user});
        }
    );
});

// PUT update user profile
router.put('/profile', (req, res) => {
    const userId = req.user.id;
    const {first_name, last_name, phone, address} = req.body;

    const sql = `UPDATE users
                 SET first_name = ?, last_name = ?, phone = ?, address = ?
                 WHERE id = ?`;

    db.run(sql, [first_name, last_name, phone, address, userId], function(err){
        if(err){
            return res.status(500).json({error: err.message});
        }

        if(this.changes === 0){
            return res.status(404).json({error: 'User not found'});
        }

        res.json({message: 'Profile updated successfully'});
    });
});

// PUT change password
router.put('/password', async (req, res) => {
    const userId = req.user.id;
    const {current_password, new_password} = req.body;

    if(!current_password || !new_password){
        return res.status(400).json({error: 'Current password and new passoword are required '});
    }

    if(new_password.length < 6){
        return res.status(400).json({error: 'New password must be at least 6 characters'});
    }

    // Get current user
    db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
        if(err){
            return res.status(500).json({error: err.message});
        }

        if(!user){
            return res.status(404).json({error: 'User not found'});
        }

        try{
            const validPassword = await bcrypt.compare(current_password, user.password);

            if(!validPassword){
                return res.status(401).json({error: 'Current password is incorrect'});
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(new_password, saltRounds);

            // Update password
            db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], function(err){
                if(err){
                    return res.status(500).json({error: err.message});
                }

                res.json({message: 'Password changed successfully'});
            });
        }catch(err){
            res.status(500).json({error: 'Error processing password'});
        }
    });
});

module.exports = router;
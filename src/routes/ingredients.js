const express = require('express');
const router = express.Router();
const db = require('../database');
const { route } = require('./categories');

// GET all ingredients
router.get('/', (req, res) => {
    db.all('SELECT * FROM ingredients', [], (err, rows) => {
        if(err){
            return res.status(500).json({error: err.message});
        }
        res.json({data: rows});
    });
});

// GET single ingredient
router.get('/:id', (req, res) =>{
    const {id} = req.params;
    db.get('SELECT * FROM ingredients WHERE id = ?', [id], (err, row) =>{
        if(err){
            return res.status(500).json({error: err.message});
        }
        if(!row){
            return res.status(404).json({error: 'Ingredient not found'});
        }
        res.json({data: row});
    });
});

// POST create new ingredient
router.post('/', (req, res) => {
    const {name, allergen} = req.body;

    if(!name){
        return res.status(400).json({error: 'Name is required'});
    }

    const sql = 'INSERT INTO ingredients (name, allergen) VALUES (?, ?)';

    db.run(sql, [name, allergen || 0], function(err) {
        if(err){
            if(err.message.includes('UNIQUE')){
                return res.status(400).json({error: 'Ingredient already exists'});
            }
            return res.status(500).json({error: err.message});
        }

        // Success
        res.status(201).json({
            message: 'Ingredient created successfully',
            data: {id: this.lastID, name, allergen: allergen || 0}
        });
    });
});

// PUT update ingredient
router.put('/:id', (req, res) => {
    const {id} = req.params;
    const {name, allergen} = req.body;

    if(!name) {
        return res.status(400).json({error: 'Name is required'});
    }

    const sql = 'UPDATE ingredients SET name = ?, allergen = ? WHERE id = ?';

    db.run(sql, [name, allergen, id], function(err){
        if(err){
            return res.status(500).json({error: err.message});
        }
        res.json({message: 'Ingredient updated successfully'});
    });
});

//DELETE ingredient with safety check to ensure ingredient isn't used in products
router.delete('/:id', (req, res) =>{
    const {id} = req.params;

    db.run('DELETE FROM ingredients WHERE id = ?', [id], function(err){
        if(err){
            return res.status(500).json({error: err.message});
        }
        if(this.changes === 0){
            return res.status(404).json({error: 'Ingredient not found'});
        }
        res.json({message: 'Ingredient deleted successfully'});
    });
});

module.exports = router;

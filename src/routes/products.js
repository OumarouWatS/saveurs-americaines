const express  = require('express');
const router = express.Router();
const db = require('../database');

// GET all products
router.get('/', (req, res) =>{
    db.all('SELECT * FROM products', [], (err, rows) =>{
        if(err){
            return res.status(500).json({error: err.message});
        }
        res.json({data: rows});
    });
});

// GET single product
router.get('/:id', (req, res) => {
    const{ id } = req.params;
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if(err){
            return res.status(500).json({error: err.message});
        }
        if(!row){
            return res.status(404).json({ error: 'Product not found' });
        }
    res.json({data: row});
    });
});

// POST create new product
router.post('/', (req, res) => {
    const {name, description, price, category, image_url, available } = req.body;

    if(!name || !price){
        return res.status(400).json({ error: 'Name and price are required'});
    }

    const sql = `INSERT INTO products (name, description, price, category, image_url, available)
                VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [name, description, price, category, image_url, available ?? 1], function(err) {
        if(err){
            return res.status(500).json({ errror: err.message });
        }
        res.status(201).json({
            message: 'Product created successfully',
            data: { id: this.lastID }
        });
    });
});

// PUT update product
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, price, category, image_url, available } = req.body;

    const sql = `UPDATE products
                 SET name = ?, description = ?, price = ?, category = ?, image_url = ?, available = ?
                 WHERE id = ?`;

    db.run(sql, [name, description, price, category, image_url, available, id], function(err) {
        if(err){
            return res.status(500).json({ error: err.message });
        }
        if(this.changes === 0){
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product updated succeessfully'});
    });
});

// DELETE product 
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
        if(err){
            return res.status(500).json({ error: err.message });
        }
        if(this.changes === 0){
            return res.status(404).json({ error: 'Product not found'});
        }
        res.json({ message: 'Product deleted successfully'});
    });
});

module.exports = router
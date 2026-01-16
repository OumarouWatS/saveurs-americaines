const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all categories
router.get('/', (req, res) => {
    db.all('SELECT * FROM categories', [], (err, rows) =>{
        if(err){
            return res.status(500).json({error: err.message});
        }
        res.json({data: rows});
    });
});

// GET single category
router.get('/:id', (req, res) =>{
    const {id} = req.params;
    db.get('SELECT * FROM categories WHERE id = ?', [id], (err, row) =>{
        if(err){
            return res.status(500).json({error: err.message});
        }
        if(!row){
            return res.status(404).json({error: 'Category not found'});
        }
        res.json({data: row});
    });
});

// GET all products in a category (nested route)
router.get('/:id/products', (req, res) => {
    const {id} = req.params;

    // FIRST check if category exists
    db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) =>{
        if(err){
            return res.status(500).json({error: err.message});
        }
        if(!category){
            return res.status(404).json({error: 'Category not found'});
        }

        //nesting here
        // Get all products in this category
        db.all('SELECT * FROM products WHERE category_id = ?', [id], (err, rows) =>{
            if(err){
                return res.status(500).json({error: err.message});
            }
            res.json({
                category: category.name,
                data: rows
            });
        });
    });
});

// POST create new category
router.post('/', (req, res) => {
    const {name, description} = req.body;

    if(!name){
        return res.status(400).json({ error: 'Name is required'});
    }

    const sql = 'INSERT INTO categories (name, description) VALUES (?, ?)';
    
    db.run(sql, [name, description], function(err){
        if(err){
            if(err.message.includes('UNIQUE')){
                return res.status(409).json({error: 'Category already exists'});
            }
            return res.status(500).json({ error: err.message});
        }
        res.status(201).json({
            message: 'Category created successfully',
            data: {id: this.lastID, name, description}
        });
    });
});

// PUT update category
router.put('/:id', (req, res) =>{
    const {id} = req.params;
    const {name, description} = req.body;

    if(!name){
        return res.status(400).json({error: 'Name is required'});
    }

    const sql = 'UPDATE categories SET name = ?, description = ? WHERE id = ?';

    db.run(sql, [name, description, id], function(err){
        if(err){
            if(err.message.includes('UNIQUE')){
                return res.status(409).json({error: 'Category name already exists'});
            }
            return res.status(500).json({error: err.message});
        }
        if(this.changes === 0){
            return res.status(404).json({error: 'Category not found'});
        }
        res.json({message: 'Category updated successfully'});
    });
});

// DELETE category with check for exisiting products
router.delete('/:id', (req, res) =>{
    const {id} = req.params;

    db.get('SELECT COUNT(*) AS count FROM products WHERE category_id = ?', [id], (err, row) =>{
        if(err){
            return res.status(500).json({error: err.message});
        }

        if(row.count > 0){
            //prevent deletion if count>0
            return res.status(400).json({error: 'Category has products and cannot be deleted:('});
        }

        // else safe to delete
        db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
            if(err){
                return res.status(500).json({error: err.message});
            }
            if(this.changes === 0){
                return res.status(404).json({error: 'Category not found'});
            }
            res.json({message: 'Category deleted successfully'});
        });
    });
});


module.exports = router;
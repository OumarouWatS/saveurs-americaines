const express  = require('express');
const router = express.Router();
const db = require('../database');

// GET all products
router.get('/', (req, res) =>{
    const { category } = req.query;

    let sql = `
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
    `;

    let params = [];

    // Filter by category if provided
    if(category){
        sql += 'WHERE c.name = ?';
        params.push(category);
    }

    db.all(sql, params, (err, rows) =>{
        if(err){
            return res.status(500).json({error: err.message});
        }
        res.json({data: rows});
    });
});

// GET single productc
router.get('/:id', (req, res) => {
    const{ id } = req.params;
    const sql = `
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
    `;

    db.get(sql, [id], (err, row) => {
        if(err){
            return res.status(500).json({error: err.message});
        }
        if(!row){
            return res.status(404).json({ error: 'Product not found' });
        }
    res.json({data: row});
    });
});

// GET ingredients for a product
router.get('/:id/ingredients', (req, res) => {
    const {id} = req.params;

    //First check if product exists
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) =>{
        if(err){
            return res.status(500).json({error: err.message});
        }
        if(!product){
            return res.status(404).json({error: 'Product not found'});
        }

        // GET ingredients for this product
        const sql = `
            SELECT i.*, pi.quantity
            FROM ingredients i
            JOIN product_ingredients pi ON i.id = pi.ingredient_id
            WHERE pi.product_id = ?
        `;
        db.all(sql, [id], (err, rows) => {
            if(err){
                return res.status(500).json({error: err.message});
            }
            res.json({
                product: product.name,
                data:rows
            });
        });
    });
});

// POST add ingredient to product
router.post('/:id/ingredients', (req, res) => {
    const {id} = req.params;
    const {ingredient_id, quantity} = req.body;

    if(!ingredient_id){
        return res.status(400).json({error: 'ingredient_id is required'});
    }

    const sql = 'INSERT INTO product_ingredients (product_id, ingredient_id, quantity) VALUES (?, ?, ?)';

    db.run(sql, [id, ingredient_id, quantity], function(err){
        if(err){
            if(err.message.includes('FOREIGN KEY')){
                return res.status(404).json({error: 'Product or ingredient not found'});
            }
            if(err.message.includes('UNIQUE') || err.message.includes('PRIMARY KEY')){
                return res.status(409).json({error: 'Ingredient already added to this product'});
            }
            return res.status(500).json({error: err.message});
        }
        res.status(201).json({message: 'Ingredient added to product successfully'});
    });
});

// DELETE remove ingredient from product
router.delete('/:id/ingredients/:ingredient_id', (req, res) => {
    const sql = 'DELETE FROM product_ingredients WHERE product_id = ? AND ingredient_id = ?';

    db.run(sql, [id, ingredient_id], function(err){
        if(err){
            return res.status(500).json({error: err.message});
        }
        if(this.changes === 0){
            return res.status(404).json({error: 'Product-ingredient relationship not found'});
        }
        res.json({message: 'Ingredient removed from product successfully'});
    });
});

// POST create new product
router.post('/', (req, res) => {
    const { name, description, price, category, image_url, available } = req.body;

    // Basic validation
    if (!name || !price || !category) {
        return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    // Step 1: Look up category ID by name
    db.get('SELECT id FROM categories WHERE name = ?', [category], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Category not found' });

        const category_id = row.id; // This is the ID that the DB needs

        // Step 2: Insert the product using category_id
        const sql = `
            INSERT INTO products (name, description, price, category_id, image_url, available)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(
            sql,
            [name, description, price, category_id, image_url, available ?? 1],
            function(err) {
                if (err) {
                    if (err.message.includes('FOREIGN KEY')) {
                        return res.status(404).json({ error: err.message });
                    }
                    return res.status(500).json({ error: err.message });
                }

                // Step 3: Respond with success
                res.status(201).json({
                    message: 'Product created successfully',
                    data: { id: this.lastID }
                });
            }
        );
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
            if(err.message.includes('FOREIGN KEY')){
                return res.status(404).json({error: 'Category not found'});
            }
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
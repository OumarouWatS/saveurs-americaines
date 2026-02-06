const express  = require('express');
const router = express.Router();
const db = require('../database');
const {authenticateToken, isAdmin} = require('../middleware/auth');

// Public routes - no authentication needed

// GET all products with category filter, with advanced search, filtering, sorting, and pagination
router.get('/', (req, res) =>{
    const { 
        category,
        search,
        min_price,
        max_price,
        sort = 'created_at',
        order = 'DESC',
        page = 1,
        limit = 10,
        available
    } = req.query;

    // Validate sort field to prevent SQL injection
    const validSortFields = ['name', 'price', 'created_at', 'rating'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortedOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Calculate pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 10, 100); //max 100 items per page
    const offset = (pageNum - 1) * limitNum;

    // Build base query with average rating
    let sql = `
        SELECT 
            p.*, 
            c.name as category_name,
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(DISTINCT r.id) as review_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN reviews r ON p.id = r.product_id
    `;

    let countSql = `
    SELECT COUNT(DISTINCT p.id) as total
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    `;

    let conditions = [];
    let params = [];

    if(search){
        conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }

    // Category filter
    if(category){
        conditions.push('c.name = ?');
        params.push(category);
    }

    // Price range filter
    if(min_price){
        conditions.push('p.price >= ?');
        params.push(parseFloat(min_price));
    }

    if(max_price){
        conditions.push('p.price <= ?');
        params.push(parseFloat(max_price));
    }

    // Availability filter
    if(available !== undefined){
        conditions.push('p.available = ?');
        params.push(available === 'true' ? 1 : 0);
    }

    // Add WHERE clause if conditions exist
    if(conditions.length > 0){
        const whereClause = ' WHERE ' + conditions.join(' AND ');
        sql += whereClause;
        countSql += whereClause;
    }

    // Add sorting
    if(sortField === 'rating'){
        sql += ` ORDER BY average_rating ${sortedOrder}`;
    }else{
        sql += ` ORDER BY p.${sortField} ${sortedOrder}`;
    }

    // Add pagination
    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    // Get total count for pagination metadata
    db.get(countSql, params.slice(0, -2), (err, countResult) => {
        if(err){
            return res.status(500).json({ error: err.message});
        }

        const total = countResult.total;
        const totalPages = Math.ceil(total / limitNum);

        // Get paginated results
        db.all(sql, params, (err, rows) => {
            if(err){
                return res.status(500).json({error: err.message});
            }

            res.json({
                data: rows,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: total,
                    total_pages: totalPages,
                    has_next: pageNum < totalPages,
                    has_prev: pageNum > 1
                }
            });
        });
    });
});

// GET single product with category info and reviews
router.get('/:id', (req, res) => {
    const{ id } = req.params;

    const sql = `
        SELECT 
            p.*, 
            c.name as category_name,
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(DISTINCT r.id) as review_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.id = ?
        GROUP BY p.id
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

// Get reviews for a product (with pagination)
router.get('/:id/reviews', (req, res) => {
    const {id} = req.params;
    const {page = 1, limit = 10, sort = 'created_at', order = 'DESC'} = req.query;

    const validSortFields = ['rating', 'created_at'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortedOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 10, 50);
    const offset = (pageNum - 1) * limitNum;

    db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
        if(err){
            return res.status(500).json({error: err.message});
        }
        if(!product){
            return res.status(500).json({error: 'Product not found'});
        }

        // Get total count
        db.get(
            'SELECT COUNT(*) as total FROM reviews WHERE product_id = ?',
            [id],
            (err, countResult) => {
                if(err){
                    return res.status(500).json({error: err.message});
                }

                const total = countResult.total;
                const totalPages = Math.ceil(total/limitNum);

                // Get paginated reviews
                const sql = `
                SELECT
                    r.*,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                WHERE r.product_id = ?
                ORDER BY r.${sortField} ${sortedOrder}
                LIMIT ? OFFSET?
                `;

                db.all(sql, [id, limitNum, offset], (err, rows) => {
                    if(err){
                        return res.status(500).json({error: err.message});
                    }

                    res.json({
                        product: product.name,
                        data: rows,
                        pagination: {
                            page: pageNum,
                            limit: limitNum,
                            total: total,
                            total_pages: totalPages,
                            has_next: pageNum < totalPages,
                            has_prev: pageNum > 1
                        }
                    });
                });
            }
        );
    })
});

// POST add review to product
router.post('/:id/reviews', authenticateToken, (req, res) => {
    const {id} = req.params;
    const userId = req.user.id;
    const {rating, title, comment} = req.body;

    // Validation
    if(!rating || rating < 1 || rating > 5){
        return res.status(400).json({errror: 'Rating must be between 1 and 5'});
    }

    db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
        if(err){
            return res.status(500).json({error: err.message});
        }
        if(!product){
            return res.status(404).json({error: 'Product not found'});
        }

        // Check if user has purchased this product
        const orderCheckSql = `
        SELECT o.id
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
        LIMIT 1
        `;

        db.get(orderCheckSql, [userId, id], (err, order) => {
            if(err){
                return res.status(500).json({error: err.message});
            }

            if(!order){
                return res.status(403).json({
                    error: 'You can only review products you have purchased and received'
                });
            }

            // Insert review
            const sql = `
            INSERT INTO reviews (product_id, user_id, rating, title, comment)
            VALUES (?, ?, ?, ?)
            `;

            db.run(sql, [id, userId, rating, title, comment], function(err){
                if(err){
                    if(err.message.includes('UNIQUE')){
                        return res.status(409).json({error: 'You have already reviewed this product'});
                    }
                    return res.status(500).json({error: err.message});
                }
                res.status(201).json({
                    message: 'Review added successfully',
                    data: {
                        review_id: this.lastID,
                        product_id: id,
                        rating: rating
                    }
                });
            });
        });
    });
});

// PUT update review
router.put('/reviews/:review_id', authenticateToken, (req, res) => {
    const {review_id} = req.params;
    const userId = req.user.id;
    const {rating, title, comment} = req.body;

    if(rating && (rating < 1 || rating > 5)){
        return res.status(400).json({error: 'Rating must be between 1 and 5'});
    }

    // Check if review belongs to user
    db.get('SELECT * FROM reviews WHERE id = ? AND user_id = ?', [review_id, userId], (err, review) => {
        if(err){
            return res.status(500).json({error: err.message});
        }
        if(!review){
            return res.status(404).json({error: 'Review not found'});
        }

        const sql = `
        UPDATE reviews
        SET rating = ?, title = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `;

        db.run(sql, [rating, title, comment, review_id], function(err){
            if(err){
                return res.status(500).json({error: err.message});
            }

            res.json({message: 'Review updated successfully'});
        });
    });
});

// DELETE review
router.delete('/reviews/:review_id', authenticateToken, (req, res) => {
    const {review_id} = req.params;
    const userId = req.user.id;
    const isAdminUser = req.user.role === 'admin';

    let sql = 'SELECT * FROM reviews WHERE id = ?';
    let params = [review_id];

    // Non-admin users can only delete their own reviews
    if(!isAdminUser){
        sql += ' AND user_id = ?';
        params.push(userId);
    }

    db.get(sql, params, (err, review) => {
        if(err){
            return res.status(500).json({error: err.message});
        }
        if(!review){
            return res.status(404).json({error: 'Review not found'});
        }

        db.run('DELETE FROM reviews WHERE id = ?', [review_id], function(err){
            if(err){
                return res.status(500).json({error: err.message});
            }

            res.json({message: 'Review deleted successfully'});
        });
    });
});

// Admin-only routes - require authentication and admin role

// POST create new product (admin only)
router.post('/', authenticateToken, isAdmin, (req, res) => {
    const { name, description, price, category, image_url, available } = req.body;

    // Basic validation
    if (!name || !price || !category) {
        return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    // Look up category ID by name
    db.get('SELECT id FROM categories WHERE name = ?', [category], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Category not found' });

        const category_id = row.id; // This is the ID that the DB needs

        // Insert the product using category_id
        const sql = `
            INSERT INTO products (name, description, price, category_id, image_url, available)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(
            sql,
            [name, description, price, category_id, image_url ?? null, available ?? 1],
            function(err) {
                if (err) {
                    if (err.message.includes('FOREIGN KEY')) {
                        return res.status(404).json({ error: err.message });
                    }
                    return res.status(500).json({ error: err.message });
                }

                // Respond with success
                res.status(201).json({
                    message: 'Product created successfully',
                    data: { id: this.lastID }
                });
            });
    });
});

// PUT update product (admin only)
router.put('/:id', authenticateToken, isAdmin, (req, res) => {
    const {id} = req.params;
    const {name, description, price, category, image_url, available} = req.body;

    if(!name || !price || !category){
        return res.status(400).json({error: 'Name, price, and category are required'});
    }

    // lookup category_id using category name from the request body
    db.get('SELECT id FROM categories WHERE name = ?', [category], (err, row) => {
        if(err) return res.status(500).json({error: err.message});
        if(!row) return res.status(404).json({error: 'Category not found'});

        const category_id = row.id;

        const sql = `
        UPDATE products
        SET name = ?, description = ?, price = ?, category_id = ?, image_url = ?, available = ?
        WHERE id = ?
        `;
        db.run(sql, [name, description, price, category_id, image_url ?? null, available ?? 1, id], function(err){
            if(err) return res.status(500).json({error: err.message});
            if(this.changes === 0) return res.status(404).json({error: 'Product not found'});
            res.json({message: 'Product updated successfully'});
        });
    });
});


// DELETE product (admin only)
router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
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

// POST add ingredient to product (admin only)
router.post('/:id/ingredients', authenticateToken, isAdmin, (req, res) => {
    const {id} = req.params;
    const {ingredient_id, quantity} = req.body;

    if(!ingredient_id){
        return res.status(400).json({error: 'ingredient_id is required'});
    }

    const sql = 'INSERT INTO product_ingredients (product_id, ingredient_id, quantity) VALUES (?, ?, ?)';

    db.run(sql, [id, ingredient_id, quantity ?? 1], function(err){
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

// DELETE remove ingredient from product (admin only)
router.delete('/:id/ingredients/:ingredient_id', authenticateToken, isAdmin, (req, res) => {
    const { id, ingredient_id } = req.params;
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

module.exports = router


//START ON LINE 30
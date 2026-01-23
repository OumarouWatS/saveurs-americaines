const express = require('express');
const router = express.Router();
const db = require('../database');
const {authenticateToken} = require('../middleware/auth');

// All cart routes requiree authentication
router.use(authenticateToken);

// Helper function to get or create cart for user
const getOrCreateCart = (userId, callback) => {
    db.get('SELECT * FROM carts WHERE user_id = ?', [userId], (err, cart) => {
        if(err){
            return callback(err, null);
        }

        if(cart){
            return callback(null, cart);
        }

        db.run('INSERT INTO carts (user_id) VALUES (?)', [userId], function(err){
            if(err){
                return callback(err, null);
            }
            callback(null, {id: this.lastID, user_id: userId});
        });
    });
};

// GET user's cart with all items
router.get('/', (req, res) => {
    const userId = req.user.id;

    getOrCreateCart(userId, (err, cart) => {
        if(err){
            return res.status(500).json({error: err.message});
        }

        // Get all cart items with products details
        const sql = `
            SELECT
            ci.id,
            ci.quantity,
            ci.added_at,
            p.id as product_id,
            p.name,
            p.description,
            p.price,
            p.image_url,
            p.available,
            c.name as category_name,
            (ci.quantity * p.price) as subtotal
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE ci.cart_id = ?
        ORDER BY ci.added_at DESC
        `;

        db.all(sql, [cart.id], (err, items) => {
            if(err){
                return res.status(500).json({error: err.message});
            }

            // Calculate total
            const total = items.reduce((sum, item) => sum + item.subtotal, 0);
            const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

            res.json({
                cart_id: cart.id,
                items: items,
                item_count: itemCount,
                total: total.toFixed(2)
            });
        });
    });
});

// POST add item to cart
router.post('/items', (req, res) => {
    const userId = req.user.id;
    const {product_id, quantity} = req.body;

    if(!product_id){
        return res.status(400).json({error: 'product_id is required'});
    }

    const qty = quantity || 1;

    if(qty < 1){
        return res.status(400).json({error: 'Quantity must be at least 1'});
    }

    // Check if product exists and is available
    db.get('SELECT * FROM products WHERE id = ?', [product_id], (err, product) => {
        if(err){
            return res.status(500).json({error: err.message});
        }

        if(!product){
            return res.status(404).json({error: 'Product not found'});
        }

        // Get or create cart
        getOrCreateCart(userId, (err, cart) => {
            if(err){
                return res.status(500).json({error: err.message});
            }

            // Check if item is already in the cart
            db.get('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?', 
                [cart.id, product_id], 
                (err, existingItem) =>{
                    if(err){
                        return res.status(500).json({error: err.message});
                    }

                    if(existingItem){
                        // Update quantity if item exists
                        const newQuantity = existingItem.quantity + qty;
                        db.run(
                            "UPDATE cart_items SET quantity = ? WHERE id = ?",
                            [newQuantity, existingItem.id],
                            function(err){
                                if(err){
                                    return res.status(500).json({error: err.message});
                                }
                                res.json({
                                    message: 'Cart item quantity updated',
                                    data: {
                                        cart_item_id: existingItem.id,
                                        product_id: product_id,
                                        quantity: newQuantity
                                    }
                                });
                            }
                        );
                    }else{
                        // Add new item
                        db.run(
                            'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
                            [cart.id, product_id, qty],
                            function(err){
                                if(err){
                                    return res.status(500).json({error: err.message});
                                }

                                db.run('UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [cart.id]);

                                res.status(201).json({
                                    message: 'Item added to cart',
                                    data: {
                                        cart_item_id: this.lastID,
                                        product_id: product_id,
                                        quantity: qty
                                    }
                                });
                            }
                        );
                    }
                }
            );  
        });
    });
});

// PUT update cart item quantity
router.put('/item/:id', (req, res) => {
    const userId = req.user.id;
    const {id} = req.params;
    const {quantity} = req.body;

    if(!quantity || quantity < 1){
        return res.status(400).json({error: 'Quantity must be at least 1'});
    }

    // Verify cart item belongs to user
    const sql = `
    SELECT ci.* FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.id
    WHERE ci.id = ? AND c.user_id = ?
    `;

    db.get(sql, [id, userId], (err, cartItem) => {
        if(err){
            return res.status(500).json({error: err.message});
        }

        if(!cartItem){
            return res.status(404).json({error: 'Cart item not found'});
        }

        // Update quantity
        db.run(
            'UPDATE cart_items SET quantity = ? WHERE id = ?',
            [quantity, id],
            function(err){
                if(err){
                    return res.status(500).json({error: err.message});
                }
                
            

                // Update cart's update_at
                db.run('UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [cartItem.cart_id]);

                res.json({
                    message: 'Cart item updated',
                    data: {
                        cart_item_id: id,
                        quantity: quantity
                    }
                });
            }
        );
    });
});

// DELETE remove item from cart
router.delete('/item/:id', (req, res) => {
    const userId = req.user.id;
    const {id} = req.params;

    // Verify cart item belongs to user
    const sql = `
    SELECT ci.* FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.id
    WHERE ci.id = ? AND c.user_id = ?
    `;

    db.get(sql, [id, userId], (err, cartItem) => {
        if(err){
            return res.status(500).json({error: err.message});
        }

        if(!cartItem){
            return res.status(404).json({error: 'Cart item not found'});
        }

        db.run('DELETE FROM cart_items WHERE id = ?', [id], function(err){
            if(err){
                return res.status(500).json({error: err.message});
            }

            // Update cart's update_at
            db.run('UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [cartItem.cart_id]);

            res.json({message: 'Item removed from cart'});
        });
    });
});

// DELETE clear entire cart
router.delete('/', (req, res) => {
    const userId = req.user.id;

    getOrCreateCart(userId, (err, cart) => {
        if(err){
            return res.status(500).json({error: err.message});
        }

        db.run('DELETE FROM cart_items WHERE cart_id = ?', [cart.id], function(err){
            if(err){
                return res.status(500).json({error: err.message});
            }

            res.json({
                message: 'Cart cleared',
                items_removed: this.changes
            });
        });
    });
});

// GET cart summary (just counts and total, lighter than full cart)
router.get('/summary', (req, res) => {
    const userId = req.user.id;

    getOrCreateCart(userId, (err, cart) => {
        if(err){
            return res.status(500).json({error: err.message});
        }

        const sql = `
        SELECT
            COUNT(*) as item_types,
            SUM(ci.quantity) as total_items,
            SUM(ci.quantity * p.price) as total
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = ?
        `;

        db.get(sql, [cart.id], (err, summary) => {
            if(err){
                return res.status(500).json({error: err.message});
            }

            res.json({
                cart_id: cart.id,
                item_types: summary.item_types || 0,
                total_items: summary.total_items || 0,
                total: summary.total ? summary.total.toFixed(2) : '0.00'
            });
        });
    });
});

module.exports = router;
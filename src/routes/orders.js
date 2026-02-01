const express = require('express');
const router = express.Router();
const db = require('../database');
const {authenticateToken, idAdmin, isAdmin} = require('../middleware/auth');

//All order routes require authentication
router.use(authenticateToken);

//Helper function to generate unique order number
const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random()*1000);
    return 'ORD-${timestamp}-${random}';
};

//POST create order from cart (checkout)
router.post('/', (req, res) => {
    const userId = req.user.id;
    const {delivery_address, delivery_phone, notes} = req.body;

    //Get user's cart
    db.get('SELECT * FROM carts WHERE user_id = ?', [userId], (err, cart) =>{
        if(err){
            return res.status(500).json({error: err.message});
        }

        if(!cart){
            return res.status(400).json({error: 'Cart is empty'});
        }

        //Get cart items with product details
        const cartItemsSql = `
        SELECT
            ci.product_id,
            ci.quantity,
            p.name,
            p.price,
            p.available,
            (ci.quantity * p.price) as subtotal
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = ?
        `;

        db.all(cartItemsSql, [cart.id], (err, cartItems) => {
            if(err){
                return res.status(500).json({error: err.message});
            }

            if(cartItems.length === 0){
                return res.status(400).json({error: 'Cart is empty'});
            }

            //Check if all products are available
            const unavailableProducts = cartItems.filter(item => !item.available);
            if(unavailableProducts.length > 0){
                return res.status(400).json({
                    error: 'Some products in cart are no longer available',
                    unavailable: unavailableProducts.map(p => p,name)
                });
            }

            //Calculate total
            const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

            //Get user's address if not provided
            if(!delivery_address){
                db.get('SELECT address, phone FROM users WHERE id = ?', [userId], (err, user) => {
                    if(err){
                        return res.status(500).json({error: err.message});
                    }

                    createOrder(
                        userId,
                        total,
                        user.address || 'No address provided',
                        delivery_phone || user.phone,
                        notes,
                        cartItems,
                        cart.id
                    );
                });
            }else{
                createOrder(userId, total, delivery_address, delivery_phone, notes, cartItems, cart.id);
            }
        });
    });

    // Helper function to create the order
    function createOrder(userId, total, address, phone, notes, items, cartId){
        const orderNumber = generateOrderNumber();

        //Start transaction-like behabior (SQLite doesn't support full transactions easily here)
        //Insert order
        const orderSql = `
        INSERT INTO orders (user_id, order_number, status, total, delivery_address, delivery_phone, notes)
        VALUES (?, ?, 'pending', ?, ?, ?, ?)
        `;

        db.run(orderSql, [userId, orderNumber, total, address, phone, notes], function(err){
            if(err){
                return res.status(500).json({error: err.message});
            }

            const orderId = this.lastID;

            //Insert order items
            const orderItemSql = `
            INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity subtotal)
            VALUES (?, ?, ?, ?, ?, ?)
            `;

            let insertedItems = 0;
            items.forEach(item => {
                db.run(
                    orderItemSql,
                    [orderId, item.product_id, item.name, item.price, item.quantity, item.subtotal],
                    (err) => {
                        if(err){
                            console.error('Error inserting order ittem:', err);
                        }
                        insertedItems++;

                        //When all items are inserted, clear the cart and return response
                        if(insertedItems === items.length){
                            db.run('DELETE FROM cart_items WHERE cart_id = ?', [cartId], (err) => {
                                if(err){
                                    console.error('Error clearing cart:', err);
                                }

                                res.status(201).json({
                                    message: 'Order created successfully',
                                    data: {
                                        order_id: orderId,
                                        order_number: orderNumber,
                                        status: 'pending',
                                        total: total.toFixed(2),
                                        items_count: item.length
                                    }
                                });
                            });
                        }
                    }
                );
            });
        });
    }
});

// Get all orders for current user
router.get('/', (req, res) => {
    const userId = req.user.id;
    const {status} = req.query;

    let sql = 'SELECT * FROM orders WHERE user_id = ?';
    let params = [userId];

    if(status){
        sql += ' AND status = ?';
        params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    db.all(sql, params, (err, orders) => {
        if(err){
            return res.status(500).json({error: err.message});
        }
        res.json({data: orders});
    });
});

// GET single order details
router.get('/:id', (req, res) => {
    const userId = req.user.id;
    const {id} = req.params;

    //Get order
    db.get(
        'SELECT * FROM orders WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, order) => {
            if(err){
                return res.status(500).json({error: err.message});
            }

            if(!order){
                return res.status(404).json({error: 'Order not found'});
            }

            //Get order items
            db.all(
                'SELECT * FROM order_items WHERE order_id = ?',
                [id],
                (err, items) => {
                    if(err){
                        return res.status(500).json({error: err.message});
                    }
                    res.json({
                        data: {
                            ...order,
                            items: items
                        }
                    });
                }
            );
        }
    );
});

//PATCH update order status (admin only)
router.patch('/:id/status', isAdmin, (req, res) => {
    const {id} = req.params;
    const {status} = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

    if(!status || !validStatuses.includes(status)){
        return res.status(400).json({
            error: 'Invalid status',
            valid_statuses: validStatuses
        });
    }

    const sql = `
    UPDATE orders
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `;

    db.run(sql, [status, id], function(err) {
        if(err){
            return res.status(500).json({error: err.message});
        }

        if(this.changes === 0){
            return res.status(404).json({error: 'Order not found'});
        }

        res.json({message: 'Order status updated',
            data: {
                order_id: id,
                status: status
            }
        });
    });
});

//Get all orders (admin only)
router.get('/admin/all', isAdmin, (req, res) => {
    const {status, limit} = req.query;

    let sql = `
    SELECT
        o.*,
        u.email as customer_email,
        u.first_name,
        u.last_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    `;

    let params = [];

    if(status){
        sql += ' WHERE o.status = ?';
        params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';

    if(limit){
        sql += ' LIMIT ?';
        params.push(parseInt(limit));
    }

    db.all(sql, params, (err, orders) => {
        if(err){
            return res.status(500).json({error: err.message});
        }
        res.json({data: orders});
    });
});

//GET single order details (admin - can view any order)
router.get('/admin/:id', isAdmin, (req, res) => {
    const {id} = req.params;

    //Get order with user details
    const orderSql = `
    SELECT
    o.*,
    u.email as customer_email,
    u.first_name,
    u.last_name,
    u.phone as customer_phone
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
    `;

    db.get(orderSql, [id], (err, order) => {
        if(err){
            return res.status(500).json({error: err.message});
        }

        if(!order){
            return res.status(404).json({error: 'Order not found'});
        }

        // Get order items
        db.all(
            'SELECT * FROM order_items WHERE order_id = ?',
            [id],
            (err, items) => {
                if(err){
                    return res.status(500).json({error: err.message});
                }

                res.json({
                    data: {
                        ...order,
                        items: items
                    }
                });
            }
        );
    });
});

// DELETE cancel order (customer can only cancel pending orders)
router.delete('/:id', (req, res) => {
    const userId = req.user.id; 
    const {id} = req.params;

    //Check if order exists and belongs to user
    db.get(
        'SELECT * FROM orders WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, order) => {
            if(err){
                return res.status(500).json({error: err.message});
            }

            if(!order){
                return res.status(404).json({error: 'Order not found'});
            }

            //Only allow cancellationof pending orders
            if(order.status !== 'pending'){
                return res.status(400).json({
                    error: 'Only pending orders can be cancelled',
                    current_status: order.status
                });
            }

            // Update status to cancelled instead of deleting
            db.run(
                'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                ['cancelled', id],
                function(err){
                    if(err){
                        return res.status(500).json({error: err.message});
                    }
                    res.json({message: 'Order cancelled successfully'});
                }
            );
        }
    );
});

module.exports = router;
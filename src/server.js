const express = require('express');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const ingredientRoutes = require('./routes/ingredients');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cartRoutes = require('./routes/cart');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/ingredients', ingredientRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/cart', cartRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Pastry API is running!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


/*
Couldn't login through the test account (email: "test_account@gmail.com", password: "123pwd")
Next steps --> troubleshoot registration issue and test orders routes




## Step 4: Test Orders with Postman

**Setup: Add Items to Cart First**
```
POST http://localhost:3000/api/cart/items
Headers:
Authorization: Bearer YOUR_CUSTOMER_TOKEN
Body:
{
  "product_id": 1,
  "quantity": 2
}
```

Add a few more items to your cart.

**Test 1: Create Order (Checkout)**
```
POST http://localhost:3000/api/orders
Headers:
Authorization: Bearer YOUR_CUSTOMER_TOKEN
Body:
{
  "delivery_address": "123 Main St, Anytown, USA",
  "delivery_phone": "555-1234",
  "notes": "Please ring doorbell"
}
```

**Test 2: Get User's Order History**
```
GET http://localhost:3000/api/orders
Headers:
Authorization: Bearer YOUR_CUSTOMER_TOKEN
```

**Test 3: Get Specific Order Details**
```
GET http://localhost:3000/api/orders/1
Headers:
Authorization: Bearer YOUR_CUSTOMER_TOKEN
```

**Test 4: Filter Orders by Status**
```
GET http://localhost:3000/api/orders?status=pending
Headers:
Authorization: Bearer YOUR_CUSTOMER_TOKEN
```

**Test 5: Cancel Order (Customer)**
```
DELETE http://localhost:3000/api/orders/1
Headers:
Authorization: Bearer YOUR_CUSTOMER_TOKEN
```

Should only work if order status is 'pending'

**Test 6: Update Order Status (Admin)**
```
PATCH http://localhost:3000/api/orders/1/status
Headers:
Authorization: Bearer YOUR_ADMIN_TOKEN
Body:
{
  "status": "confirmed"
}
```

Valid statuses: pending, confirmed, preparing, ready, out_for_delivery, delivered, cancelled

**Test 7: Get All Orders (Admin)**
```
GET http://localhost:3000/api/orders/admin/all
Headers:
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Test 8: Get All Pending Orders (Admin)**
```
GET http://localhost:3000/api/orders/admin/all?status=pending
Headers:
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Test 9: Limit Results (Admin)**
```
GET http://localhost:3000/api/orders/admin/all?limit=5
Headers:
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Test 10: View Any Order as Admin**
```
GET http://localhost:3000/api/orders/admin/1
Headers:
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Test 11: Try to Checkout with Empty Cart**
```
POST http://localhost:3000/api/orders
Headers:
Authorization: Bearer YOUR_CUSTOMER_TOKEN
Body:
{
  "delivery_address": "123 Main St"
}
```

Should return: `400 Cart is empty`

**Test 12: Complete Order Workflow**

1. Add items to cart
2. View cart
3. Create order (checkout)
4. Verify cart is now empty
5. View order history
6. Admin updates order status to "confirmed"
7. Admin updates to "preparing"
8. Admin updates to "out_for_delivery"
9. Admin updates to "delivered"

## Step 5: Test Order Status Transitions

Create a new order and test the status flow:
```
pending → confirmed → preparing → ready → out_for_delivery → delivered
```

Or cancel path:
```
pending → cancelled
```

Try updating a non-pending order to cancelled (should fail):
```
PATCH http://localhost:3000/api/orders/1/status
Headers:
Authorization: Bearer YOUR_ADMIN_TOKEN
Body:
{
  "status": "cancelled"
}








*/
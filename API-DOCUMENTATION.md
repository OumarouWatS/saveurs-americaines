# Pastry Shop API Documentation

## Base URL
```
http://localhost:3000/
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "555-1234",
  "address": "123 Main St"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "customer"
  }
}
```

---

### Products

#### Get All Products (with filters, search, pagination)
```http
GET /products?page=1&limit=10&search=chocolate&category=Cakes&min_price=10&max_price=50&sort=price&order=ASC&available=true
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `search` - Search in name and description
- `category` - Filter by category name
- `min_price` - Minimum price
- `max_price` - Maximum price
- `sort` - Sort by: name, price, created_at, rating (default: created_at)
- `order` - ASC or DESC (default: DESC)
- `available` - Filter by availability: true or false

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Chocolate Croissant",
      "description": "Buttery croissant with chocolate",
      "price": 4.99,
      "category_name": "Pastries",
      "average_rating": 4.5,
      "review_count": 10,
      "available": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

#### Get Single Product
```http
GET /products/:id
```

#### Create Product (Admin Only)
```http
POST /products
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "name": "Red Velvet Cake",
  "description": "Moist cake with cream cheese frosting",
  "price": 35.99,
  "category_id": 1,
  "image_url": "https://example.com/image.jpg",
  "available": 1
}
```

#### Update Product (Admin Only)
```http
PUT /products/:id
Authorization: Bearer ADMIN_TOKEN
```

#### Delete Product (Admin Only)
```http
DELETE /products/:id
Authorization: Bearer ADMIN_TOKEN
```

---

### Reviews

#### Get Product Reviews
```http
GET /products/:id/reviews?page=1&limit=10&sort=rating&order=DESC
```

#### Add Review (Requires Purchase)
```http
POST /products/:id/reviews
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "rating": 5,
  "title": "Amazing!",
  "comment": "Best pastry I've ever had!"
}
```

#### Update Review
```http
PUT /products/reviews/:review_id
Authorization: Bearer TOKEN
```

#### Delete Review
```http
DELETE /products/reviews/:review_id
Authorization: Bearer TOKEN
```

---

### Shopping Cart

#### Get Cart
```http
GET /cart
Authorization: Bearer TOKEN
```

#### Add Item to Cart
```http
POST /cart/items
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2
}
```

#### Update Cart Item Quantity
```http
PUT /cart/items/:id
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "quantity": 5
}
```

#### Remove Item from Cart
```http
DELETE /cart/items/:id
Authorization: Bearer TOKEN
```

#### Clear Cart
```http
DELETE /cart
Authorization: Bearer TOKEN
```

---

### Orders

#### Create Order (Checkout)
```http
POST /orders
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "delivery_address": "123 Main St, City, State",
  "delivery_phone": "555-1234",
  "notes": "Please ring doorbell"
}
```

#### Get My Orders
```http
GET /orders?status=pending
Authorization: Bearer TOKEN
```

#### Get Order Details
```http
GET /orders/:id
Authorization: Bearer TOKEN
```

#### Cancel Order
```http
DELETE /orders/:id
Authorization: Bearer TOKEN
```

#### Get All Orders (Admin)
```http
GET /orders/admin/all?status=pending&limit=20
Authorization: Bearer ADMIN_TOKEN
```

#### Update Order Status (Admin)
```http
PATCH /orders/:id/status
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "status": "delivered"
}
```

**Valid Statuses:** pending, confirmed, preparing, ready, out_for_delivery, delivered, cancelled

---

### Categories

#### Get All Categories
```http
GET /categories
```

#### Get Category Products
```http
GET /categories/:id/products
```

#### Create Category (Admin)
```http
POST /categories
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "name": "Cakes",
  "description": "Delicious cakes for all occasions"
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "message": "Error description"
  }
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limits

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Reviews**: 10 reviews per hour

---

## Best Practices

1. Always include error handling in your client code
2. Store JWT tokens securely (httpOnly cookies recommended for web)
3. Never expose JWT_SECRET in client-side code
4. Implement token refresh for long-lived sessions
5. Use HTTPS in production
6. Validate all user input on client side as well
```

## Step 8: Add .gitignore

Create `.gitignore`:
```
# Dependencies
node_modules/

# Environment variables
.env

# Database
*.db
*.db-journal

# Logs
logs/
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build
dist/
build/
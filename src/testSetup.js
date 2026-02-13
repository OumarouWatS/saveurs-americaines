const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a test database
const createTestDatabase = () => {
    const db = new sqlite3.Database(':memory:'); // in-memory databse for testing

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create all tables
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                first_name TEXT, 
                last_name TEXT,
                phone TEXT,
                address TEXT,
                address TEXT,
                role TEXT DEFAULT 'customer',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS categories (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL UNIQUE,
                  description TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `);

            db.run(`
                CREATE TABLE IF NOT EXISTS products (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  description TEXT,
                  price REAL NOT NULL,
                  category_id INTEGER,
                  image_url TEXT,
                  available INTEGER DEFAULT 1,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (category_id) REFERENCES categories(id)
                )
              `);

            db.run(`
                CREATE TABLE IF NOT EXISTS ingredients (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL UNIQUE,
                  allergen INTEGER DEFAULT 0,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `);

            db.run(`
                CREATE TABLE IF NOT EXISTS product_ingredients (
                  product_id INTEGER,
                  ingredient_id INTEGER,
                  quantity TEXT,
                  PRIMARY KEY (product_id, ingredient_id),
                  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
                )
              `);

            db.run(`
                CREATE TABLE IF NOT EXISTS carts (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL UNIQUE,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
              `);

            db.run(`
                CREATE TABLE IF NOT EXISTS cart_items (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  cart_id INTEGER NOT NULL,
                  product_id INTEGER NOT NULL,
                  quantity INTEGER NOT NULL DEFAULT 1,
                  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
                  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                  UNIQUE(cart_id, product_id)
                )
              `);

            db.run(`
                CREATE TABLE IF NOT EXISTS orders (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  order_number TEXT NOT NULL UNIQUE,
                  status TEXT DEFAULT 'pending',
                  total REAL NOT NULL,
                  delivery_address TEXT,
                  delivery_phone TEXT,
                  notes TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users(id)
                )
              `);

            db.run(`
                CREATE TABLE IF NOT EXISTS order_items (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  order_id INTEGER NOT NULL,
                  product_id INTEGER NOT NULL,
                  product_name TEXT NOT NULL,
                  product_price REAL NOT NULL,
                  quantity INTEGER NOT NULL,
                  subtotal REAL NOT NULL,
                  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                  FOREIGN KEY (product_id) REFERENCES products(id)
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                title TEXT,
                comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(product_id, user_id)
                )
                `, (err) => {
                if (err) reject(err);
                else resolve(db);
            });
        });
    });
};

module.exports = { createTestDatabase};
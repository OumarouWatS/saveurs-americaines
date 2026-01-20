const express = require('express');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const ingredientRoutes = require('./routes/ingredients');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

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

app.get('/', (req, res) => {
    res.json({ message: 'Pastry API is running!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
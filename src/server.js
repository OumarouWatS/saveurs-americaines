const express = require('express');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const ingredientRoutes = require('./routes/ingredients');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/ingredients', ingredientRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Pastry API is running!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
const isValidPassword = (password) => {
    // At least 6 characters
    return password && password.length >= 6;
}

// Validate price
const isValidPrice = (price) => {
    return !isNaN(price) && price > 0;
};

// Validate rating
const isValidRating = (rating) => {
    return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

// Validate pagination params
const validatePagination = (req, res, next) => {
    const {page, limit} = req.query;

    if(page && (isNaN(page) || parseInt(page) < 1)){
        return res.status(400).json({error: 'Invalid page number'});
    }

    if(limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)){
        return res.status(400).json({error: 'Limit must be between 1 and 100'});
    }

    next();
};

// Sanitize string input (remove dangerous characters)
const sanitizeString = (str) => {
    if(typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
};

module.exports = {
    isValidEmail,
    isValidPassword,
    isValidPrice,
    isValidRating,
    validatePagination,
    sanitizeString
};
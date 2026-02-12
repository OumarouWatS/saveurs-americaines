require('dotenv').config();

module.exports = {
    jwtSecret: 'secret-key-to-change-in-prod', // to change later
    jwtExpiration: '24h', // token expiration time
    saltRounds: 10
};
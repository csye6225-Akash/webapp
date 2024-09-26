const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const config = {
    development: {
        username: process.env.devUsername,
        password: process.env.devPassword,
        database: process.env.devDB,
        host: process.env.devHost,
        dialect: 'mysql' // Ensure to wrap dialect in quotes
    }
};

// Export the config object for use in other files
module.exports = config;

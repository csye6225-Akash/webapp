const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const config = {
    development: {
        username: process.env.DEVUSERNAME,
        password: process.env.DEVPASSWORD,
        database: process.env.DEVDB,
        host: process.env.DEVHOST,
        dialect: 'mysql' 
    }
};

// Export the config object for use in other files
module.exports = config;



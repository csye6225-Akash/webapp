import dotenv from 'dotenv';
dotenv.config();

const config = {
    "development": {
        "username":process.env.devUsername,
        "password":process.env.devPassword,
        "database":process.env.devDB,
        "host": process.env.devHost,
        "dialect:mysql"
    }
}

export default config;
// const express = require('express');
// const cors = require('cors');
// const db = require("./models/index.js");      
// const routes = require("./routes/index.js"); 
// const dotenv = require('dotenv');             

// // Load environment variables
// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use((req, res, next) => {
//     res.header('Cache-Control', 'no-cache');
//     next();
// });

// let dbError = false;
// const main = async () => {
//     try {
//         await db.sequelize.authenticate();
//         console.log('Connection has been established successfully.');

//         // Sync the database
//         await db.sequelize.sync({ force: false }); // Set 'force' to true to force synchronization
//         console.log('DB synced');
//     } catch (error) {
//         console.error('Unable to connect to the database:', error);
//         dbError = true; // Make sure dbError is defined in the appropriate scope
//         app.use((req, res) => {
//             res.status(503).send();
//         });
//     }
//     // if (dbError) {
//     //     app.use((req, res) => {
//     //         res.status(503).send();
//     //     });
//     // }
// };

// // Call the async function
// main();
// // passing app in routes
// routes(app);

// module.exports = app;


const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const Sequelize = require ('sequelize');
const { sequelize } = require('./models/index.js');
const db = require('./models/index.js');
const health_route = require('./routes/healthz-route.js');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache');
    next();
  });

  const checkConnection = async() => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        sequelize.sync();
      } catch (error) {
        console.error('Unable to connect to the database');
      }
}
checkConnection();

app.use("/healthz", health_route);

app.use('/*', (req, res) => {
    res.status(404).json()
});
app.listen(PORT, async() => {
console.log(`Server is running on port ${PORT}`);
});
module.exports = app;
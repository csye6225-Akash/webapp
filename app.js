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

  const checkConnection = async() => {  //checking if the DB is running without any errors and sending a appropriate response.
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
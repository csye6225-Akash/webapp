const router = require("express").Router();
const { sequelize } = require('../models/index.js');
//Displaying 405 for patch, delete, post, put requests
router.use('/', (req, res, next) => {
    if (req.method !== 'GET') {
      res.status(405).json();
    } else {
      next();
    }
  });
  
  router.get('/', async (req, res) => {
    try {
      // Attempt to authenticate with the database
      //await sequelize.authenticate();
      //res.status(200).send('200 OK');
        let payloadCondition = false;
        if (req.query != null && Object.keys(req.query).length > 0) payloadCondition = true;
        if (req.body != null && Object.keys(req.body).length > 0) payloadCondition = true;
        if (payloadCondition) {
            res.status(400).json();
        }
        await sequelize.authenticate();
        res.status(200).json();
        // else{
        //     res.status(200).json();
        // }
      
    } catch (error) {
      //if database connection is shut off, throwing 503
      console.error('Database connection error');
      res.status(503).json(); //res.status(503).json();
    }
  });
module.exports = router;
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const { sequelize } = require('./models/index.js'); 
const db = require('./models/index.js'); 
const bcrypt = require('bcryptjs');
const basicAuth = require('basic-auth');
const validator = require('validator');
const health_route = require('./routes/healthz-route.js');

app.use((req, res, next) => {
  if (Object.keys(req.query).length !== 0) {
    return res.status(400).json({ error: 'Query parameters are not allowed' });
  }
  next();
});

app.all('/v1/user', (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  next();
});

app.all('/v1/user/self', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  next();
});

let dbConnected = false; 








const checkConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await sequelize.sync(); 
    dbConnected = true; 
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    dbConnected = false; 
  }
};
checkConnection();


//setInterval(checkConnection, 5000); // checking every 5 seconds

module.exports = { app, dbConnected };


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache');
  next();
});








app.use("/healthz", health_route);

const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return passwordRegex.test(password);
};


const authenticate = async (req, res, next) => {
  const credentials = basicAuth(req);
  if (!credentials || !credentials.name || !credentials.pass) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    const user = await db.Account.findOne({ where: { email: credentials.name } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

  
    const isPasswordValid = await bcrypt.compare(credentials.pass, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

   
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};


app.post('/v1/user', async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
  }

    if (typeof email !== 'string') {
      return res.status(400).json({ error: 'Email must be a string' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is Required' });
  }
    if (typeof password !== 'string') {
      return res.status(400).json({ error: 'Password must be a string' });
    }
    if (!first_name) {
      return res.status(400).json({ error: 'First Name is Required' });
  }
    if (typeof first_name !== 'string') {
      return res.status(400).json({ error: 'First Name must be a string' });
    }
    if (!last_name) {
      return res.status(400).json({ error: 'Last Name is Required' });
  }
    if (typeof last_name !== 'string') {
      return res.status(400).json({ error: 'Last Name must be a string' });
    }

    

   

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

  

    if (!first_name || !validator.isAlpha(first_name)) {
      return res.status(400).json({ error: 'First name should contain only letters' });
    }
  
    if (!last_name || !validator.isAlpha(last_name)) {
      return res.status(400).json({ error: 'Last name should contain only letters' });
    }

  

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character.',
      });}

    // Check if email already exists
    const existingUser = await db.Account.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Account with this email already exists' });
    }

    const checkDatabaseConnection = (req, res, next) => {
      if (!dbConnected) {
        return res.status(503).json({ error: 'Service Unavailable. Database not connected.' });
      }
      next();
    };

    app.use(checkDatabaseConnection);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const newUser = await db.Account.create({
      email,
      password: hashedPassword,
      first_name,
      last_name,
    });

   
    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      account_created: newUser.account_created,
      account_updated: newUser.account_updated,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create account' });
  }
});


app.get('/v1/user/self', authenticate, (req, res) => {
  
  res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    first_name: req.user.first_name,
    last_name: req.user.last_name,
    account_created: req.user.account_created,
    account_updated: req.user.account_updated,
  });
});


app.put('/v1/user/self', authenticate, async (req, res) => {
  try {
    const { first_name, last_name, password, email } = req.body;

    
    if (!first_name && !last_name && !password && !email) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    if (req.body.email) {
      return res.status(400).json({ error: 'Email cannot be updated' });
    }

    
    if (first_name !== undefined) {
      if (typeof first_name !== 'string') {
        return res.status(400).json({ error: 'First Name must be a string' });
      }
      if (!validator.isAlpha(first_name)) {
        return res.status(400).json({ error: 'First name should contain only letters' });
      }
    }


    if (last_name !== undefined) {
      if (typeof last_name !== 'string') {
        return res.status(400).json({ error: 'Last Name must be a string' });
      }
      if (!validator.isAlpha(last_name)) {
        return res.status(400).json({ error: 'Last name should contain only letters' });
      }
    }

    
    if (password !== undefined) {
      if (typeof password !== 'string') {
        return res.status(400).json({ error: 'Password must be a string' });
      }
      if (!isValidPassword(password)) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character.',
        });
      }
    }

    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    await req.user.update(updateData);

    // sending a 204 to indicate successful update with no content
    res.status(204).send();
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});


app.use('/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Startingserver
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

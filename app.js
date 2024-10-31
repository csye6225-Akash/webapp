const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const logger = require('./logger'); 
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const { sequelize } = require('./models/index.js'); 
const db = require('./models/index.js'); 
const bcrypt = require('bcryptjs');
const basicAuth = require('basic-auth');
const validator = require('validator');
const health_route = require('./routes/healthz-route.js');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const StatsD = require('node-statsd');

// Configure the StatsD client
const statsd = new StatsD({
  host: 'localhost', // Change to your StatsD server address
  port: 8125,        // Default port for StatsD
});


const sendMetric = (metricName, value = 1, type = 'count') => {
  switch (type) {
    case 'count':
      statsd.increment(metricName, value);
      break;
    case 'timing':
      statsd.timing(metricName, value);
      break;
    case 'gauge':
      statsd.gauge(metricName, value);
      break;
    default:
      console.error(`Unknown metric type: ${type}`);
  }
};

// Initialize the S3 client
const s3 = new S3Client({ region: 'us-west-2' });

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME, // Ensure this is set in your environment variables
    key: function (req, file, cb) {
      cb(null, `uploads/${file.originalname}`);
    }
  })
});

module.exports = upload;





// Middleware to check for query parameters
app.use((req, res, next) => {
  if (Object.keys(req.query).length !== 0) {
    logger.warn(`Query parameters are not allowed in the request to ${req.originalUrl}`);
    return res.status(400).json({ error: 'Query parameters are not allowed' });
  }
  next();
});

// Middleware to check allowed methods for /v1/user
app.all('/v1/user', (req, res, next) => {
  if (req.method !== 'POST') {
    logger.warn(`Method ${req.method} is not allowed for ${req.originalUrl}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  next();
});

// Middleware to check allowed methods for /v1/user/self
app.all('/v1/user/self', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    logger.warn(`Method ${req.method} is not allowed for ${req.originalUrl}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  next();
});



let dbConnected = false;

// Import the logger at the top of your file


const checkConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Connection has been established successfully.'); // Use logger instead of console.log
    dbConnected = true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error); // Use logger instead of console.error
    dbConnected = false;
  }
};


// Call the function to check the database connection
checkConnection();

// Remove sequelize.sync() here to avoid continuous schema modifications
// If you want to use sync only when necessary, you can conditionally include it:

// Only sync in development mode or using a specific environment variable

  sequelize.sync({ alter: true })
    .then(() => console.log('Database schema synced successfully.'))
    .catch((error) => console.error('Error syncing database schema:', error));


app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache');
  next();
});

app.use('/healthz', health_route);

const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return passwordRegex.test(password);
};

const authenticate = async (req, res, next) => {
  const credentials = basicAuth(req);
  if (!credentials || !credentials.name || !credentials.pass) {
    logger.warn('Authentication attempt failed: Invalid credentials provided');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    const user = await db.Account.findOne({ where: { email: credentials.name } });
    if (!user) {
      logger.warn(`Authentication attempt failed: User not found for email ${credentials.name}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(credentials.pass, user.password);
    if (!isPasswordValid) {
      logger.warn(`Authentication attempt failed: Invalid password for email ${credentials.name}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.user = user;
    logger.info(`User ${user.id} authenticated successfully`);
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

app.post('/v1/user', async (req, res) => {
  const startTime = Date.now(); // Start timing the request

  try {
    const { email, password, first_name, last_name } = req.body;

    // Log incoming request data
    logger.info(`Received request to create user: ${email}`);

    // Validate email
    if (!email || typeof email !== 'string' || !validator.isEmail(email)) {
      logger.warn('Invalid email provided:', email);
      sendMetric('user_creation_invalid_email', 1); // Increment invalid email metric
      return res.status(400).json({ error: 'Invalid email' });
    }

    // Validate password
    if (!password || typeof password !== 'string' || !isValidPassword(password)) {
      logger.warn('Invalid password provided for email:', email);
      sendMetric('user_creation_invalid_password', 1); // Increment invalid password metric
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Validate first name
    if (!first_name || typeof first_name !== 'string' || !validator.isAlpha(first_name)) {
      logger.warn('Invalid first name provided:', first_name);
      sendMetric('user_creation_invalid_first_name', 1); // Increment invalid first name metric
      return res.status(400).json({ error: 'Invalid first name' });
    }

    // Validate last name
    if (!last_name || typeof last_name !== 'string' || !validator.isAlpha(last_name)) {
      logger.warn('Invalid last name provided:', last_name);
      sendMetric('user_creation_invalid_last_name', 1); // Increment invalid last name metric
      return res.status(400).json({ error: 'Invalid last name' });
    }

    // Check if user already exists
    const existingUser = await db.Account.findOne({ where: { email } });
    if (existingUser) {
      logger.warn('Account with this email already exists:', email);
      sendMetric('user_creation_existing_account', 1); // Increment existing account metric
      return res.status(400).json({ error: 'Account with this email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = await db.Account.create({
      email,
      password: hashedPassword,
      first_name,
      last_name,
    });

    const duration = Date.now() - startTime; // Calculate duration
    sendMetric('user_creation_duration', duration, 'timing'); // Log duration

    logger.info('User created successfully:', newUser.email); // Log successful user creation
    sendMetric('user_creation_success', 1); // Increment successful creation metric

    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      account_created: newUser.account_created,
      account_updated: newUser.account_updated,
    });
  } catch (error) {
    logger.error('Failed to create account:', error); // Log error details
    sendMetric('user_creation_errors', 1); // Increment error count
    res.status(500).json({ error: 'Failed to create account' });
  }
});


app.post('/v1/user/self/pic', authenticate, upload.single('image'), async (req, res) => {
  const startTime = Date.now(); // Start timing the request
  const userId = req.user.id;

  // Log the request to upload a profile picture
  logger.info(`User ${userId} is attempting to upload a profile picture.`);

  try {
    // Retrieve the user's current profile
    const userProfile = await db.Account.findOne({ where: { id: userId } });

    // Check if the user already has a profile picture
    if (userProfile && userProfile.imageKey) {
      logger.warn(`User ${userId} already has a profile picture. Attempted upload rejected.`);
      sendMetric('profile_picture_upload_existing', 1); // Increment existing picture metric
      return res.status(400).json({ error: 'Profile picture already exists. Please delete the existing picture before uploading a new one.' });
    }

    // Store the new image key in the user's profile in the database
    await db.Account.update(
      { imageKey: req.file.key }, // Assuming your Account model has an imageKey field
      { where: { id: userId } }
    );

    const duration = Date.now() - startTime; // Calculate duration
    logger.info(`Profile picture uploaded successfully for user ${userId}: ${req.file.key}`);
    sendMetric('profile_picture_upload_success', 1); // Increment successful upload metric
    sendMetric('profile_picture_upload_duration', duration, 'timing'); // Log duration

    res.status(201).json({ message: 'Profile picture uploaded successfully', imageKey: req.file.key });
  } catch (error) {
    logger.error(`Error uploading profile picture for user ${userId}:`, error);
    sendMetric('profile_picture_upload_errors', 1); // Increment error count
    res.status(500).json({ error: 'Error uploading profile picture' });
  }
});



app.post('/v1/user/self/pic', authenticate, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;

    // Log the request to upload a profile picture
    logger.info(`User ${userId} is attempting to upload a profile picture.`);

    // Retrieve the user's current profile
    const userProfile = await db.Account.findOne({ where: { id: userId } });

    // Check if the user already has a profile picture
    if (userProfile && userProfile.imageKey) {
      logger.warn(`User ${userId} already has a profile picture. Attempted upload rejected.`);
      return res.status(400).json({ error: 'Profile picture already exists. Please delete the existing picture before uploading a new one.' });
    }

    // Store the new image key in the user's profile in the database
    await db.Account.update(
      { imageKey: req.file.key }, // Assuming your Account model has an imageKey field
      { where: { id: userId } }
    );

    logger.info(`Profile picture uploaded successfully for user ${userId}: ${req.file.key}`);
    res.status(201).json({ message: 'Profile picture uploaded successfully', imageKey: req.file.key });
  } catch (error) {
    logger.error(`Error uploading profile picture for user ${userId}:`, error);
    res.status(500).json({ error: 'Error uploading profile picture' });
  }
});


const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

if (!S3_BUCKET_NAME) {
  console.error("Error: S3_BUCKET_NAME is not defined in environment variables.");
  process.exit(1); // Exit the application if bucket name is missing
}


const { DeleteObjectCommand } = require('@aws-sdk/client-s3');


app.delete('/v1/user/self/pic', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Log the request to delete the profile picture
    logger.info(`User ${userId} is attempting to delete their profile picture.`);

    // Retrieve the image key from your database
    const userProfile = await db.Account.findOne({ where: { id: userId } });
    
    if (!userProfile || !userProfile.imageKey) {
      logger.warn(`User ${userId} attempted to delete a non-existing profile picture.`);
      return res.status(404).json({ error: 'Profile picture not found' });
    }

    // Create a delete object command
    const deleteParams = {
      Bucket: S3_BUCKET_NAME,
      Key: userProfile.imageKey,
    };

    // Delete the image from S3
    await s3.send(new DeleteObjectCommand(deleteParams));

    // Optionally, remove the image key from the user's record in the database
    await db.Account.update(
      { imageKey: null },
      { where: { id: userId } }
    );

    logger.info(`Profile picture deleted successfully for user ${userId}: ${userProfile.imageKey}`);
    res.status(204).send(); // No content
  } catch (error) {
    logger.error(`Error deleting profile picture for user ${userId}:`, error);
    res.status(500).json({ error: 'Error deleting profile picture' });
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

    // Check if no fields are provided to update
    if (!first_name && !last_name && !password) {
      logger.warn(`User ${req.user.id} attempted to update with no fields`);
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Prevent email update
    if (email) {
      logger.warn(`User ${req.user.id} attempted to update email, which is not allowed`);
      return res.status(400).json({ error: 'Email cannot be updated' });
    }

    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    await req.user.update(updateData);
    logger.info(`User ${req.user.id} updated their profile successfully`);

    res.status(204).send();
  } catch (error) {
    logger.error(`Failed to update account for user ${req.user.id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// Middleware for handling 404 errors
app.use('/*', (req, res) => {
  logger.warn(`Endpoint not found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = app;



module.exports = app;

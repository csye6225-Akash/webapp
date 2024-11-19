const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
require('dotenv').config();

const uuid = require('uuid');
const AWS = require('aws-sdk');
const sns = new AWS.SNS({ region: process.env.AWS_REGION });







// Configure multer storage
const storage = multer.memoryStorage(); // Use memory storage or configure disk storage as needed

const StatsD = require('node-statsd');
const statsdClient = new StatsD({
  host: 'localhost',
  port: 8125,
});




// Initialize the S3 client with a specific regional endpoint
const s3 = new S3Client({
  region: "us-west-2", // Ensure this is the correct region
  endpoint: `https://s3.us-west-2.amazonaws.com`, // Specify the regional endpoint
});



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






const logger = require('./logger'); 
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const { sequelize } = require('./models/index.js'); 
const db = require('./models/index.js');
const { Account } = db;
const bcrypt = require('bcryptjs');
const basicAuth = require('basic-auth');
const validator = require('validator');
const health_route = require('./routes/healthz-route.js');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const sendMetric = (metricName, value = 1, type = 'count') => {
  switch (type) {
    case 'count':
      statsdClient.increment(metricName, value);
      break;
    case 'timing':
      statsdClient.timing(metricName, value);
      break;
    case 'gauge':
      statsdClient.gauge(metricName, value);
      break;
    default:
      console.error(`Unknown metric type: ${type}`);
  }
};



// app.use((req, res, next) => {
//   if (Object.keys(req.query).length !== 0) {
//     logger.warn(`Query parameters are not allowed in the request to ${req.originalUrl}`);
//     sendMetric('query_parameters_rejected', 1, 'count'); // Metric for rejected query parameters
//     return res.status(400).json({ error: 'Query parameters are not allowed' });
//   }
//   next();
// });

// Middleware to check allowed methods for /v1/user
app.all('/v1/user', (req, res, next) => {
  if (req.method !== 'POST') {
    logger.warn(`Method ${req.method} is not allowed for ${req.originalUrl}`);
    sendMetric('method_not_allowed', 1, 'count'); // Metric for method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  }
  next();
});

// Middleware to check allowed methods for /v1/user/self
app.all('/v1/user/self', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    logger.warn(`Method ${req.method} is not allowed for ${req.originalUrl}`);
    sendMetric('method_not_allowed', 1, 'count'); // Metric for method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  }
  next();
});

let dbConnected = false;

// Import the logger at the top of your file

const checkConnection = async () => {
  const startTime = Date.now(); // Start timing the connection check
  try {
    await sequelize.authenticate();
    const duration = Date.now() - startTime; // Calculate duration
    logger.info('Connection has been established successfully.'); // Use logger instead of console.log
    dbConnected = true;
    sendMetric('db_connection_success', duration, 'timing'); // Metric for successful DB connection
  } catch (error) {
    logger.error('Unable to connect to the database:', error); // Use logger instead of console.error
    dbConnected = false;
    sendMetric('db_connection_failure', 1, 'count'); // Metric for DB connection failure
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
    sendMetric('authentication_failure', 1, 'count'); // Metric for authentication failure
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    const user = await db.Account.findOne({ where: { email: credentials.name } });
    if (!user) {
      logger.warn(`Authentication attempt failed: User not found for email ${credentials.name}`);
      sendMetric('authentication_failure', 1, 'count'); // Metric for authentication failure
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(credentials.pass, user.password);
    if (!isPasswordValid) {
      logger.warn(`Authentication attempt failed: Invalid password for email ${credentials.name}`);
      sendMetric('authentication_failure', 1, 'count'); // Metric for authentication failure
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.user = user;
    logger.info(`User ${user.id} authenticated successfully`);
    sendMetric('authentication_success', 1, 'count'); // Metric for successful authentication
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    sendMetric('authentication_error', 1, 'count'); // Metric for authentication error
    res.status(500).json({ error: 'Internal server error' });
  }
};

const publishToSNSTopic = async (user) => {
  const verificationToken = uuid.v4();
  const tokenExpiry = new Date(Date.now() + 2 * 60 * 1000);

  await saveVerificationToken(user.email, verificationToken);
  
 
  const message = JSON.stringify({
    email: user.email,
    verificationToken: verificationToken,
    tokenExpiry: tokenExpiry.toISOString(),
  });
  

 
  const params = {
    Message: message,
    TopicArn: process.env.SNS_TOPIC_ARN,
  };
 
logger.info(`topic arn: ${process.env.SNS_TOPIC_ARN}`);
 
  try {
    await sns.publish(params).promise();
    logger.info(`SNS message published for user: ${user.email}`);
  } catch (error) {
    logger.error(`Error publishing to SNS: ${error.message}`);
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
      is_verified: false,
    });

    const duration = Date.now() - startTime; // Calculate duration
    sendMetric('user_creation_duration', duration, 'timing'); // Log duration

    logger.info('User created successfully:', newUser.email); // Log successful user creation
    sendMetric('user_creation_success', 1); // Increment successful creation metric

    // await publishToSNSTopic({
    //   email: newUser.email,
    // });

  
    await publishToSNSTopic(newUser);


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




  


const saveVerificationToken = async (email, token) => {
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 2); // Token expires in 1 hour

  // Update the Account with the new verification token and expiration time
  const [updated] = await Account.update(
    {
      verificationToken: token,
      tokenExpiresAt: expirationTime,
    },
    {
      where: { email },
    }
  );

  if (updated === 0) {
    throw new Error(`No account found for email: ${email}`);
  }

  return { email, token, tokenExpiresAt: expirationTime };
};




app.get('/v1/verify', async (req, res) => {
  const { user, token } = req.query; // Extract query parameters

  if (!user || !token) {
    return res.status(400).send('User or token missing');
  }

  try {
    // Validate the token for the given user
    const userRecord = await db.Account.findOne({ where: { email: user } });

    if (!userRecord) {
      return res.status(404).send('User not found');
    }

    if (userRecord.verificationToken !== token) {
      return res.status(400).send('Invalid token');
    }

    if (new Date() > userRecord.tokenExpiresAt) {
      return res.status(400).send('Token has expired');
    }

    // If the token matches, update the user as verified
    userRecord.isVerified = true;
    await userRecord.save();

    res.status(200).send('Email successfully verified');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});




// 

app.post('/v1/user/self/pic', authenticate, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;

    // Retrieve the user's profile
    const userProfile = await db.Account.findOne({ where: { id: userId } });

    // Check if the user exists and is verified
    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!userProfile.isVerified) {
      return res.status(400).json({ error: 'Please verify your email before uploading a profile picture.' });
    }

    // Check if the user already has a profile picture
    if (userProfile && userProfile.imageKey) {
      return res.status(400).json({ error: 'Profile picture already exists. Please delete the existing picture before uploading a new one.' });
    }

    // Store the new image key in the user's profile in the database
    await db.Account.update(
      { imageKey: req.file.key }, // Make sure this matches the key generated by multer-s3
      { where: { id: userId } }
    );

    console.log(`Uploaded image key: ${req.file.key}`); // Log the image key
    res.status(201).json({ message: 'Profile picture uploaded successfully', imageKey: req.file.key });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error uploading profile picture' });
  }
});

const { DeleteObjectCommand } = require('@aws-sdk/client-s3');




// Your upload route


// After updating the profile


app.delete('/v1/user/self/pic', authenticate, async (req, res) => {
  const startTime = Date.now(); // Start timing for metrics
  let userId; // Declare userId variable outside the try block

  try {
    userId = req.user.id; // Assign userId inside the try block

    const userProfile = await db.Account.findOne({ where: { id: userId } });
    sendMetric('db_connection_success', 1); // Track successful DB connection

    // Log the retrieved user profile
    console.log(`Retrieved user profile for user ${userId}:`, userProfile);

    // Check if the user's email is verified
    if (!userProfile.isVerified) {
      sendMetric('profile_picture_delete_unverified', 1); // Track unverified user attempts
      return res.status(403).json({ error: 'Please verify your email before using this API.' });
    }

    // If no image found
    if (!userProfile || !userProfile.imageKey) {
      sendMetric('profile_picture_delete_not_found', 1); // Track not-found errors
      return res.status(404).json({ error: 'Profile picture not found' });
    }

    // Delete image from S3
    const deleteParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: userProfile.imageKey,
    };

    await s3.send(new DeleteObjectCommand(deleteParams));
    sendMetric('profile_picture_delete_success', 1); // Track successful deletes

    // Update the user profile to remove the image key
    await db.Account.update(
      { imageKey: null },
      { where: { id: userId } }
    );

    const duration = Date.now() - startTime; // Calculate duration
    sendMetric('profile_picture_delete_duration', duration, 'timing'); // Log delete duration

    res.status(204).send(); // No content
  } catch (error) {
    const duration = Date.now() - startTime; // Calculate duration on error
    console.error('Error deleting profile picture:', error);

    sendMetric('db_connection_failure', 1); // Track DB connection failure
    sendMetric('profile_picture_delete_errors', 1); // Track delete errors
    sendMetric('profile_picture_delete_duration', duration, 'timing'); // Log duration on error

    // Log the error with the userId now accessible
    logger.error(`Error deleting profile picture for user ${userId}: ${error.message}`, {
      stack: error.stack // Include the stack trace for debugging
    });

    res.status(500).json({ error: 'Error deleting profile picture' });
  }
});




app.get('/v1/user/self/pic', authenticate, async (req, res) => {
  const startTime = Date.now(); // Start timing for metrics
  const userId = req.user.id;

  try {
    // Retrieve the user's profile
    const userProfile = await db.Account.findOne({ where: { id: userId } });
    sendMetric('db_connection_success', 1); // Track successful DB connection

    // Log the retrieved user profile
    console.log(`Retrieved user profile for user ${userId}:`, userProfile);

    // Check if the user's email is verified
    if (!userProfile.isVerified) {
      sendMetric('profile_picture_retrieve_unverified', 1); // Track unverified user attempts
      return res.status(403).json({ error: 'Please verify your email before accessing this API.' });
    }

    // Check if profile picture exists
    if (!userProfile || !userProfile.imageKey) {
      sendMetric('profile_picture_retrieve_not_found', 1); // Track not-found cases
      return res.status(404).json({ error: 'Profile picture not found' });
    }

    // Prepare the response object
    const response = {
      file_name: userProfile.imageKey.split('/').pop(), // Extract the file name from the imageKey
      id: userProfile.imageKey, // Assuming imageKey is unique for the image
      url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${userProfile.imageKey}`, // Construct the URL
      upload_date: userProfile.account_created.toISOString().split('T')[0], // Format upload date (assuming it's created at account creation)
      user_id: userId, // User ID
    };

    const duration = Date.now() - startTime; // Calculate duration
    sendMetric('profile_picture_retrieve_duration', duration, 'timing'); // Log retrieval duration

    res.status(200).json(response); // Send the response
  } catch (error) {
    const duration = Date.now() - startTime; // Calculate duration on error
    console.error('Error retrieving profile picture:', error);

    sendMetric('db_connection_failure', 1); // Track DB connection failure
    sendMetric('profile_picture_retrieve_errors', 1); // Track retrieval errors
    sendMetric('profile_picture_retrieve_duration', duration, 'timing'); // Log duration on error

    // Log the error with additional details
    logger.error(`Error retrieving profile picture for user ${userId}: ${error.message}`, {
      stack: error.stack // Include the stack trace for debugging
    });

    res.status(500).json({ error: 'Error retrieving profile picture' });
  }
});






app.get('/v1/user/self', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    // Retrieve the user's profile
    const userProfile = await db.Account.findOne({ where: { id: userId } });

    // Check if the user's email is verified
    if (!userProfile.isVerified) {
      sendMetric('user_profile_retrieve_unverified', 1); // Track unverified user attempts
      return res.status(403).json({ error: 'Please verify your email before accessing this API.' });
    }

    // Send the user profile details
    res.status(200).json({
      id: userProfile.id,
      email: userProfile.email,
      first_name: userProfile.first_name,
      last_name: userProfile.last_name,
      account_created: userProfile.account_created,
      account_updated: userProfile.account_updated,
    });
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    sendMetric('user_profile_retrieve_errors', 1); // Track retrieval errors
    res.status(500).json({ error: 'Error retrieving user profile' });
  }
});



app.put('/v1/user/self', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    // Retrieve the user's profile
    const userProfile = await db.Account.findOne({ where: { id: userId } });

    // Check if the user's email is verified
    if (!userProfile.isVerified) {
      sendMetric('user_profile_update_unverified', 1); // Track unverified user attempts
      return res.status(403).json({ error: 'Please verify your email before updating your profile.' });
    }

    const { first_name, last_name, password, email } = req.body;

    // Check if no fields are provided to update
    if (!first_name && !last_name && !password) {
      logger.warn(`User ${userId} attempted to update with no fields`);
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Prevent email update
    if (email) {
      logger.warn(`User ${userId} attempted to update email, which is not allowed`);
      return res.status(400).json({ error: 'Email cannot be updated' });
    }

    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    await req.user.update(updateData);
    logger.info(`User ${userId} updated their profile successfully`);

    res.status(204).send();
  } catch (error) {
    logger.error(`Failed to update account for user ${userId}: ${error.message}`);
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






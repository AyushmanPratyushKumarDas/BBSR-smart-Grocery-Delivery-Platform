// =================================================================
//  SECURE SCRIPT TO LOAD ENVIRONMENT VARIABLES AND START THE APP
// =================================================================

const path = require('path');

// 1. Load environment variables from the .env file
//    This line securely reads your .env file and makes the variables
//    available throughout your application via process.env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });


// 2. Set route initialization flag (if your app needs it)
global.routesInitialized = true;


// 3. Start the main server logic
//    Now that the environment variables are loaded, start the server
const server = require('./server.js');


// 4. Log a confirmation message
console.log('🚀 Server started securely with environment variables loaded from .env');
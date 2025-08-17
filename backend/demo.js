const path = require('path');
const dotenv = require('dotenv');

console.log('--- STARTING DEBUG SCRIPT ---');
console.log('Current directory (__dirname):', __dirname);

const envPath = path.resolve(__dirname, '.env');
console.log('Attempting to load .env from:', envPath);

const result = dotenv.config({ path: envPath, debug: true });

if (result.error) {
  console.error('ERROR: dotenv failed to load the file.', result.error);
} else {
  console.log('dotenv parsed the following keys:', Object.keys(result.parsed || {}));
}

console.log('The value for DB_HOST is:', process.env.DB_HOST);
console.log('--- ENDING DEBUG SCRIPT ---');
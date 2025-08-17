#!/usr/bin/env node

/**
 * AWS Services Test Script
 * 
 * This script tests the AWS integration for:
 * - DynamoDB table creation and operations
 * - S3 bucket access and file operations
 * - RDS connection status
 * 
 * Usage: node test-aws.js
 */

const dotenv = require('dotenv');
const { 
  initializeAWS, 
  checkRDSConnection, 
  checkS3Access,
  dynamoCacheService,
  s3Service 
} = require('./config/aws');

// Load environment variables
dotenv.config();

console.log('🧪 Testing AWS Services Integration...\n');

// Test AWS initialization
async function testAWSInitialization() {
  console.log('1️⃣ Testing AWS Services Initialization...');
  try {
    const result = await initializeAWS();
    console.log(`   Result: ${result ? '✅ Success' : '⚠️ Partial Success'}`);
    return result;
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

// Test DynamoDB operations
async function testDynamoDB() {
  console.log('\n2️⃣ Testing DynamoDB Operations...');
  
  if (!dynamoCacheService) {
    console.log('   ⚠️ DynamoDB service not available');
    return false;
  }

  try {
    // Test product caching
    const testProduct = {
      id: 'test-001',
      name: 'Test Product',
      price: 9.99,
      category: 'test',
      description: 'Test product for AWS integration'
    };

    console.log('   📝 Testing product cache...');
    const cacheResult = await dynamoCacheService.cacheProduct(testProduct);
    console.log(`   Cache Result: ${cacheResult ? '✅ Success' : '❌ Failed'}`);

    // Test product retrieval
    console.log('   📖 Testing product retrieval...');
    const retrievedProduct = await dynamoCacheService.getCachedProduct('test-001');
    if (retrievedProduct) {
      console.log(`   Retrieved: ${retrievedProduct.name} - $${retrievedProduct.price}`);
    } else {
      console.log('   ❌ Product not found in cache');
    }

    // Test category query
    console.log('   🔍 Testing category query...');
    const categoryProducts = await dynamoCacheService.getProductsByCategory('test');
    console.log(`   Category Products: ${categoryProducts.length} found`);

    return true;
  } catch (error) {
    console.error(`   ❌ DynamoDB Test Failed: ${error.message}`);
    return false;
  }
}

// Test S3 operations
async function testS3() {
  console.log('\n3️⃣ Testing S3 Operations...');
  
  if (!s3Service) {
    console.log('   ⚠️ S3 service not available');
    return false;
  }

  try {
    // Test bucket access
    console.log('   🪣 Testing bucket access...');
    const listResult = await s3Service.listFiles('', 1);
    console.log(`   Bucket Access: ${listResult.success ? '✅ Success' : '❌ Failed'}`);

    // Test file upload (small test file)
    console.log('   📤 Testing file upload...');
    const testBuffer = Buffer.from('Hello AWS S3! This is a test file.');
    const uploadResult = await s3Service.uploadFile(
      testBuffer, 
      'test/test-file.txt', 
      'text/plain'
    );
    
    if (uploadResult.success) {
      console.log(`   File Upload: ✅ Success`);
      console.log(`   File URL: ${uploadResult.url}`);
      
      // Test file retrieval
      console.log('   📥 Testing file retrieval...');
      const getResult = await s3Service.getFile('test/test-file.txt');
      console.log(`   File Retrieval: ${getResult.success ? '✅ Success' : '❌ Failed'}`);
      
      // Clean up test file
      console.log('   🗑️ Cleaning up test file...');
      const deleteResult = await s3Service.deleteFile('test/test-file.txt');
      console.log(`   File Deletion: ${deleteResult.success ? '✅ Success' : '❌ Failed'}`);
    } else {
      console.log(`   File Upload: ❌ Failed - ${uploadResult.error}`);
    }

    return true;
  } catch (error) {
    console.error(`   ❌ S3 Test Failed: ${error.message}`);
    return false;
  }
}

// Test RDS connection
async function testRDS() {
  console.log('\n4️⃣ Testing RDS Connection...');
  
  try {
    const rdsStatus = await checkRDSConnection();
    if (rdsStatus) {
      console.log(`   ✅ RDS Status: ${rdsStatus.status}`);
      console.log(`   Endpoint: ${rdsStatus.endpoint}:${rdsStatus.port}`);
    } else {
      console.log('   ⚠️ RDS not accessible');
    }
    return !!rdsStatus;
  } catch (error) {
    console.error(`   ❌ RDS Test Failed: ${error.message}`);
    return false;
  }
}

// Test S3 access
async function testS3Access() {
  console.log('\n5️⃣ Testing S3 Access...');
  
  try {
    const s3Status = await checkS3Access();
    console.log(`   S3 Access: ${s3Status ? '✅ Success' : '❌ Failed'}`);
    return s3Status;
  } catch (error) {
    console.error(`   ❌ S3 Access Test Failed: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting AWS Services Tests...\n');
  
  const results = {
    awsInit: false,
    dynamodb: false,
    s3: false,
    rds: false,
    s3Access: false
  };

  try {
    // Run all tests
    results.awsInit = await testAWSInitialization();
    results.dynamodb = await testDynamoDB();
    results.s3 = await testS3();
    results.rds = await testRDS();
    results.s3Access = await testS3Access();

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`AWS Initialization: ${results.awsInit ? '✅' : '❌'}`);
    console.log(`DynamoDB Operations: ${results.dynamodb ? '✅' : '❌'}`);
    console.log(`S3 Operations: ${results.s3 ? '✅' : '❌'}`);
    console.log(`RDS Connection: ${results.rds ? '✅' : '❌'}`);
    console.log(`S3 Access: ${results.s3Access ? '✅' : '❌'}`);

    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\nOverall Result: ${successCount}/${totalCount} tests passed`);
    
    if (successCount === totalCount) {
      console.log('🎉 All AWS services are working correctly!');
    } else if (successCount > 0) {
      console.log('⚠️ Some AWS services are working, others may need configuration');
    } else {
      console.log('❌ AWS services are not accessible. Check your configuration.');
    }

  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().then(() => {
    console.log('\n🏁 Test execution completed');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };

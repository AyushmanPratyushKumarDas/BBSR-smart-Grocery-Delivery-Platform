const {
  dynamoDocClient,
  s3Client,
  S3_BUCKET_NAME,
  DYNAMODB_TABLES,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  getSignedUrl
} = require('../config/aws');

// DynamoDB Cache Service
class DynamoDBCacheService {
  constructor() {
    this.tables = DYNAMODB_TABLES;
  }

  // Product Cache Operations
  async cacheProduct(product) {
    try {
      const params = {
        TableName: this.tables.PRODUCT_CACHE,
        Item: {
          id: product.id.toString(),
          category: product.category || 'general',
          data: product,
          createdAt: new Date().toISOString(),
          ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours TTL
        }
      };

      await dynamoDocClient.send(new PutItemCommand(params));
      console.log(`✅ Product ${product.id} cached in DynamoDB`);
      return true;
    } catch (error) {
      console.error(`❌ Error caching product ${product.id}:`, error.message);
      return false;
    }
  }

  async getCachedProduct(productId) {
    try {
      const params = {
        TableName: this.tables.PRODUCT_CACHE,
        Key: { id: productId.toString() }
      };

      const result = await dynamoDocClient.send(new GetItemCommand(params));
      
      if (result.Item && result.Item.data) {
        console.log(`✅ Product ${productId} retrieved from DynamoDB cache`);
        return result.Item.data;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error retrieving cached product ${productId}:`, error.message);
      return null;
    }
  }

  async getProductsByCategory(category) {
    try {
      const params = {
        TableName: this.tables.PRODUCT_CACHE,
        IndexName: 'CategoryIndex',
        KeyConditionExpression: 'category = :category',
        ExpressionAttributeValues: {
          ':category': category
        }
      };

      const result = await dynamoDocClient.send(new QueryCommand(params));
      
      if (result.Items && result.Items.length > 0) {
        console.log(`✅ Retrieved ${result.Items.length} products for category ${category} from cache`);
        return result.Items.map(item => item.data);
      }
      
      return [];
    } catch (error) {
      console.error(`❌ Error retrieving products by category ${category}:`, error.message);
      return [];
    }
  }

  async clearProductCache(productId) {
    try {
      const params = {
        TableName: this.tables.PRODUCT_CACHE,
        Key: { id: productId.toString() }
      };

      await dynamoDocClient.send(new DeleteItemCommand(params));
      console.log(`✅ Product ${productId} cache cleared from DynamoDB`);
      return true;
    } catch (error) {
      console.error(`❌ Error clearing product cache ${productId}:`, error.message);
      return false;
    }
  }

  async cacheMultipleProducts(products) {
    try {
      const batchSize = 25; // DynamoDB batch write limit
      const batches = [];
      
      for (let i = 0; i < products.length; i += batchSize) {
        batches.push(products.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const writeRequests = batch.map(product => ({
          PutRequest: {
            Item: {
              id: product.id.toString(),
              category: product.category || 'general',
              data: product,
              createdAt: new Date().toISOString(),
              ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
            }
          }
        }));

        const params = {
          RequestItems: {
            [this.tables.PRODUCT_CACHE]: writeRequests
          }
        };

        await dynamoDocClient.send(new PutItemCommand(params));
      }

      console.log(`✅ Cached ${products.length} products in DynamoDB`);
      return true;
    } catch (error) {
      console.error(`❌ Error caching multiple products:`, error.message);
      return false;
    }
  }

  // Store Cache Operations
  async cacheStore(store) {
    try {
      const params = {
        TableName: this.tables.STORE_CACHE,
        Item: {
          id: store.id.toString(),
          category: store.category || 'general',
          data: store,
          createdAt: new Date().toISOString(),
          ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        }
      };

      await dynamoDocClient.send(new PutItemCommand(params));
      console.log(`✅ Store ${store.id} cached in DynamoDB`);
      return true;
    } catch (error) {
      console.error(`❌ Error caching store ${store.id}:`, error.message);
      return false;
    }
  }

  async getCachedStore(storeId) {
    try {
      const params = {
        TableName: this.tables.STORE_CACHE,
        Key: { id: storeId.toString() }
      };

      const result = await dynamoDocClient.send(new GetItemCommand(params));
      
      if (result.Item && result.Item.data) {
        console.log(`✅ Store ${storeId} retrieved from DynamoDB cache`);
        return result.Item.data;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error retrieving cached store ${storeId}:`, error.message);
      return null;
    }
  }

  // Order Cache Operations
  async cacheOrder(order) {
    try {
      const params = {
        TableName: this.tables.ORDER_CACHE,
        Item: {
          id: order.id.toString(),
          customerId: order.customerId.toString(),
          status: order.status || 'pending',
          data: order,
          createdAt: new Date().toISOString(),
          ttl: Math.floor(Date.now() / 1000) + (12 * 60 * 60) // 12 hours TTL
        }
      };

      await dynamoDocClient.send(new PutItemCommand(params));
      console.log(`✅ Order ${order.id} cached in DynamoDB`);
      return true;
    } catch (error) {
      console.error(`❌ Error caching order ${order.id}:`, error.message);
      return false;
    }
  }

  async getCachedOrder(orderId) {
    try {
      const params = {
        TableName: this.tables.ORDER_CACHE,
        Key: { id: orderId.toString() }
      };

      const result = await dynamoDocClient.send(new GetItemCommand(params));
      
      if (result.Item && result.Item.data) {
        console.log(`✅ Order ${orderId} retrieved from DynamoDB cache`);
        return result.Item.data;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error retrieving cached order ${orderId}:`, error.message);
      return null;
    }
  }

  // User Session Cache Operations
  async cacheUserSession(userId, sessionData) {
    try {
      const params = {
        TableName: this.tables.USER_SESSION_CACHE,
        Item: {
          userId: userId.toString(),
          data: sessionData,
          createdAt: new Date().toISOString(),
          ttl: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // 2 hours TTL
        }
      };

      await dynamoDocClient.send(new PutItemCommand(params));
      console.log(`✅ User session ${userId} cached in DynamoDB`);
      return true;
    } catch (error) {
      console.error(`❌ Error caching user session ${userId}:`, error.message);
      return false;
    }
  }

  async getUserSession(userId) {
    try {
      const params = {
        TableName: this.tables.USER_SESSION_CACHE,
        Key: { userId: userId.toString() }
      };

      const result = await dynamoDocClient.send(new GetItemCommand(params));
      
      if (result.Item && result.Item.data) {
        console.log(`✅ User session ${userId} retrieved from DynamoDB cache`);
        return result.Item.data;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error retrieving user session ${userId}:`, error.message);
      return null;
    }
  }

  async clearUserSession(userId) {
    try {
      const params = {
        TableName: this.tables.USER_SESSION_CACHE,
        Key: { userId: userId.toString() }
      };

      await dynamoDocClient.send(new DeleteItemCommand(params));
      console.log(`✅ User session ${userId} cleared from DynamoDB`);
      return true;
    } catch (error) {
      console.error(`❌ Error clearing user session ${userId}:`, error.message);
      return false;
    }
  }
}

// S3 Service
class S3Service {
  constructor() {
    this.bucketName = S3_BUCKET_NAME;
  }

  async uploadImage(buffer, key, contentType) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read'
      };

      await s3Client.send(new PutObjectCommand(params));
      
      const url = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
      console.log(`✅ Image uploaded to S3: ${url}`);
      
      return {
        success: true,
        url,
        key
      };
    } catch (error) {
      console.error(`❌ Error uploading image to S3:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getImage(key) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      const result = await s3Client.send(new GetObjectCommand(params));
      console.log(`✅ Image retrieved from S3: ${key}`);
      
      return {
        success: true,
        data: result.Body,
        contentType: result.ContentType
      };
    } catch (error) {
      console.error(`❌ Error retrieving image from S3:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteImage(key) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      await s3Client.send(new DeleteObjectCommand(params));
      console.log(`✅ Image deleted from S3: ${key}`);
      
      return {
        success: true
      };
    } catch (error) {
      console.error(`❌ Error deleting image from S3:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listImages(prefix = '') {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: prefix
      };

      const result = await s3Client.send(new ListObjectsV2Command(params));
      console.log(`✅ Listed images from S3 with prefix: ${prefix}`);
      
      return {
        success: true,
        images: result.Contents || []
      };
    } catch (error) {
      console.error(`❌ Error listing images from S3:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSignedUrl(key, operation = 'getObject', expiresIn = 3600) {
    try {
      const command = operation === 'putObject' ? PutObjectCommand : GetObjectCommand;
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      const url = await getSignedUrl(s3Client, new command(params), { expiresIn });
      console.log(`✅ Generated signed URL for ${operation}: ${key}`);
      
      return {
        success: true,
        url
      };
    } catch (error) {
      console.error(`❌ Error generating signed URL:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create service instances
const dynamoCacheService = new DynamoDBCacheService();
const s3Service = new S3Service();

module.exports = {
  dynamoCacheService,
  s3Service,
  DynamoDBCacheService,
  S3Service
};

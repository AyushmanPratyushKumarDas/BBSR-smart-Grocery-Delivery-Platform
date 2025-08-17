import React, { useState, useEffect } from 'react';
import { productsAPI, systemAPI } from '../services/api';

const ApiTestComponent = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [dataSource, setDataSource] = useState('');

  // Test API health
  const testHealth = async () => {
    try {
      setLoading(true);
      const response = await systemAPI.checkHealth();
      setHealthStatus(response.data);
      console.log('🏥 Health check successful:', response.data);
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      setHealthStatus({ status: 'ERROR', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Test products API with fallback
  const testProductsAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Testing products API...');
      const response = await productsAPI.getAll({ limit: 5 });
      
      setProducts(response.data.products || response.data);
      setDataSource(response.data.source || 'demo');
      
      console.log(`✅ Products loaded successfully from ${response.data.source || 'demo'}`);
      console.log(`📊 Found ${response.data.products?.length || response.data.length} products`);
      
    } catch (error) {
      console.error('❌ Products API test failed:', error.message);
      setError(error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Test featured products
  const testFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('⭐ Testing featured products API...');
      const response = await productsAPI.getFeatured({ limit: 3 });
      
      setProducts(response.data.products || response.data);
      setDataSource(response.data.source || 'demo');
      
      console.log(`✅ Featured products loaded successfully from ${response.data.source || 'demo'}`);
      
    } catch (error) {
      console.error('❌ Featured products API test failed:', error.message);
      setError(error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Test search functionality
  const testSearch = async (query) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Testing search API for: "${query}"`);
      const response = await productsAPI.search(query);
      
      setProducts(response.data.products || response.data);
      setDataSource(response.data.source || 'demo');
      
      console.log(`✅ Search completed successfully from ${response.data.source || 'demo'}`);
      
    } catch (error) {
      console.error('❌ Search API test failed:', error.message);
      setError(error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Test health on component mount
    testHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        🧪 API Integration Test Component
      </h2>
      
      {/* Health Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">🏥 System Health</h3>
        {healthStatus ? (
          <div className={`p-3 rounded ${
            healthStatus.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <p><strong>Status:</strong> {healthStatus.status}</p>
            <p><strong>Message:</strong> {healthStatus.message}</p>
            {healthStatus.services && (
              <div className="mt-2">
                <p><strong>Database:</strong> {healthStatus.services.database?.status || 'Unknown'}</p>
                <p><strong>AWS:</strong> {healthStatus.services.aws?.connected ? 'Connected' : 'Not Connected'}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">Loading health status...</p>
        )}
      </div>

      {/* API Test Buttons */}
      <div className="mb-6 space-y-3">
        <h3 className="text-lg font-semibold">🔌 API Tests</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={testProductsAPI}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '⏳ Loading...' : '📦 Test Products API'}
          </button>
          
          <button
            onClick={testFeaturedProducts}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '⏳ Loading...' : '⭐ Test Featured Products'}
          </button>
          
          <button
            onClick={() => testSearch('apple')}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? '⏳ Loading...' : '🔍 Test Search (Apple)'}
          </button>
          
          <button
            onClick={() => testSearch('organic')}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? '⏳ Loading...' : '🌱 Test Search (Organic)'}
          </button>
        </div>
      </div>

      {/* Data Source Indicator */}
      {dataSource && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            <strong>📊 Data Source:</strong> {dataSource === 'cache' ? 'DynamoDB Cache' : 
              dataSource === 'database' ? 'PostgreSQL Database' : 'Demo Data (Fallback)'}
          </p>
          {dataSource === 'demo' && (
            <p className="text-blue-600 text-sm mt-1">
              ⚠️ Backend API is not accessible, using demo data
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <p className="text-red-800">
            <strong>❌ Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Products Display */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">
          📋 Products ({products.length})
        </h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-800">{product.name}</h4>
                <p className="text-green-600 font-bold">${product.price}</p>
                <p className="text-gray-600 text-sm">{product.category}</p>
                {product.description && (
                  <p className="text-gray-500 text-xs mt-2 line-clamp-2">{product.description}</p>
                )}
                {product.store && (
                  <p className="text-blue-600 text-xs mt-1">Store: {product.store.name}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No products found</p>
          </div>
        )}
      </div>

      {/* Console Instructions */}
      <div className="p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">📱 Console Monitoring</h4>
        <p className="text-yellow-700 text-sm">
          Open your browser's Developer Console (F12) to see detailed API request/response logs, 
          fallback indicators, and data source information. The console will show:
        </p>
        <ul className="text-yellow-700 text-sm mt-2 list-disc list-inside">
          <li>🌐 API Request details</li>
          <li>✅ Successful responses with data source</li>
          <li>⚠️ Fallback to demo data when API fails</li>
          <li>❌ Error details and status codes</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTestComponent;

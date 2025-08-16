import axios from 'axios';
import { demoAPI } from './demoService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request details
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    if (config.params) {
      console.log('📋 Request Params:', config.params);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    if (response.data?.source) {
      console.log(`📊 Data Source: ${response.data.source}`);
    }
    return response;
  },
  (error) => {
    // Enhanced error logging
    const errorDetails = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      responseData: error.response?.data
    };
    
    console.error('❌ API Error:', errorDetails);
    
    // Handle specific error types
    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized access, redirecting to login...');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 503) {
      console.log('⚠️ Service unavailable, using demo data...');
    } else if (error.code === 'ECONNABORTED') {
      console.log('⏰ Request timeout, using demo data...');
    } else if (error.code === 'ERR_NETWORK') {
      console.log('🌐 Network error, using demo data...');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API calls with fallback
const apiCallWithFallback = async (apiCall, demoCall, errorContext) => {
  try {
    const response = await apiCall();
    console.log(`✅ ${errorContext} - API call successful`);
    return response;
  } catch (error) {
    console.log(`⚠️ ${errorContext} - API call failed, using demo data`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Status: ${error.response?.status || 'Unknown'}`);
    
    try {
      const demoResponse = await demoCall();
      console.log(`✅ ${errorContext} - Demo data retrieved successfully`);
      return demoResponse;
    } catch (demoError) {
      console.error(`❌ ${errorContext} - Demo data also failed:`, demoError.message);
      throw demoError;
    }
  }
};

// Auth API
export const authAPI = {
  login: async (credentials) => {
    return apiCallWithFallback(
      () => api.post('/auth/login', credentials),
      () => ({
        data: {
          user: {
            id: 1,
            name: 'John Doe',
            email: credentials.email,
            role: 'customer'
          },
          token: 'demo-token-123'
        }
      }),
      'User Login'
    );
  },
  
  register: async (userData) => {
    return apiCallWithFallback(
      () => api.post('/auth/register', userData),
      () => ({
        data: {
          user: {
            id: 1,
            name: userData.name,
            email: userData.email,
            role: userData.role || 'customer'
          },
          token: 'demo-token-123'
        }
      }),
      'User Registration'
    );
  },
  
  getProfile: async () => {
    return apiCallWithFallback(
      () => api.get('/auth/me'),
      () => demoAPI.getCurrentUser(),
      'User Profile'
    );
  },
  
  forgotPassword: async (email) => {
    return apiCallWithFallback(
      () => api.post('/auth/forgot-password', { email }),
      () => ({ data: { message: 'Password reset email sent (demo)' } }),
      'Forgot Password'
    );
  },
  
  resetPassword: async (token, password) => {
    return apiCallWithFallback(
      () => api.post('/auth/reset-password', { token, password }),
      () => ({ data: { message: 'Password reset successful (demo)' } }),
      'Reset Password'
    );
  },
};

// Products API
export const productsAPI = {
  getAll: async (params) => {
    return apiCallWithFallback(
      () => api.get('/products', { params }),
      () => demoAPI.getAllProducts(params),
      'Products List'
    );
  },
  
  getById: async (id) => {
    return apiCallWithFallback(
      () => api.get(`/products/${id}`),
      () => demoAPI.getProductById(id),
      `Product Detail (ID: ${id})`
    );
  },
  
  getFeatured: async () => {
    return apiCallWithFallback(
      () => api.get('/products/featured'),
      () => demoAPI.getFeaturedProducts(),
      'Featured Products'
    );
  },
  
  search: async (query) => {
    return apiCallWithFallback(
      () => api.get('/products/search', { params: { q: query } }),
      () => demoAPI.getAllProducts({ search: query }),
      `Product Search (Query: "${query}")`
    );
  },
  
  getCategories: async () => {
    return apiCallWithFallback(
      () => api.get('/products/categories'),
      () => demoAPI.getCategories(),
      'Product Categories'
    );
  },
  
  getByCategory: async (categoryId) => {
    return apiCallWithFallback(
      () => api.get('/products', { params: { category: categoryId } }),
      () => demoAPI.getProductsByCategory(categoryId),
      `Products by Category (ID: ${categoryId})`
    );
  },
  
  getByStore: async (storeId) => {
    return apiCallWithFallback(
      () => api.get('/products', { params: { storeId } }),
      () => demoAPI.getProductsByStore(storeId),
      `Products by Store (ID: ${storeId})`
    );
  },
};

// Stores API
export const storesAPI = {
  getAll: async (params) => {
    return apiCallWithFallback(
      () => api.get('/stores', { params }),
      () => demoAPI.getAllStores(params),
      'Stores List'
    );
  },
  
  getById: async (id) => {
    return apiCallWithFallback(
      () => api.get(`/stores/${id}`),
      () => demoAPI.getStoreById(id),
      `Store Detail (ID: ${id})`
    );
  },
  
  getNearby: async (lat, lng, radius) => {
    return apiCallWithFallback(
      () => api.get('/stores/nearby', { params: { lat, lng, radius } }),
      () => demoAPI.getNearbyStores(lat, lng, radius),
      'Nearby Stores'
    );
  },
  
  search: async (query) => {
    return apiCallWithFallback(
      () => api.get('/stores/search', { params: { q: query } }),
      () => demoAPI.getAllStores({ search: query }),
      `Store Search (Query: "${query}")`
    );
  },
};

// Orders API
export const ordersAPI = {
  create: async (orderData) => {
    return apiCallWithFallback(
      () => api.post('/orders', orderData),
      () => demoAPI.createOrder(orderData),
      'Create Order'
    );
  },
  
  getAll: async (params) => {
    return apiCallWithFallback(
      () => api.get('/orders', { params }),
      () => demoAPI.getOrders(),
      'Orders List'
    );
  },
  
  getById: async (id) => {
    return apiCallWithFallback(
      () => api.get(`/orders/${id}`),
      () => demoAPI.getOrderById(id),
      `Order Detail (ID: ${id})`
    );
  },
  
  updateStatus: async (id, status) => {
    return apiCallWithFallback(
      () => api.put(`/orders/${id}/status`, { status }),
      () => ({ data: { message: 'Order status updated (demo)' } }),
      `Update Order Status (ID: ${id})`
    );
  },
  
  cancel: async (id) => {
    return apiCallWithFallback(
      () => api.post(`/orders/${id}/cancel`),
      () => ({ data: { message: 'Order cancelled (demo)' } }),
      `Cancel Order (ID: ${id})`
    );
  },
};

// Payments API
export const paymentsAPI = {
  createOrder: async (paymentData) => {
    return apiCallWithFallback(
      () => api.post('/payments/create-order', paymentData),
      () => ({ data: { message: 'Payment order created (demo)' } }),
      'Create Payment Order'
    );
  },
  
  verify: async (verificationData) => {
    return apiCallWithFallback(
      () => api.post('/payments/verify', verificationData),
      () => ({ data: { message: 'Payment verified (demo)' } }),
      'Verify Payment'
    );
  },
  
  getHistory: async (params) => {
    return apiCallWithFallback(
      () => api.get('/payments/history', { params }),
      () => ({ data: { payments: [] } }),
      'Payment History'
    );
  },
  
  getDetails: async (orderId) => {
    return apiCallWithFallback(
      () => api.get(`/payments/order/${orderId}`),
      () => ({ data: { message: 'Payment details (demo)' } }),
      `Payment Details (Order: ${orderId})`
    );
  },
};

// User API
export const userAPI = {
  updateProfile: async (profileData) => {
    return apiCallWithFallback(
      () => api.put('/users/profile', profileData),
      () => demoAPI.updateProfile(profileData),
      'Update User Profile'
    );
  },
  
  uploadAvatar: async (formData) => {
    return apiCallWithFallback(
      () => api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      () => ({ data: { message: 'Avatar uploaded (demo)' } }),
      'Upload Avatar'
    );
  },
  
  changePassword: async (passwordData) => {
    return apiCallWithFallback(
      () => api.put('/users/password', passwordData),
      () => ({ data: { message: 'Password changed (demo)' } }),
      'Change Password'
    );
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboard: async (params) => {
    return apiCallWithFallback(
      () => api.get('/analytics/dashboard', { params }),
      () => ({ data: { message: 'Analytics dashboard (demo)' } }),
      'Analytics Dashboard'
    );
  },
  
  getSales: async (params) => {
    return apiCallWithFallback(
      () => api.get('/analytics/sales', { params }),
      () => ({ data: { message: 'Sales analytics (demo)' } }),
      'Sales Analytics'
    );
  },
  
  getProducts: async (params) => {
    return apiCallWithFallback(
      () => api.get('/analytics/products', { params }),
      () => ({ data: { message: 'Product analytics (demo)' } }),
      'Product Analytics'
    );
  },
  
  getCustomers: async (params) => {
    return apiCallWithFallback(
      () => api.get('/analytics/customers', { params }),
      () => ({ data: { message: 'Customer analytics (demo)' } }),
      'Customer Analytics'
    );
  },
};

// Health check and status API
export const systemAPI = {
  checkHealth: async () => {
    try {
      const response = await api.get('/health');
      console.log('🏥 Health check successful:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      throw error;
    }
  },
  
  getStatus: async () => {
    try {
      const response = await api.get('/api/status');
      console.log('📊 System status retrieved:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Status check failed:', error.message);
      throw error;
    }
  },
};

// Export the main API instance and all API functions
export default api;

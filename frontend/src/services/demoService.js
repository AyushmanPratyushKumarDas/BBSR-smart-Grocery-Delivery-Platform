// Demo service for fallback data when API is not available
import { 
  demoProducts, 
  demoStores, 
  demoCategories, 
  demoUser, 
  demoOrders, 
  demoReviews,
  searchProducts, 
  filterProducts, 
  searchStores, 
  filterStores,
  getProductsByCategory,
  getProductsByStore,
  getFeaturedProducts
} from '../data/demoData';

class DemoService {
  // Products
  async getAllProducts(params = {}) {
    let products = [...demoProducts];
    
    // Apply search
    if (params.search) {
      products = searchProducts(params.search);
    }
    
    // Apply filters
    if (Object.keys(params).length > 0) {
      products = filterProducts(params);
    }
    
    // Apply sorting
    if (params.sortBy) {
      products = this.sortProducts(products, params.sortBy);
    }
    
    return { data: products };
  }

  async getProductById(id) {
    const product = demoProducts.find(p => p.id === parseInt(id));
    if (!product) {
      throw new Error('Product not found');
    }
    return { data: product };
  }

  async getCategories() {
    return { data: demoCategories };
  }

  async getFeaturedProducts() {
    return { data: getFeaturedProducts() };
  }

  async getProductsByCategory(categoryId) {
    return { data: getProductsByCategory(categoryId) };
  }

  async getProductsByStore(storeId) {
    return { data: getProductsByStore(storeId) };
  }

  // Stores
  async getAllStores(params = {}) {
    let stores = [...demoStores];
    
    // Apply search
    if (params.search) {
      stores = searchStores(params.search);
    }
    
    // Apply filters
    if (Object.keys(params).length > 0) {
      stores = filterStores(params);
    }
    
    // Apply sorting
    if (params.sortBy) {
      stores = this.sortStores(stores, params.sortBy);
    }
    
    return { data: stores };
  }

  async getStoreById(id) {
    const store = demoStores.find(s => s.id === parseInt(id));
    if (!store) {
      throw new Error('Store not found');
    }
    return { data: store };
  }

  async getNearbyStores(lat, lng, radius = 10) {
    // Simulate nearby stores based on location
    return { data: demoStores.slice(0, 4) };
  }

  // User
  async getCurrentUser() {
    return { data: demoUser };
  }

  async updateProfile(userData) {
    return { data: { ...demoUser, ...userData } };
  }

  // Orders
  async getOrders() {
    return { data: demoOrders };
  }

  async getOrderById(id) {
    const order = demoOrders.find(o => o.id === parseInt(id));
    if (!order) {
      throw new Error('Order not found');
    }
    return { data: order };
  }

  async createOrder(orderData) {
    const newOrder = {
      id: demoOrders.length + 1,
      ...orderData,
      status: 'pending',
      orderDate: new Date().toISOString(),
      paymentStatus: 'pending'
    };
    return { data: newOrder };
  }

  // Reviews
  async getProductReviews(productId) {
    const reviews = demoReviews.filter(r => r.productId === parseInt(productId));
    return { data: reviews };
  }

  async createReview(reviewData) {
    const newReview = {
      id: demoReviews.length + 1,
      ...reviewData,
      date: new Date().toISOString()
    };
    return { data: newReview };
  }

  // Helper methods
  sortProducts(products, sortBy) {
    const sorted = [...products];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'price_low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price_high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      default:
        return sorted;
    }
  }

  sortStores(stores, sortBy) {
    const sorted = [...stores];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'distance':
        return sorted.sort((a, b) => a.distance - b.distance);
      default:
        return sorted;
    }
  }

  // Simulate API delay
  async delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Wrapper to add delay to all methods
  async withDelay(method, ...args) {
    await this.delay();
    return this[method](...args);
  }
}

// Create singleton instance
const demoService = new DemoService();

// Export wrapped methods with delay
export const demoAPI = {
  // Products
  getAllProducts: (...args) => demoService.withDelay('getAllProducts', ...args),
  getProductById: (...args) => demoService.withDelay('getProductById', ...args),
  getCategories: (...args) => demoService.withDelay('getCategories', ...args),
  getFeaturedProducts: (...args) => demoService.withDelay('getFeaturedProducts', ...args),
  getProductsByCategory: (...args) => demoService.withDelay('getProductsByCategory', ...args),
  getProductsByStore: (...args) => demoService.withDelay('getProductsByStore', ...args),

  // Stores
  getAllStores: (...args) => demoService.withDelay('getAllStores', ...args),
  getStoreById: (...args) => demoService.withDelay('getStoreById', ...args),
  getNearbyStores: (...args) => demoService.withDelay('getNearbyStores', ...args),

  // User
  getCurrentUser: (...args) => demoService.withDelay('getCurrentUser', ...args),
  updateProfile: (...args) => demoService.withDelay('updateProfile', ...args),

  // Orders
  getOrders: (...args) => demoService.withDelay('getOrders', ...args),
  getOrderById: (...args) => demoService.withDelay('getOrderById', ...args),
  createOrder: (...args) => demoService.withDelay('createOrder', ...args),

  // Reviews
  getProductReviews: (...args) => demoService.withDelay('getProductReviews', ...args),
  createReview: (...args) => demoService.withDelay('createReview', ...args),
};

export default demoService;

// Demo data for the BBSR Smart Grocery Delivery Platform

export const demoCategories = [
  { id: 1, name: 'Vegetables', count: 45, image: '/categories/vegetables.jpg' },
  { id: 2, name: 'Fruits', count: 32, image: '/categories/fruits.jpg' },
  { id: 3, name: 'Dairy & Eggs', count: 28, image: '/categories/dairy.jpg' },
  { id: 4, name: 'Grains & Cereals', count: 35, image: '/categories/grains.jpg' },
  { id: 5, name: 'Bakery', count: 22, image: '/categories/bakery.jpg' },
  { id: 6, name: 'Beverages', count: 18, image: '/categories/beverages.jpg' },
  { id: 7, name: 'Snacks', count: 40, image: '/categories/snacks.jpg' },
  { id: 8, name: 'Personal Care', count: 25, image: '/categories/personal-care.jpg' },
  { id: 9, name: 'Household', count: 30, image: '/categories/household.jpg' },
  { id: 10, name: 'Frozen Foods', count: 15, image: '/categories/frozen.jpg' },
];

export const demoStores = [
  {
    id: 1,
    name: 'Fresh Mart',
    description: 'Your neighborhood grocery store with fresh produce and daily essentials.',
    location: 'Khandagiri, Bhubaneswar',
    address: 'Plot No. 123, Khandagiri Square, Bhubaneswar, Odisha 751030',
    phone: '+91 94370 12345',
    email: 'info@freshmart.com',
    rating: 4.5,
    reviewCount: 128,
    category: 'Supermarket',
    image: '/stores/fresh-mart.jpg',
    logo: '/stores/fresh-mart-logo.jpg',
    isOpen: true,
    operatingHours: {
      monday: { open: 600, close: 2200 },
      tuesday: { open: 600, close: 2200 },
      wednesday: { open: 600, close: 2200 },
      thursday: { open: 600, close: 2200 },
      friday: { open: 600, close: 2200 },
      saturday: { open: 700, close: 2100 },
      sunday: { open: 800, close: 2000 },
    },
    deliveryTime: '30-45 minutes',
    minimumOrder: 100,
    deliveryFee: 20,
  },
  {
    id: 2,
    name: 'Organic Corner',
    description: 'Premium organic and natural products for health-conscious customers.',
    location: 'Patia, Bhubaneswar',
    address: 'Shop No. 45, Patia Market Complex, Bhubaneswar, Odisha 751024',
    phone: '+91 94370 23456',
    email: 'hello@organiccorner.com',
    rating: 4.8,
    reviewCount: 89,
    category: 'Organic Store',
    image: '/stores/organic-corner.jpg',
    logo: '/stores/organic-corner-logo.jpg',
    isOpen: true,
    operatingHours: {
      monday: { open: 800, close: 2000 },
      tuesday: { open: 800, close: 2000 },
      wednesday: { open: 800, close: 2000 },
      thursday: { open: 800, close: 2000 },
      friday: { open: 800, close: 2000 },
      saturday: { open: 800, close: 1900 },
      sunday: { open: 900, close: 1800 },
    },
    deliveryTime: '45-60 minutes',
    minimumOrder: 150,
    deliveryFee: 30,
  },
  {
    id: 3,
    name: 'Daily Groceries',
    description: 'Convenient grocery store with competitive prices and wide selection.',
    location: 'Nayapalli, Bhubaneswar',
    address: 'Ground Floor, Nayapalli Shopping Center, Bhubaneswar, Odisha 751012',
    phone: '+91 94370 34567',
    email: 'contact@dailygroceries.com',
    rating: 4.3,
    reviewCount: 156,
    category: 'Supermarket',
    image: '/stores/daily-groceries.jpg',
    logo: '/stores/daily-groceries-logo.jpg',
    isOpen: false,
    operatingHours: {
      monday: { open: 700, close: 2100 },
      tuesday: { open: 700, close: 2100 },
      wednesday: { open: 700, close: 2100 },
      thursday: { open: 700, close: 2100 },
      friday: { open: 700, close: 2100 },
      saturday: { open: 700, close: 2000 },
      sunday: { open: 800, close: 1900 },
    },
    deliveryTime: '35-50 minutes',
    minimumOrder: 80,
    deliveryFee: 15,
  },
  {
    id: 4,
    name: 'Super Fresh',
    description: 'Premium grocery store with imported and local products.',
    location: 'Saheed Nagar, Bhubaneswar',
    address: 'Building A, Saheed Nagar Market, Bhubaneswar, Odisha 751007',
    phone: '+91 94370 45678',
    email: 'info@superfresh.com',
    rating: 4.6,
    reviewCount: 203,
    category: 'Premium Store',
    image: '/stores/super-fresh.jpg',
    logo: '/stores/super-fresh-logo.jpg',
    isOpen: true,
    operatingHours: {
      monday: { open: 800, close: 2200 },
      tuesday: { open: 800, close: 2200 },
      wednesday: { open: 800, close: 2200 },
      thursday: { open: 800, close: 2200 },
      friday: { open: 800, close: 2200 },
      saturday: { open: 800, close: 2100 },
      sunday: { open: 900, close: 2000 },
    },
    deliveryTime: '40-55 minutes',
    minimumOrder: 120,
    deliveryFee: 25,
  },
  {
    id: 5,
    name: 'Local Market',
    description: 'Traditional market with fresh local produce and regional specialties.',
    location: 'Unit 3, Bhubaneswar',
    address: 'Unit 3 Market Area, Bhubaneswar, Odisha 751001',
    phone: '+91 94370 56789',
    email: 'localmarket@gmail.com',
    rating: 4.2,
    reviewCount: 95,
    category: 'Local Market',
    image: '/stores/local-market.jpg',
    logo: '/stores/local-market-logo.jpg',
    isOpen: true,
    operatingHours: {
      monday: { open: 600, close: 2000 },
      tuesday: { open: 600, close: 2000 },
      wednesday: { open: 600, close: 2000 },
      thursday: { open: 600, close: 2000 },
      friday: { open: 600, close: 2000 },
      saturday: { open: 600, close: 1900 },
      sunday: { open: 700, close: 1800 },
    },
    deliveryTime: '25-40 minutes',
    minimumOrder: 60,
    deliveryFee: 10,
  },
  {
    id: 6,
    name: 'Health Foods',
    description: 'Specialized store for health foods, supplements, and dietary products.',
    location: 'Kalinga Nagar, Bhubaneswar',
    address: 'Shop No. 12, Kalinga Nagar Complex, Bhubaneswar, Odisha 751019',
    phone: '+91 94370 67890',
    email: 'health@healthfoods.com',
    rating: 4.7,
    reviewCount: 67,
    category: 'Health Store',
    image: '/stores/health-foods.jpg',
    logo: '/stores/health-foods-logo.jpg',
    isOpen: true,
    operatingHours: {
      monday: { open: 900, close: 1900 },
      tuesday: { open: 900, close: 1900 },
      wednesday: { open: 900, close: 1900 },
      thursday: { open: 900, close: 1900 },
      friday: { open: 900, close: 1900 },
      saturday: { open: 900, close: 1800 },
      sunday: { open: 1000, close: 1700 },
    },
    deliveryTime: '50-65 minutes',
    minimumOrder: 200,
    deliveryFee: 35,
  },
];

export const demoProducts = [
  {
    id: 1,
    name: 'Fresh Tomatoes',
    description: 'Fresh, ripe tomatoes sourced from local farms. Perfect for salads, cooking, and garnishing.',
    category: 'Vegetables',
    categoryId: 1,
    price: 49,
    originalPrice: 60,
    stock: 150,
    unit: 'kg',
    rating: 4.5,
    reviewCount: 89,
    storeId: 1,
    storeName: 'Fresh Mart',
    image: '/products/tomatoes.jpg',
    images: [
      '/products/tomatoes.jpg',
      '/products/tomatoes-2.jpg',
      '/products/tomatoes-3.jpg'
    ],
    isFeatured: true,
    isActive: true,
    nutritionalInfo: {
      calories: 18,
      protein: '0.9g',
      carbs: '3.9g',
      fiber: '1.2g',
      vitaminC: '13.7mg'
    },
    allergens: [],
    expiryDate: '2024-01-15',
    weight: '1 kg',
    origin: 'Local Farm',
  },
  {
    id: 2,
    name: 'Organic Milk',
    description: 'Pure organic milk from grass-fed cows. Rich in calcium and essential nutrients.',
    category: 'Dairy & Eggs',
    categoryId: 3,
    price: 65,
    originalPrice: 75,
    stock: 80,
    unit: 'liter',
    rating: 4.8,
    reviewCount: 156,
    storeId: 2,
    storeName: 'Organic Corner',
    image: '/products/milk.jpg',
    images: [
      '/products/milk.jpg',
      '/products/milk-2.jpg'
    ],
    isFeatured: true,
    isActive: true,
    nutritionalInfo: {
      calories: 42,
      protein: '3.4g',
      carbs: '5.0g',
      fat: '1.0g',
      calcium: '113mg'
    },
    allergens: ['Milk'],
    expiryDate: '2024-01-10',
    weight: '1 liter',
    origin: 'Organic Farm',
  },
  {
    id: 3,
    name: 'Whole Wheat Bread',
    description: 'Freshly baked whole wheat bread with no preservatives. High in fiber and nutrients.',
    category: 'Bakery',
    categoryId: 5,
    price: 35,
    originalPrice: 40,
    stock: 45,
    unit: 'pack',
    rating: 4.3,
    reviewCount: 67,
    storeId: 1,
    storeName: 'Fresh Mart',
    image: '/products/bread.jpg',
    images: [
      '/products/bread.jpg',
      '/products/bread-2.jpg'
    ],
    isFeatured: false,
    isActive: true,
    nutritionalInfo: {
      calories: 247,
      protein: '13.0g',
      carbs: '41.0g',
      fiber: '7.0g',
      iron: '2.7mg'
    },
    allergens: ['Wheat', 'Gluten'],
    expiryDate: '2024-01-08',
    weight: '400g',
    origin: 'Local Bakery',
  },
  {
    id: 4,
    name: 'Fresh Apples',
    description: 'Sweet and crisp red apples. Rich in antioxidants and dietary fiber.',
    category: 'Fruits',
    categoryId: 2,
    price: 120,
    originalPrice: 140,
    stock: 90,
    unit: 'kg',
    rating: 4.6,
    reviewCount: 123,
    storeId: 4,
    storeName: 'Super Fresh',
    image: '/products/apples.jpg',
    images: [
      '/products/apples.jpg',
      '/products/apples-2.jpg',
      '/products/apples-3.jpg'
    ],
    isFeatured: true,
    isActive: true,
    nutritionalInfo: {
      calories: 52,
      protein: '0.3g',
      carbs: '14.0g',
      fiber: '2.4g',
      vitaminC: '4.6mg'
    },
    allergens: [],
    expiryDate: '2024-01-20',
    weight: '1 kg',
    origin: 'Himachal Pradesh',
  },
  {
    id: 5,
    name: 'Basmati Rice',
    description: 'Premium long-grain basmati rice. Aromatic and perfect for biryanis and pulao.',
    category: 'Grains & Cereals',
    categoryId: 4,
    price: 85,
    originalPrice: 95,
    stock: 200,
    unit: 'kg',
    rating: 4.4,
    reviewCount: 234,
    storeId: 3,
    storeName: 'Daily Groceries',
    image: '/products/rice.jpg',
    images: [
      '/products/rice.jpg',
      '/products/rice-2.jpg'
    ],
    isFeatured: false,
    isActive: true,
    nutritionalInfo: {
      calories: 130,
      protein: '2.7g',
      carbs: '28.0g',
      fiber: '0.4g',
      iron: '0.2mg'
    },
    allergens: [],
    expiryDate: '2025-01-01',
    weight: '1 kg',
    origin: 'Punjab',
  },
  {
    id: 6,
    name: 'Fresh Eggs',
    description: 'Farm fresh eggs from free-range chickens. Rich in protein and essential nutrients.',
    category: 'Dairy & Eggs',
    categoryId: 3,
    price: 55,
    originalPrice: 65,
    stock: 120,
    unit: 'dozen',
    rating: 4.7,
    reviewCount: 189,
    storeId: 1,
    storeName: 'Fresh Mart',
    image: '/products/eggs.jpg',
    images: [
      '/products/eggs.jpg',
      '/products/eggs-2.jpg'
    ],
    isFeatured: true,
    isActive: true,
    nutritionalInfo: {
      calories: 155,
      protein: '12.6g',
      carbs: '1.1g',
      fat: '10.6g',
      cholesterol: '373mg'
    },
    allergens: ['Eggs'],
    expiryDate: '2024-01-12',
    weight: '12 eggs',
    origin: 'Local Farm',
  },
  {
    id: 7,
    name: 'Onions',
    description: 'Fresh red onions. Essential ingredient for Indian cooking with long shelf life.',
    category: 'Vegetables',
    categoryId: 1,
    price: 30,
    originalPrice: 35,
    stock: 300,
    unit: 'kg',
    rating: 4.2,
    reviewCount: 145,
    storeId: 5,
    storeName: 'Local Market',
    image: '/products/onions.jpg',
    images: [
      '/products/onions.jpg',
      '/products/onions-2.jpg'
    ],
    isFeatured: false,
    isActive: true,
    nutritionalInfo: {
      calories: 40,
      protein: '1.1g',
      carbs: '9.3g',
      fiber: '1.7g',
      vitaminC: '7.4mg'
    },
    allergens: [],
    expiryDate: '2024-01-25',
    weight: '1 kg',
    origin: 'Local Farm',
  },
  {
    id: 8,
    name: 'Bananas',
    description: 'Sweet and nutritious bananas. Perfect for snacking and smoothies.',
    category: 'Fruits',
    categoryId: 2,
    price: 40,
    originalPrice: 50,
    stock: 180,
    unit: 'dozen',
    rating: 4.5,
    reviewCount: 167,
    storeId: 4,
    storeName: 'Super Fresh',
    image: '/products/bananas.jpg',
    images: [
      '/products/bananas.jpg',
      '/products/bananas-2.jpg'
    ],
    isFeatured: false,
    isActive: true,
    nutritionalInfo: {
      calories: 89,
      protein: '1.1g',
      carbs: '23.0g',
      fiber: '2.6g',
      potassium: '358mg'
    },
    allergens: [],
    expiryDate: '2024-01-18',
    weight: '12 pieces',
    origin: 'Kerala',
  },
  {
    id: 9,
    name: 'Potatoes',
    description: 'Fresh potatoes perfect for cooking. Versatile ingredient for various dishes.',
    category: 'Vegetables',
    categoryId: 1,
    price: 25,
    originalPrice: 30,
    stock: 250,
    unit: 'kg',
    rating: 4.1,
    reviewCount: 98,
    storeId: 3,
    storeName: 'Daily Groceries',
    image: '/products/potatoes.jpg',
    images: [
      '/products/potatoes.jpg',
      '/products/potatoes-2.jpg'
    ],
    isFeatured: false,
    isActive: true,
    nutritionalInfo: {
      calories: 77,
      protein: '2.0g',
      carbs: '17.0g',
      fiber: '2.2g',
      vitaminC: '19.7mg'
    },
    allergens: [],
    expiryDate: '2024-01-30',
    weight: '1 kg',
    origin: 'Local Farm',
  },
  {
    id: 10,
    name: 'Oranges',
    description: 'Juicy and sweet oranges rich in vitamin C. Perfect for boosting immunity.',
    category: 'Fruits',
    categoryId: 2,
    price: 80,
    originalPrice: 90,
    stock: 75,
    unit: 'kg',
    rating: 4.6,
    reviewCount: 134,
    storeId: 2,
    storeName: 'Organic Corner',
    image: '/products/oranges.jpg',
    images: [
      '/products/oranges.jpg',
      '/products/oranges-2.jpg'
    ],
    isFeatured: true,
    isActive: true,
    nutritionalInfo: {
      calories: 47,
      protein: '0.9g',
      carbs: '12.0g',
      fiber: '2.4g',
      vitaminC: '53.2mg'
    },
    allergens: [],
    expiryDate: '2024-01-22',
    weight: '1 kg',
    origin: 'Nagpur',
  },
  {
    id: 11,
    name: 'Carrots',
    description: 'Fresh and crunchy carrots. Great for salads, cooking, and juicing.',
    category: 'Vegetables',
    categoryId: 1,
    price: 35,
    originalPrice: 40,
    stock: 120,
    unit: 'kg',
    rating: 4.3,
    reviewCount: 76,
    storeId: 1,
    storeName: 'Fresh Mart',
    image: '/products/carrots.jpg',
    images: [
      '/products/carrots.jpg',
      '/products/carrots-2.jpg'
    ],
    isFeatured: false,
    isActive: true,
    nutritionalInfo: {
      calories: 41,
      protein: '0.9g',
      carbs: '10.0g',
      fiber: '2.8g',
      vitaminA: '835μg'
    },
    allergens: [],
    expiryDate: '2024-01-16',
    weight: '1 kg',
    origin: 'Local Farm',
  },
  {
    id: 12,
    name: 'Paneer',
    description: 'Fresh homemade paneer. Perfect for curries, snacks, and desserts.',
    category: 'Dairy & Eggs',
    categoryId: 3,
    price: 180,
    originalPrice: 200,
    stock: 40,
    unit: 'kg',
    rating: 4.8,
    reviewCount: 89,
    storeId: 2,
    storeName: 'Organic Corner',
    image: '/products/paneer.jpg',
    images: [
      '/products/paneer.jpg',
      '/products/paneer-2.jpg'
    ],
    isFeatured: true,
    isActive: true,
    nutritionalInfo: {
      calories: 265,
      protein: '18.0g',
      carbs: '2.0g',
      fat: '20.0g',
      calcium: '208mg'
    },
    allergens: ['Milk'],
    expiryDate: '2024-01-07',
    weight: '500g',
    origin: 'Local Dairy',
  },
];

export const demoOrders = [
  {
    id: 1,
    userId: 1,
    storeId: 1,
    storeName: 'Fresh Mart',
    items: [
      { productId: 1, name: 'Fresh Tomatoes', quantity: 2, price: 49, total: 98 },
      { productId: 3, name: 'Whole Wheat Bread', quantity: 1, price: 35, total: 35 },
    ],
    total: 153,
    deliveryFee: 20,
    grandTotal: 173,
    status: 'delivered',
    orderDate: '2024-01-05T10:30:00Z',
    deliveryDate: '2024-01-05T11:15:00Z',
    deliveryAddress: '123 Main Street, Khandagiri, Bhubaneswar',
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    deliveryPartner: {
      id: 1,
      name: 'Rahul Kumar',
      phone: '+91 94370 11111',
    },
  },
  {
    id: 2,
    userId: 1,
    storeId: 2,
    storeName: 'Organic Corner',
    items: [
      { productId: 2, name: 'Organic Milk', quantity: 2, price: 65, total: 130 },
      { productId: 10, name: 'Oranges', quantity: 1, price: 80, total: 80 },
    ],
    total: 210,
    deliveryFee: 30,
    grandTotal: 240,
    status: 'preparing',
    orderDate: '2024-01-06T14:20:00Z',
    estimatedDelivery: '2024-01-06T15:30:00Z',
    deliveryAddress: '123 Main Street, Khandagiri, Bhubaneswar',
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
  },
];

export const demoUser = {
  id: 1,
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+91 94370 12345',
  role: 'customer',
  avatar: '/avatars/user.jpg',
  addresses: [
    {
      id: 1,
      type: 'home',
      address: '123 Main Street, Khandagiri, Bhubaneswar, Odisha 751030',
      isDefault: true,
    },
    {
      id: 2,
      type: 'office',
      address: '456 Tech Park, Patia, Bhubaneswar, Odisha 751024',
      isDefault: false,
    },
  ],
  preferences: {
    notifications: true,
    emailUpdates: true,
    smsUpdates: false,
  },
};

export const demoReviews = [
  {
    id: 1,
    productId: 1,
    userId: 1,
    userName: 'John Doe',
    rating: 5,
    comment: 'Excellent quality tomatoes! Very fresh and reasonably priced.',
    date: '2024-01-03T12:00:00Z',
  },
  {
    id: 2,
    productId: 1,
    userId: 2,
    userName: 'Jane Smith',
    rating: 4,
    comment: 'Good quality tomatoes. Delivery was on time.',
    date: '2024-01-02T15:30:00Z',
  },
  {
    id: 3,
    productId: 2,
    userId: 3,
    userName: 'Mike Johnson',
    rating: 5,
    comment: 'Best organic milk I have ever tasted! Highly recommended.',
    date: '2024-01-04T09:15:00Z',
  },
];

// Helper function to get products by category
export const getProductsByCategory = (categoryId) => {
  return demoProducts.filter(product => product.categoryId === categoryId);
};

// Helper function to get products by store
export const getProductsByStore = (storeId) => {
  return demoProducts.filter(product => product.storeId === storeId);
};

// Helper function to get featured products
export const getFeaturedProducts = () => {
  return demoProducts.filter(product => product.isFeatured);
};

// Helper function to search products
export const searchProducts = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return demoProducts.filter(product => 
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.description.toLowerCase().includes(lowercaseQuery) ||
    product.category.toLowerCase().includes(lowercaseQuery)
  );
};

// Helper function to filter products
export const filterProducts = (filters) => {
  let filtered = [...demoProducts];

  if (filters.category) {
    filtered = filtered.filter(product => product.categoryId === parseInt(filters.category));
  }

  if (filters.minPrice) {
    filtered = filtered.filter(product => product.price >= parseInt(filters.minPrice));
  }

  if (filters.maxPrice) {
    filtered = filtered.filter(product => product.price <= parseInt(filters.maxPrice));
  }

  if (filters.rating) {
    filtered = filtered.filter(product => product.rating >= parseInt(filters.rating));
  }

  if (filters.inStock) {
    filtered = filtered.filter(product => product.stock > 0);
  }

  return filtered;
};

// Helper function to search stores
export const searchStores = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return demoStores.filter(store => 
    store.name.toLowerCase().includes(lowercaseQuery) ||
    store.location.toLowerCase().includes(lowercaseQuery) ||
    store.category.toLowerCase().includes(lowercaseQuery)
  );
};

// Helper function to filter stores
export const filterStores = (filters) => {
  let filtered = [...demoStores];

  if (filters.category) {
    filtered = filtered.filter(store => store.category.toLowerCase() === filters.category.toLowerCase());
  }

  if (filters.rating) {
    filtered = filtered.filter(store => store.rating >= parseInt(filters.rating));
  }

  if (filters.openNow) {
    filtered = filtered.filter(store => store.isOpen);
  }

  return filtered;
};

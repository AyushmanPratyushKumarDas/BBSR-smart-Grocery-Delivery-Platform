import { Link } from 'react-router-dom';
import { 
  Clock, 
  Shield, 
  CreditCard, 
  Star, 
  MapPin, 
  Plus,
  ShoppingCart,
  Truck,
  Users,
  Award
} from 'lucide-react';
import ApiTestComponent from '../components/ApiTestComponent';


const HomePage = () => {
  const features = [
    {
      icon: Clock,
      title: 'Fast Delivery',
      description: 'Get your groceries delivered within 30 minutes',
    },
    {
      icon: Shield,
      title: 'Quality Products',
      description: 'Fresh and high-quality products from local stores',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Multiple payment options with secure transactions',
    },
  ];

  const popularStores = [
    { id: 1, name: 'Fresh Mart', location: 'Khandagiri', rating: 4.5, image: '/stores/fresh-mart.jpg' },
    { id: 2, name: 'Organic Corner', location: 'Patia', rating: 4.8, image: '/stores/organic-corner.jpg' },
    { id: 3, name: 'Daily Groceries', location: 'Nayapalli', rating: 4.3, image: '/stores/daily-groceries.jpg' },
    { id: 4, name: 'Super Fresh', location: 'Saheed Nagar', rating: 4.6, image: '/stores/super-fresh.jpg' },
  ];

  const popularProducts = [
    { id: 1, name: 'Fresh Tomatoes', category: 'Vegetables', price: 49, image: '/products/tomatoes.jpg' },
    { id: 2, name: 'Organic Milk', category: 'Dairy', price: 65, image: '/products/milk.jpg' },
    { id: 3, name: 'Whole Wheat Bread', category: 'Bakery', price: 35, image: '/products/bread.jpg' },
    { id: 4, name: 'Fresh Apples', category: 'Fruits', price: 120, image: '/products/apples.jpg' },
    { id: 5, name: 'Basmati Rice', category: 'Grains', price: 85, image: '/products/rice.jpg' },
    { id: 6, name: 'Fresh Eggs', category: 'Dairy', price: 55, image: '/products/eggs.jpg' },
    { id: 7, name: 'Onions', category: 'Vegetables', price: 30, image: '/products/onions.jpg' },
    { id: 8, name: 'Bananas', category: 'Fruits', price: 40, image: '/products/bananas.jpg' },
  ];

  const stats = [
    { label: 'Happy Customers', value: '10,000+', icon: Users },
    { label: 'Products Available', value: '5,000+', icon: Award },
    { label: 'Delivery Partners', value: '200+', icon: Truck },
    { label: 'Cities Served', value: '1', icon: MapPin },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-12 mb-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            Fast Grocery Delivery in Bhubaneswar
          </h1>
          <p className="text-xl mb-8 text-green-100">
            Get your groceries delivered to your doorstep in minutes! 
            Fresh products from local stores, delivered with care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/products" 
              className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-flex items-center justify-center"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Start Shopping
            </Link>
            <Link 
              to="/stores" 
              className="border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-flex items-center justify-center"
            >
              <MapPin className="mr-2 h-5 w-5" />
              Find Stores
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex justify-center mb-4">
                <stat.icon className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We provide the best grocery delivery experience with quality products, 
            fast delivery, and excellent customer service.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <feature.icon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Stores Section */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Popular Stores</h2>
            <p className="text-gray-600">Discover the best grocery stores in your area</p>
          </div>
          <Link 
            to="/stores" 
            className="text-green-600 hover:text-green-700 font-semibold flex items-center"
          >
            View All Stores
            <Plus className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularStores.map((store) => (
            <div key={store.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-green-600" />
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{store.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{store.location}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex items-center text-yellow-400">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(store.rating) ? 'fill-current' : ''
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">({store.rating})</span>
                  </div>
                  <Link 
                    to={`/stores/${store.id}`}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    View Store
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Products Section */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Popular Products</h2>
            <p className="text-gray-600">Best-selling products from our partner stores</p>
          </div>
          <Link 
            to="/products" 
            className="text-green-600 hover:text-green-700 font-semibold flex items-center"
          >
            View All Products
            <Plus className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {popularProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                <ShoppingCart className="h-12 w-12 text-green-600" />
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{product.category}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-gray-900">₹{product.price}</span>
                  <button className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors duration-200">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* API Integration Test Section */}
      <section className="mt-16">
        <ApiTestComponent />
      </section>
    </div>
  );
};

export default HomePage;
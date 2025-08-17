import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storesAPI } from '../services/api';
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  Filter,
  Grid,
  List,
  Phone,
  Mail
} from 'lucide-react';


const StoresPage = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    rating: '',
    openNow: false,
    sortBy: 'name',
  });
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStores();
  }, [filters]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        search: searchQuery,
      };
      
      // Remove empty values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === false) {
          delete params[key];
        }
      });

      const response = await storesAPI.getAll(params);
      
      // Fix: Extract the stores array from the correct response structure
      if (response.data && response.data.success && response.data.data) {
        setStores(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback for direct array response
        setStores(response.data);
      } else {
        console.error('Unexpected response structure:', response);
        setStores([]);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStores();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      rating: '',
      openNow: false,
      sortBy: 'name',
    });
    setSearchQuery('');
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const isStoreOpen = (operatingHours) => {
    if (!operatingHours) return false;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const todayHours = operatingHours[currentDay];
    if (!todayHours || !todayHours.open || !todayHours.close) return false;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  const getStoreStatus = (operatingHours) => {
    if (isStoreOpen(operatingHours)) {
      return { text: 'Open Now', color: 'text-green-600', bg: 'bg-green-100' };
    }
    return { text: 'Closed', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (viewMode === 'list') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Stores</h1>
          <p className="text-gray-600">
            Discover local stores and get fresh groceries delivered to your doorstep
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Clear all
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search stores..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </form>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Category</h3>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="grocery">Grocery</option>
                  <option value="supermarket">Supermarket</option>
                  <option value="convenience">Convenience Store</option>
                  <option value="organic">Organic Store</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Rating</h3>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Ratings</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>

              {/* Open Now Filter */}
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    id="openNow"
                    type="checkbox"
                    checked={filters.openNow}
                    onChange={(e) => handleFilterChange('openNow', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="openNow" className="ml-2 text-sm text-gray-900">
                    Open Now
                  </label>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Sort By</h3>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="name">Name</option>
                  <option value="rating">Rating</option>
                  <option value="distance">Distance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stores List */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {stores.length} stores found
                </span>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid'
                      ? 'bg-green-100 text-green-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list'
                      ? 'bg-green-100 text-green-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Stores */}
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                    <div className="flex gap-6">
                      <div className="bg-gray-200 w-32 h-32 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-gray-200 h-6 rounded w-1/3"></div>
                        <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                        <div className="bg-gray-200 h-4 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : stores.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
                <p className="text-gray-600">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stores.map((store) => {
                  const status = getStoreStatus(store.operatingHours);
                  return (
                    <div key={store.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                      <div className="flex gap-6">
                        {/* Store Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={store.logo || '/placeholder-store.jpg'}
                            alt={store.name}
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        </div>

                        {/* Store Info */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                <Link to={`/stores/${store.id}`} className="hover:text-green-600">
                                  {store.name}
                                </Link>
                              </h3>
                              <p className="text-gray-600 mb-2">{store.description}</p>
                              <div className="flex items-center space-x-4 mb-3">
                                <div className="flex items-center">
                                  {renderStars(store.rating)}
                                  <span className="ml-1 text-sm text-gray-600">({store.rating})</span>
                                </div>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-600">{store.category}</span>
                                <span className="text-gray-400">•</span>
                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
                                  {status.text}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Contact & Location */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span>{store.address?.street}, {store.address?.city}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span>{store.phone}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Mail className="h-4 w-4" />
                                <span>{store.email}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span>Open: {store.operatingHours?.monday?.open || 'N/A'} - {store.operatingHours?.monday?.close || 'N/A'}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Delivery Time: {store.estimatedDeliveryTime || '30-45 min'}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-3 mt-4">
                            <div className="flex w-full">
                              <Link
                                to={`/stores/${store.id}`}
                                className="flex items-center justify-center px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full"
                              >
                                View Store
                              </Link>
                            </div>
                            <Link
                              to={`/stores/${store.id}/products`}
                              className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                            >
                              Browse Products
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Stores</h1>
        <p className="text-gray-600">
          Discover local stores and get fresh groceries delivered to your doorstep
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Clear all
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search stores..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </form>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Category</h3>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="grocery">Grocery</option>
                <option value="supermarket">Supermarket</option>
                <option value="convenience">Convenience Store</option>
                <option value="organic">Organic Store</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Rating</h3>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Ratings</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
              </select>
            </div>

            {/* Open Now Filter */}
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  id="openNow"
                  type="checkbox"
                  checked={filters.openNow}
                  onChange={(e) => handleFilterChange('openNow', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="openNow" className="ml-2 text-sm text-gray-900">
                  Open Now
                </label>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Sort By</h3>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="rating">Rating</option>
                <option value="distance">Distance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stores Grid */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {stores.length} stores found
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-green-100 text-green-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list'
                    ? 'bg-green-100 text-green-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Stores */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="bg-gray-200 h-4 rounded"></div>
                    <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                    <div className="bg-gray-200 h-6 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : !Array.isArray(stores) || stores.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
              <p className="text-gray-600">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => {
                const status = getStoreStatus(store.operatingHours);
                return (
                  <div key={store.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow group">
                    {/* Store Image */}
                    <div className="relative">
                      <img
                        src={store.logo || '/placeholder-store.jpg'}
                        alt={store.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                    </div>

                    {/* Store Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        <Link to={`/stores/${store.id}`} className="hover:text-green-600">
                          {store.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{store.description}</p>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        {renderStars(store.rating)}
                        <span className="text-sm text-gray-600">({store.rating})</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{store.category}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{store.address?.street}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Link
                          to={`/stores/${store.id}`}
                          className="flex-1 text-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          View Store
                        </Link>
                        <Link
                          to={`/stores/${store.id}/products`}
                          className="flex-1 text-center px-3 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm"
                        >
                          Browse Products
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoresPage;

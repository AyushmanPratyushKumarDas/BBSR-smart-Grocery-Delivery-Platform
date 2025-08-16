import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import useCartStore from '../../store/cartStore';

const ProductCard = ({ product, viewMode = 'grid', onAddToCart }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { isInCart, getItemQuantity, updateQuantity } = useCartStore();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
  };

  const handleQuantityChange = (e, newQuantity) => {
    e.preventDefault();
    e.stopPropagation();
    if (newQuantity > 0) {
      updateQuantity(product.id, newQuantity);
    }
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

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
        <div className="flex gap-6">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <img
              src={product.image || '/placeholder-product.jpg'}
              alt={product.name}
              className="w-32 h-32 object-cover rounded-lg"
            />
          </div>

          {/* Product Info */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  <Link to={`/products/${product.id}`} className="hover:text-green-600">
                    {product.name}
                  </Link>
                </h3>
                <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center">
                    {renderStars(product.rating)}
                    <span className="ml-1 text-sm text-gray-600">({product.rating})</span>
                  </div>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600">{product.store?.name}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-2 rounded-full ${
                    isWishlisted
                      ? 'text-red-500 bg-red-50'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                  } transition-colors`}
                >
                  <Heart className="h-5 w-5" />
                </button>
                <Link
                  to={`/products/${product.id}`}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Eye className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-gray-900">
                  ₹{product.price}
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="text-lg text-gray-500 line-through">
                    ₹{product.originalPrice}
                  </div>
                )}
                {product.stock > 0 ? (
                  <span className="text-sm text-green-600 font-medium">In Stock</span>
                ) : (
                  <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {isInCart(product.id) ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleQuantityChange(e, getItemQuantity(product.id) - 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{getItemQuantity(product.id)}</span>
                    <button
                      onClick={(e) => handleQuantityChange(e, getItemQuantity(product.id) + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Add to Cart</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow group">
      {/* Product Image */}
      <div className="relative">
        <img
          src={product.image || '/placeholder-product.jpg'}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Quick Actions */}
        <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`p-2 rounded-full shadow-lg ${
              isWishlisted
                ? 'text-red-500 bg-white'
                : 'text-gray-600 bg-white hover:text-red-500'
            } transition-colors`}
          >
            <Heart className="h-4 w-4" />
          </button>
          <Link
            to={`/products/${product.id}`}
            className="p-2 rounded-full shadow-lg text-gray-600 bg-white hover:text-gray-900 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>

        {/* Stock Badge */}
        {product.stock === 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Out of Stock
          </div>
        )}

        {/* Discount Badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            <Link to={`/products/${product.id}`} className="hover:text-green-600">
              {product.name}
            </Link>
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
        </div>

        {/* Store Name */}
        <div className="text-sm text-gray-500 mb-2">{product.store?.name}</div>

        {/* Rating */}
        <div className="flex items-center space-x-1 mb-3">
          {renderStars(product.rating)}
          <span className="text-sm text-gray-600">({product.rating})</span>
        </div>

        {/* Price */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
          )}
        </div>

        {/* Add to Cart */}
        <div className="flex items-center space-x-2">
          {isInCart(product.id) ? (
            <div className="flex items-center space-x-2 w-full">
              <button
                onClick={(e) => handleQuantityChange(e, getItemQuantity(product.id) - 1)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                -
              </button>
              <span className="flex-1 text-center">{getItemQuantity(product.id)}</span>
              <button
                onClick={(e) => handleQuantityChange(e, getItemQuantity(product.id) + 1)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useCartStore from '../store/cartStore';
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  Truck,
  Shield,
  CreditCard,
  ShoppingCart
} from 'lucide-react';


const CartPage = () => {
  const { items, total, itemCount, removeItem, updateQuantity, clearCart, addItem } = useCartStore();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setIsUpdating(true);
    try {
      updateQuantity(productId, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = (productId) => {
    removeItem(productId);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    navigate('/checkout');
  };

  const deliveryFee = total > 500 ? 0 : 50;
  const finalTotal = total + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Start Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
        
        {/* Suggested Products */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">You might also like</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: 1, name: 'Fresh Tomatoes', category: 'Vegetables', price: 49 },
              { id: 2, name: 'Organic Milk', category: 'Dairy', price: 65 },
              { id: 3, name: 'Whole Wheat Bread', category: 'Bakery', price: 35 },
              { id: 4, name: 'Fresh Apples', category: 'Fruits', price: 120 },
            ].map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                  <ShoppingCart className="h-12 w-12 text-green-600" />
                </div>
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h4>
                  <p className="text-gray-600 text-sm mb-3">{product.category}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-gray-900">₹{product.price}</span>
                    <button 
                      onClick={() => addItem(product, 1)}
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="text-gray-600 mt-2">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
                <button
                  onClick={clearCart}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.image || '/placeholder-product.jpg'}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            <Link to={`/products/${item.id}`} className="hover:text-green-600">
                              {item.name}
                            </Link>
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <p className="text-sm text-gray-500">{item.store?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ₹{item.price * item.quantity}
                          </p>
                          <p className="text-sm text-gray-500">₹{item.price} each</p>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">Quantity:</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={isUpdating}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={isUpdating || item.quantity >= item.stock}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          {item.stock < item.quantity && (
                            <span className="text-sm text-red-600">
                              Only {item.stock} available
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                <span className="font-medium">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">
                  {deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              {deliveryFee > 0 && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                  Add ₹{(500 - total).toFixed(2)} more for free delivery
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={items.length === 0}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CreditCard className="h-5 w-5" />
              <span>Proceed to Checkout</span>
            </button>

            {/* Features */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Truck className="h-4 w-4 text-green-600" />
                <span>Fast delivery within 2 hours</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Quality guaranteed</span>
              </div>
            </div>

            {/* Continue Shopping */}
            <div className="mt-6 pt-6 border-t">
              <Link
                to="/products"
                className="flex items-center justify-center space-x-2 text-green-600 hover:text-green-700 font-medium"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Viewed (Optional) */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h2>
        {/* Recently viewed products component would go here */}
        <div className="text-center py-8">
          <p className="text-gray-600">Recently viewed products coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.id === product.id);
          
          if (existingItem) {
            // Update quantity if item already exists
            const updatedItems = state.items.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
            
            const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
            
            return {
              items: updatedItems,
              total: newTotal,
              itemCount: newItemCount,
            };
          } else {
            // Add new item
            const newItem = {
              ...product,
              quantity,
            };
            
            const newItems = [...state.items, newItem];
            const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
            
            return {
              items: newItems,
              total: newTotal,
              itemCount: newItemCount,
            };
          }
        });
      },

      removeItem: (productId) => {
        set((state) => {
          const updatedItems = state.items.filter(item => item.id !== productId);
          const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          
          return {
            items: updatedItems,
            total: newTotal,
            itemCount: newItemCount,
          };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return get().removeItem(productId);
          }
          
          const updatedItems = state.items.map(item =>
            item.id === productId ? { ...item, quantity } : item
          );
          
          const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          
          return {
            items: updatedItems,
            total: newTotal,
            itemCount: newItemCount,
          };
        });
      },

      clearCart: () => {
        set({
          items: [],
          total: 0,
          itemCount: 0,
        });
      },

      getItemQuantity: (productId) => {
        const state = get();
        const item = state.items.find(item => item.id === productId);
        return item ? item.quantity : 0;
      },

      isInCart: (productId) => {
        const state = get();
        return state.items.some(item => item.id === productId);
      },
    }),
    {
      name: 'cart-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useCartStore;

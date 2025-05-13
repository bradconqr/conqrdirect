import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../types';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

interface CartState {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      
      addToCart: (product) => set((state) => {
        const existingItem = state.cartItems.find(item => item.product.id === product.id);
        
        if (existingItem) {
          return {
            cartItems: state.cartItems.map(item => 
              item.product.id === product.id 
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          };
        }
        
        return {
          cartItems: [...state.cartItems, { id: product.id, product, quantity: 1 }]
        };
      }),
      
      removeFromCart: (productId) => set((state) => ({
        cartItems: state.cartItems.filter(item => item.product.id !== productId)
      })),
      
      updateQuantity: (productId, quantity) => set((state) => ({
        cartItems: state.cartItems.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: Math.max(1, quantity) }
            : item
        )
      })),
      
      clearCart: () => set({ cartItems: [] }),
      
      getTotalItems: () => {
        return get().cartItems.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().cartItems.reduce((total, item) => {
          const price = item.product.discountPrice || item.product.price;
          return total + (price * item.quantity);
        }, 0);
      }
    }),
    {
      name: 'cart-storage',
    }
  )
);
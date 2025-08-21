import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  trackingNumber?: string;
}

interface AppState {
  // Cart state
  cart: CartItem[];
  cartTotal: number;

  // Wishlist state
  wishlist: WishlistItem[];

  // Orders state
  orders: Order[];

  // UI state
  isLoading: boolean;
  searchQuery: string;
  selectedCategory: string;

  // Actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  addOrder: (order: Order) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  updateCartItemPrice: (id: string, newPrice: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      cart: [],
      cartTotal: 0,
      wishlist: [],
      orders: [],
      isLoading: false,
      searchQuery: '',
      selectedCategory: '',

      // Actions
      addToCart: (item) => {
        const { cart } = get();
        const existingItem = cart.find(cartItem => cartItem.id === item.id);

        if (existingItem) {
          const updatedCart = cart.map(cartItem =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem
          );
          set({
            cart: updatedCart,
            cartTotal: updatedCart.reduce((total, item) => total + (item.price * item.quantity), 0)
          });
        } else {
          const updatedCart = [...cart, item];
          set({
            cart: updatedCart,
            cartTotal: updatedCart.reduce((total, item) => total + (item.price * item.quantity), 0)
          });
        }
      },

      removeFromCart: (id) => {
        const { cart } = get();
        const updatedCart = cart.filter(item => item.id !== id);
        set({
          cart: updatedCart,
          cartTotal: updatedCart.reduce((total, item) => total + (item.price * item.quantity), 0)
        });
      },

      updateCartQuantity: (id, quantity) => {
        const { cart } = get();
        if (quantity <= 0) {
          get().removeFromCart(id);
          return;
        }

        const updatedCart = cart.map(item =>
          item.id === id ? { ...item, quantity } : item
        );
        set({
          cart: updatedCart,
          cartTotal: updatedCart.reduce((total, item) => total + (item.price * item.quantity), 0)
        });
      },

      clearCart: () => set({ cart: [], cartTotal: 0 }),

      addToWishlist: (item) => {
        const { wishlist } = get();
        const exists = wishlist.find(wishlistItem => wishlistItem.id === item.id);
        if (!exists) {
          set({ wishlist: [...wishlist, item] });
        }
      },

      removeFromWishlist: (id) => {
        const { wishlist } = get();
        set({ wishlist: wishlist.filter(item => item.id !== id) });
      },

      addOrder: (order) => {
        const { orders } = get();
        set({ orders: [order, ...orders] });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

      updateCartItemPrice: (id, newPrice) => {
        const { cart } = get();
        const updatedCart = cart.map(item =>
          item.id === id ? { ...item, price: newPrice } : item
        );
        set({
          cart: updatedCart,
          cartTotal: updatedCart.reduce((total, item) => total + (item.price * item.quantity), 0)
        });
      },
    }),
    {
      name: 'bubblebeads-store',
      partialize: (state) => ({
        cart: state.cart,
        cartTotal: state.cartTotal,
        wishlist: state.wishlist,
        orders: state.orders,
      }),
    }
  )
);
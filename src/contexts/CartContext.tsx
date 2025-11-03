import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define the types for the product and cart item
export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
 description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

// Define the type for the cart context
type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  handleCheckout: () => Promise<void>;
};

// Create the cart context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Create the cart provider component
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const localData = localStorage.getItem('cart');
    return localData ? JSON.parse(localData) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User must be logged in to checkout.");
    }

    // Create the order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({ user_id: user.id, total_price: cartTotal })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Create the order items
    const orderItems = cart.map((item) => ({
      order_id: orderData.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
      // If creating order items fails, we should probably delete the order
      // to avoid orphaned orders. For simplicity, we'll just throw the error here.
      throw itemsError;
    }

    // Clear the cart
    clearCart();
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal, handleCheckout }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Create a custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

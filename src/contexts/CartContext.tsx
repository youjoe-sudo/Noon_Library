// سياق السلة لمكتبة نون (Cart Context for Noon Library)
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getCart, addToCart as apiAddToCart, updateCartItem, removeFromCart as apiRemoveFromCart, clearCart as apiClearCart } from '@/db/api';
import type { CartItem } from '@/types';
import { toast } from '@/hooks/use-toast';

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  addToCart: (bookId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // حساب عدد العناصر والمجموع (Calculate cart count and total)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => {
    const price = item.books?.discount_price || item.books?.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  // تحميل السلة (Load cart)
  const refreshCart = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }

    try {
      setLoading(true);
      const items = await getCart(user.id);
      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل السلة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // إضافة إلى السلة (Add to cart)
  const addToCart = async (bookId: string, quantity: number = 1) => {
    if (!user) {
      toast({
        title: 'تسجيل الدخول مطلوب',
        description: 'يرجى تسجيل الدخول لإضافة الكتب إلى السلة',
        variant: 'destructive',
      });
      return;
    }

    try {
      await apiAddToCart(user.id, bookId, quantity);
      await refreshCart();
      toast({
        title: 'تمت الإضافة',
        description: 'تم إضافة الكتاب إلى السلة بنجاح',
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إضافة الكتاب إلى السلة',
        variant: 'destructive',
      });
    }
  };

  // تحديث الكمية (Update quantity)
  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;

    try {
      await updateCartItem(cartItemId, quantity);
      await refreshCart();
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحديث الكمية',
        variant: 'destructive',
      });
    }
  };

  // حذف عنصر (Remove item)
  const removeItem = async (cartItemId: string) => {
    try {
      await apiRemoveFromCart(cartItemId);
      await refreshCart();
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الكتاب من السلة',
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حذف الكتاب من السلة',
        variant: 'destructive',
      });
    }
  };

  // مسح السلة (Clear cart)
  const clearCart = async () => {
    if (!user) return;

    try {
      await apiClearCart(user.id);
      setCartItems([]);
      toast({
        title: 'تم المسح',
        description: 'تم مسح السلة بنجاح',
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: 'خطأ',
        description: 'فشل مسح السلة',
        variant: 'destructive',
      });
    }
  };

  // تحميل السلة عند تسجيل الدخول (Load cart on login)
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

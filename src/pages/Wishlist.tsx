// صفحة قائمة الأمنيات (Wishlist Page)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { getWishlist, removeFromWishlist } from '@/db/api';
import type { WishlistItem } from '@/types';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';

export default function Wishlist() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWishlist();
    }
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getWishlist(user.id);
      setWishlistItems(data);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!user) return;
    try {
      await removeFromWishlist(user.id, itemId);
      setWishlistItems(wishlistItems.filter(item => item.id !== itemId));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الكتاب من قائمة الأمنيات',
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حذف الكتاب',
        variant: 'destructive',
      });
    }
  };

  const handleAddToCart = async (bookId: string) => {
    await addToCart(bookId, 1);
  };

  if (!user) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4 text-center">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-4" dir="rtl">يرجى تسجيل الدخول</h2>
          <p className="text-muted-foreground mb-6" dir="rtl">
            يجب تسجيل الدخول لعرض قائمة الأمنيات
          </p>
          <Button onClick={() => navigate('/login')}>
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8" dir="rtl">قائمة الأمنيات ❤️</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="aspect-[3/4] mb-4 bg-muted" />
                  <Skeleton className="h-6 w-3/4 mb-2 bg-muted" />
                  <Skeleton className="h-4 w-1/2 bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8" dir="rtl">قائمة الأمنيات ❤️</h1>
          <Card>
            <CardContent className="p-16 text-center">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2" dir="rtl">قائمة الأمنيات فارغة</h2>
              <p className="text-muted-foreground mb-6" dir="rtl">
                لم تقم بإضافة أي كتب إلى قائمة الأمنيات بعد
              </p>
              <Button onClick={() => navigate('/books')}>
                تصفح الكتب
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" dir="rtl">قائمة الأمنيات ❤️</h1>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'كتاب' : 'كتب'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item) => {
            const book = item.books;
            if (!book) return null;

            const finalPrice = book.discount_price || book.price;
            const hasDiscount = !!book.discount_price;

            return (
              <Card key={item.id} className="group relative overflow-hidden">
                <CardContent className="p-4">
                  {/* صورة الكتاب (Book Cover) */}
                  <div
                    className="aspect-[3/4] bg-muted rounded mb-4 cursor-pointer relative overflow-hidden"
                    onClick={() => navigate(`/books/${book.id}`)}
                  >
                    {book.cover_image ? (
                      <img
                        src={book.cover_image}
                        alt={book.title_ar}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground p-4">
                        <span className="text-4xl mb-2">📚</span>
                        <span className="text-xs text-center" dir="rtl">الأغلفة قيد الرفع</span>
                      </div>
                    )}
                    {hasDiscount && (
                      <Badge variant="destructive" className="absolute top-2 right-2">
                        خصم {Math.round(((book.price - finalPrice) / book.price) * 100)}%
                      </Badge>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* معلومات الكتاب (Book Info) */}
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">{book.category}</Badge>
                    <h3
                      className="font-semibold line-clamp-2 cursor-pointer hover:text-primary"
                      dir="rtl"
                      onClick={() => navigate(`/books/${book.id}`)}
                    >
                      {book.title_ar}
                    </h3>
                    <p className="text-sm text-muted-foreground" dir="rtl">
                      {book.author_ar}
                    </p>

                    {/* السعر (Price) */}
                    <div className="flex items-center gap-2" dir="rtl">
                      <span className="text-lg font-bold text-primary">
                        {finalPrice.toFixed(2)} ج.م
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-muted-foreground line-through">
                          {book.price.toFixed(2)} ج.م
                        </span>
                      )}
                    </div>

                    {/* حالة المخزون (Stock Status) */}
                    {book.stock > 0 ? (
                      <p className="text-xs text-success" dir="rtl">
                        ✓ متوفر في المخزون
                      </p>
                    ) : (
                      <p className="text-xs text-destructive" dir="rtl">
                        ✗ غير متوفر حالياً
                      </p>
                    )}

                    {/* الإجراءات (Actions) */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddToCart(book.id)}
                        disabled={book.stock === 0}
                      >
                        <ShoppingCart className="ml-2 h-4 w-4" />
                        أضف للسلة
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemove(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

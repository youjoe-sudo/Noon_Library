// صفحة تفاصيل الكتاب (Book Detail Page)
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { getBook, addToWishlist, removeFromWishlist, isInWishlist } from '@/db/api';
import type { Book } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      loadBook();
      if (user) {
        checkWishlist();
      }
    }
  }, [id, user]);

  const loadBook = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getBook(id);
      setBook(data);
    } catch (error) {
      console.error('Error loading book:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل تفاصيل الكتاب',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkWishlist = async () => {
    if (!user || !id) return;
    try {
      const exists = await isInWishlist(user.id, id);
      setInWishlist(exists);
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast({
        title: 'تسجيل الدخول مطلوب',
        description: 'يرجى تسجيل الدخول لإضافة الكتب إلى قائمة الأمنيات',
        variant: 'destructive',
      });
      return;
    }

    if (!id) return;

    try {
      if (inWishlist) {
        await removeFromWishlist(user.id, id);
        setInWishlist(false);
        toast({
          title: 'تم الحذف',
          description: 'تم حذف الكتاب من قائمة الأمنيات',
        });
      } else {
        await addToWishlist(user.id, id);
        setInWishlist(true);
        toast({
          title: 'تمت الإضافة',
          description: 'تم إضافة الكتاب إلى قائمة الأمنيات',
        });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحديث قائمة الأمنيات',
        variant: 'destructive',
      });
    }
  };

  const handleAddToCart = async () => {
    if (!id) return;
    await addToCart(id, quantity);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-10 w-32 mb-8 bg-muted" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-[3/4] bg-muted" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4 bg-muted" />
              <Skeleton className="h-6 w-1/2 bg-muted" />
              <Skeleton className="h-8 w-1/3 bg-muted" />
              <Skeleton className="h-32 w-full bg-muted" />
              <Skeleton className="h-12 w-full bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xl text-muted-foreground" dir="rtl">
            الكتاب غير موجود
          </p>
          <Button onClick={() => navigate('/books')} className="mt-4">
            العودة إلى الكتب
          </Button>
        </div>
      </div>
    );
  }

  const finalPrice = book.discount_price || book.price;
  const hasDiscount = !!book.discount_price;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* زر العودة (Back Button) */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* صورة الكتاب (Book Image) */}
          <div>
            <Card className="overflow-hidden">
              <div className="aspect-[3/4] bg-muted relative">
                {book.cover_image ? (
                  <img
                    src={book.cover_image}
                    alt={book.title_ar}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <span className="text-6xl">📚</span>
                  </div>
                )}
                {hasDiscount && (
                  <Badge variant="destructive" className="absolute top-4 right-4 text-lg px-4 py-2">
                    خصم {Math.round(((book.price - finalPrice) / book.price) * 100)}%
                  </Badge>
                )}
              </div>
            </Card>
          </div>

          {/* تفاصيل الكتاب (Book Details) */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-3">{book.category}</Badge>
              <h1 className="text-3xl font-bold mb-2" dir="rtl">
                {book.title_ar}
              </h1>
              <p className="text-xl text-muted-foreground" dir="rtl">
                {book.author_ar}
              </p>
            </div>

            <Separator />

            {/* السعر (Price) */}
            <div>
              <div className="flex items-center gap-3" dir="rtl">
                <span className="text-3xl font-bold text-primary">
                  {finalPrice.toFixed(2)} ج.م
                </span>
                {hasDiscount && (
                  <span className="text-xl text-muted-foreground line-through">
                    {book.price.toFixed(2)} ج.م
                  </span>
                )}
              </div>
              {book.stock > 0 ? (
                <p className="text-success mt-2" dir="rtl">
                  ✓ متوفر في المخزون ({book.stock} نسخة)
                </p>
              ) : (
                <p className="text-destructive mt-2" dir="rtl">
                  ✗ غير متوفر حالياً
                </p>
              )}
            </div>

            <Separator />

            {/* الوصف (Description) */}
            {book.description_ar && (
              <div>
                <h3 className="font-semibold text-lg mb-2" dir="rtl">الوصف</h3>
                <p className="text-muted-foreground leading-relaxed" dir="rtl">
                  {book.description_ar}
                </p>
              </div>
            )}

            <Separator />

            {/* معلومات إضافية (Additional Info) */}
            <Card>
              <CardContent className="p-4 space-y-2">
                {book.is_featured && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">⭐ مميز</Badge>
                  </div>
                )}
                {book.is_bestseller && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">🔥 الأكثر مبيعاً</Badge>
                  </div>
                )}
                {book.is_new && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">🆕 جديد</Badge>
                  </div>
                )}
                <p className="text-sm text-muted-foreground" dir="rtl">
                  💰 عمولة المسوق: {book.affiliate_commission_rate}%
                </p>
              </CardContent>
            </Card>

            {/* الإجراءات (Actions) */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={book.stock === 0}
                >
                  <ShoppingCart className="ml-2 h-5 w-5" />
                  أضف إلى السلة
                </Button>
                <Button
                  size="lg"
                  variant={inWishlist ? 'default' : 'outline'}
                  onClick={handleToggleWishlist}
                >
                  <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

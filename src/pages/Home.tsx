// الصفحة الرئيسية (Home Page)
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, TrendingUp, Sparkles, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getBooks } from '@/db/api';
import type { Book } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { recordTrackingClick } from '@/db/api';

export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [bestsellerBooks, setBestsellerBooks] = useState<Book[]>([]);
  const [newBooks, setNewBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
    handleTrackingLink();
  }, []);

  const handleTrackingLink = async () => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      try {
        const result = await recordTrackingClick(refCode);
        if (result?.success) {
          // حفظ كود التتبع في localStorage للاستخدام عند الشراء
          localStorage.setItem('affiliate_ref', refCode);
          toast({
            title: 'مرحباً بك! 🎉',
            description: 'تم تسجيل زيارتك عبر رابط المسوق',
          });
        }
      } catch (error) {
        console.error('Error recording tracking click:', error);
      }
    }
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      const [featured, bestsellers, newReleases] = await Promise.all([
        getBooks({ is_featured: true, limit: 4 }),
        getBooks({ is_bestseller: true, limit: 4 }),
        getBooks({ is_new: true, limit: 4 }),
      ]);
      setFeaturedBooks(featured.books);
      setBestsellerBooks(bestsellers.books);
      setNewBooks(newReleases.books);
    } catch (error) {
      console.error('Error loading books:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الكتب',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAddToCart = async (bookId: string) => {
    await addToCart(bookId, 1);
  };

  const BookCard = ({ book }: { book: Book }) => {
    const finalPrice = book.discount_price || book.price;
    const hasDiscount = !!book.discount_price;

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="p-0">
          <div className="aspect-[3/4] bg-muted relative overflow-hidden">
            {book.cover_image ? (
              <img
                src={book.cover_image}
                alt={book.title_ar}
                className="w-full h-full object-cover"
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
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1" dir="rtl">
            {book.title_ar}
          </h3>
          <p className="text-sm text-muted-foreground mb-3" dir="rtl">
            {book.author_ar}
          </p>
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
          {book.stock > 0 ? (
            <p className="text-xs text-success mt-1" dir="rtl">
              متوفر ({book.stock} نسخة)
            </p>
          ) : (
            <p className="text-xs text-destructive mt-1" dir="rtl">
              غير متوفر
            </p>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0 gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/books/${book.id}`)}
          >
            التفاصيل
          </Button>
          <Button
            className="flex-1"
            onClick={() => handleAddToCart(book.id)}
            disabled={book.stock === 0}
          >
            أضف للسلة
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const BookSkeleton = () => (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[3/4] bg-muted" />
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2 bg-muted" />
        <Skeleton className="h-4 w-1/2 mb-3 bg-muted" />
        <Skeleton className="h-6 w-1/3 bg-muted" />
      </CardContent>
      <CardFooter className="p-4 pt-0 gap-2">
        <Skeleton className="h-10 flex-1 bg-muted" />
        <Skeleton className="h-10 flex-1 bg-muted" />
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen">
      {/* قسم البطل (Hero Section) */}
      <section
        className="relative py-20 md:py-32 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://miaoda-site-img.s3cdn.medo.dev/images/KLing_be3bde04-bf79-479f-9cdc-4f599f55759c.jpg')`,
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" dir="rtl">
            كتابك الجاي على بُعد نقرة 📚
          </h1>
          <p className="text-xl text-white/90 mb-8" dir="rtl">
            اقرأها بطريقتك - اكتشف عالماً من المعرفة
          </p>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <Input
                type="search"
                placeholder="ابحث عن كتاب أو مؤلف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-white"
                dir="rtl"
              />
              <Button type="submit" size="lg">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* الأكثر مبيعاً (Bestsellers) */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold" dir="rtl">الأكثر مبيعاً 🔥</h2>
            </div>
            <Button variant="outline" onClick={() => navigate('/books?bestseller=true')}>
              عرض الكل
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <BookSkeleton key={i} />)
              : bestsellerBooks.map((book) => <BookCard key={book.id} book={book} />)}
          </div>
        </div>
      </section>

      {/* ترشيحات نون (Noon Recommendations) */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-accent" />
              <h2 className="text-3xl font-bold" dir="rtl">ترشيحات Noon 🎯</h2>
            </div>
            <Button variant="outline" onClick={() => navigate('/books?featured=true')}>
              عرض الكل
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <BookSkeleton key={i} />)
              : featuredBooks.map((book) => <BookCard key={book.id} book={book} />)}
          </div>
        </div>
      </section>

      {/* أحدث الإصدارات (New Releases) */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold" dir="rtl">أحدث الإصدارات 🆕</h2>
            </div>
            <Button variant="outline" onClick={() => navigate('/books?new=true')}>
              عرض الكل
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <BookSkeleton key={i} />)
              : newBooks.map((book) => <BookCard key={book.id} book={book} />)}
          </div>
        </div>
      </section>

      {/* دعوة للانضمام كمسوق (Affiliate CTA) */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <Award className="h-16 w-16 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4" dir="rtl">
            انضم كمسوق واربح عمولات مجزية 💰
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" dir="rtl">
            احصل على عمولة من كل عملية بيع تتم عبر رابطك الخاص. نظام عمولات ذكي مع مكافآت إضافية!
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate('/affiliate/register')}
          >
            ابدأ الآن
          </Button>
        </div>
      </section>
    </div>
  );
}

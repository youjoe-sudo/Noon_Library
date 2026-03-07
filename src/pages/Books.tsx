// صفحة قائمة الكتب (Books Listing Page)
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getBooks, getCategories } from '@/db/api';
import type { Book } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';

export default function Books() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadBooks();
  }, [searchParams, page]);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      const filters: any = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };

      const search = searchParams.get('search');
      const category = searchParams.get('category');
      const featured = searchParams.get('featured');
      const bestseller = searchParams.get('bestseller');
      const newBooks = searchParams.get('new');

      if (search) filters.search = search;
      if (category && category !== 'all') filters.category = category;
      if (featured === 'true') filters.is_featured = true;
      if (bestseller === 'true') filters.is_bestseller = true;
      if (newBooks === 'true') filters.is_new = true;

      const result = await getBooks(filters);
      setBooks(result.books);
      setTotalCount(result.count);
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
    const params = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    } else {
      params.delete('search');
    }
    setSearchParams(params);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    const params = new URLSearchParams(searchParams);
    if (value !== 'all') {
      params.set('category', value);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
    setPage(1);
  };

  const handleAddToCart = async (bookId: string) => {
    await addToCart(bookId, 1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const BookCard = ({ book }: { book: Book }) => {
    const finalPrice = book.discount_price || book.price;
    const hasDiscount = !!book.discount_price;

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="p-0">
          <div className="aspect-[3/4] bg-muted relative overflow-hidden cursor-pointer" onClick={() => navigate(`/books/${book.id}`)}>
            {book.cover_image ? (
              <img
                src={book.cover_image}
                alt={book.title_ar}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <span className="text-4xl">📚</span>
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
          <Badge variant="secondary" className="mb-2">{book.category}</Badge>
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
        <Skeleton className="h-5 w-20 mb-2 bg-muted" />
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
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* الفلاتر والبحث (Filters and Search) */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6" dir="rtl">تصفح الكتب</h1>
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Input
                type="search"
                placeholder="ابحث عن كتاب أو مؤلف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                dir="rtl"
              />
              <Button type="submit">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="ml-2 h-4 w-4" />
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* النتائج (Results) */}
        <div className="mb-6">
          <p className="text-muted-foreground" dir="rtl">
            {loading ? 'جاري التحميل...' : `${totalCount} كتاب`}
          </p>
        </div>

        {/* قائمة الكتب (Books Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {loading
            ? Array.from({ length: pageSize }).map((_, i) => <BookSkeleton key={i} />)
            : books.map((book) => <BookCard key={book.id} book={book} />)}
        </div>

        {/* الترقيم (Pagination) */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              السابق
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                صفحة {page} من {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              التالي
            </Button>
          </div>
        )}

        {/* لا توجد نتائج (No Results) */}
        {!loading && books.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground" dir="rtl">
              لم يتم العثور على كتب
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

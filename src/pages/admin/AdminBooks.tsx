// إدارة الكتب (Admin Books Management)
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { getAllBooks, updateBookStock, createBook, updateBook, deleteBook, uploadBookCover } from '@/db/api';
import type { Book } from '@/types';
import { Plus, Edit, Trash2, Search, Loader2, Upload, X } from 'lucide-react';

export default function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // حالة مربع الحوار (Dialog state)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  
  // بيانات النموذج (Form data)
  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    author_ar: '',
    author_en: '',
    publisher: '',
    isbn: '',
    category: '',
    description: '',
    price: '',
    discount_price: '',
    stock_quantity: '',
    affiliate_commission_rate: '10',
  });

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = books.filter(book =>
        book.title_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBooks(filtered);
    } else {
      setFilteredBooks(books);
    }
  }, [searchQuery, books]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await getAllBooks();
      setBooks(data);
      setFilteredBooks(data);
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

  const handleOpenDialog = (book?: Book) => {
    if (book) {
      // تعديل كتاب موجود
      setEditingBook(book);
      setFormData({
        title_ar: book.title_ar,
        title_en: '',
        author_ar: book.author_ar,
        author_en: '',
        publisher: '',
        isbn: '',
        category: book.category,
        description: book.description_ar || '',
        price: book.price.toString(),
        discount_price: book.discount_price?.toString() || '',
        stock_quantity: book.stock.toString(),
        affiliate_commission_rate: book.affiliate_commission_rate?.toString() || '10',
      });
      setCoverPreview(book.cover_image || '');
    } else {
      // إضافة كتاب جديد
      setEditingBook(null);
      setFormData({
        title_ar: '',
        title_en: '',
        author_ar: '',
        author_en: '',
        publisher: '',
        isbn: '',
        category: '',
        description: '',
        price: '',
        discount_price: '',
        stock_quantity: '',
        affiliate_commission_rate: '10',
      });
      setCoverPreview('');
    }
    setCoverFile(null);
    setDialogOpen(true);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار ملف صورة',
        variant: 'destructive',
      });
      return;
    }

    // التحقق من حجم الملف (حد أقصى 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'خطأ',
        description: 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت',
        variant: 'destructive',
      });
      return;
    }

    setCoverFile(file);
    
    // معاينة الصورة
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // التحقق من الحقول المطلوبة
    if (!formData.title_ar || !formData.author_ar || !formData.category || !formData.price || !formData.stock_quantity) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      let coverImageUrl = editingBook?.cover_image || '';
      
      // رفع صورة الغلاف إذا تم اختيار صورة جديدة
      if (coverFile) {
        coverImageUrl = await uploadBookCover(coverFile);
      }

      const bookData = {
        title_ar: formData.title_ar,
        author_ar: formData.author_ar,
        description_ar: formData.description || '',
        category: formData.category,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        stock: parseInt(formData.stock_quantity),
        affiliate_commission_rate: parseFloat(formData.affiliate_commission_rate),
        cover_image: coverImageUrl || null,
        is_featured: false,
        is_bestseller: false,
        is_new: true,
      };

      if (editingBook) {
        // تحديث كتاب موجود
        await updateBook(editingBook.id, bookData);
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الكتاب بنجاح',
        });
      } else {
        // إضافة كتاب جديد
        await createBook(bookData);
        toast({
          title: 'تم الإضافة',
          description: 'تم إضافة الكتاب بنجاح',
        });
      }

      setDialogOpen(false);
      loadBooks();
    } catch (error: any) {
      console.error('Error saving book:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل حفظ الكتاب',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكتاب؟')) return;

    try {
      await deleteBook(bookId);
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الكتاب بنجاح',
      });
      loadBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حذف الكتاب',
        variant: 'destructive',
      });
    }
  };

  const handleStockUpdate = async (bookId: string, newStock: number) => {
    try {
      await updateBookStock(bookId, newStock);
      setBooks(books.map(book => 
        book.id === bookId ? { ...book, stock: newStock } : book
      ));
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث المخزون بنجاح',
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحديث المخزون',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8" dir="rtl">إدارة الكتب</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2 bg-muted" />
                <Skeleton className="h-4 w-1/2 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold" dir="rtl">إدارة الكتب 📚</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة كتاب جديد
        </Button>
      </div>

      {/* البحث (Search) */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن كتاب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              dir="rtl"
            />
          </div>
        </CardContent>
      </Card>

      {/* قائمة الكتب (Books List) */}
      <div className="space-y-4">
        {filteredBooks.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <p className="text-muted-foreground" dir="rtl">
                لا توجد كتب
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBooks.map((book) => (
            <Card key={book.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* صورة الكتاب (Book Cover) */}
                  <div className="w-20 h-28 bg-muted rounded shrink-0">
                    {book.cover_image ? (
                      <img
                        src={book.cover_image}
                        alt={book.title_ar}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <span className="text-2xl">📚</span>
                      </div>
                    )}
                  </div>

                  {/* معلومات الكتاب (Book Info) */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg" dir="rtl">{book.title_ar}</h3>
                        <p className="text-sm text-muted-foreground" dir="rtl">{book.author_ar}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenDialog(book)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(book.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary">{book.category}</Badge>
                      {book.is_featured && <Badge>مميز</Badge>}
                      {book.is_bestseller && <Badge variant="destructive">الأكثر مبيعاً</Badge>}
                      {book.is_new && <Badge variant="outline">جديد</Badge>}
                      {book.stock === 0 && <Badge variant="destructive">نفذ من المخزون</Badge>}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground" dir="rtl">السعر:</p>
                        <p className="font-semibold" dir="rtl">
                          {book.discount_price ? (
                            <>
                              <span className="text-primary">{book.discount_price.toFixed(2)}</span>
                              <span className="line-through text-muted-foreground ml-2">{book.price.toFixed(2)}</span>
                            </>
                          ) : (
                            <span>{book.price.toFixed(2)} ج.م</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground" dir="rtl">المخزون:</p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={book.stock}
                            onChange={(e) => handleStockUpdate(book.id, parseInt(e.target.value) || 0)}
                            className="w-20 h-8"
                            min="0"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground" dir="rtl">عمولة المسوق:</p>
                        <p className="font-semibold">{book.affiliate_commission_rate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground" dir="rtl">تاريخ الإضافة:</p>
                        <p className="font-semibold">
                          {new Date(book.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* الإحصائيات (Statistics) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle dir="rtl">إحصائيات الكتب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground" dir="rtl">إجمالي الكتب:</p>
              <p className="text-2xl font-bold">{books.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground" dir="rtl">متوفر:</p>
              <p className="text-2xl font-bold text-success">
                {books.filter(b => b.stock > 0).length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground" dir="rtl">نفذ من المخزون:</p>
              <p className="text-2xl font-bold text-destructive">
                {books.filter(b => b.stock === 0).length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground" dir="rtl">الكتب المميزة:</p>
              <p className="text-2xl font-bold">
                {books.filter(b => b.is_featured).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مربع حوار إضافة/تعديل كتاب (Add/Edit Book Dialog) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle dir="rtl">
              {editingBook ? 'تعديل كتاب' : 'إضافة كتاب جديد'}
            </DialogTitle>
            <DialogDescription dir="rtl">
              {editingBook ? 'قم بتعديل بيانات الكتاب' : 'أدخل بيانات الكتاب الجديد'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* صورة الغلاف (Cover Image) */}
            <div>
              <Label dir="rtl">صورة الغلاف *</Label>
              <div className="mt-2 space-y-3">
                {coverPreview && (
                  <div className="relative w-32 h-40 border rounded-md overflow-hidden">
                    <img
                      src={coverPreview}
                      alt="معاينة الغلاف"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview('');
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1" dir="rtl">
                    حجم الصورة: حد أقصى 2 ميجابايت
                  </p>
                </div>
              </div>
            </div>

            {/* العنوان بالعربية (Title in Arabic) */}
            <div>
              <Label htmlFor="title_ar" dir="rtl">العنوان بالعربية *</Label>
              <Input
                id="title_ar"
                value={formData.title_ar}
                onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                dir="rtl"
                placeholder="أدخل عنوان الكتاب بالعربية"
              />
            </div>

            {/* المؤلف بالعربية (Author in Arabic) */}
            <div>
              <Label htmlFor="author_ar" dir="rtl">المؤلف بالعربية *</Label>
              <Input
                id="author_ar"
                value={formData.author_ar}
                onChange={(e) => setFormData({ ...formData, author_ar: e.target.value })}
                dir="rtl"
                placeholder="أدخل اسم المؤلف بالعربية"
              />
            </div>

            {/* التصنيف (Category) */}
            <div>
              <Label htmlFor="category" dir="rtl">التصنيف *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger dir="rtl">
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="أدب">أدب</SelectItem>
                  <SelectItem value="علوم">علوم</SelectItem>
                  <SelectItem value="تاريخ">تاريخ</SelectItem>
                  <SelectItem value="فلسفة">فلسفة</SelectItem>
                  <SelectItem value="دين">دين</SelectItem>
                  <SelectItem value="تنمية بشرية">تنمية بشرية</SelectItem>
                  <SelectItem value="أطفال">أطفال</SelectItem>
                  <SelectItem value="روايات">روايات</SelectItem>
                  <SelectItem value="شعر">شعر</SelectItem>
                  <SelectItem value="سياسة">سياسة</SelectItem>
                  <SelectItem value="اقتصاد">اقتصاد</SelectItem>
                  <SelectItem value="تكنولوجيا">تكنولوجيا</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* الوصف (Description) */}
            <div>
              <Label htmlFor="description" dir="rtl">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                dir="rtl"
                rows={4}
                placeholder="وصف مختصر عن الكتاب"
              />
            </div>

            {/* السعر والخصم (Price and Discount) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" dir="rtl">السعر (ج.م) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="discount_price" dir="rtl">سعر الخصم (ج.م)</Label>
                <Input
                  id="discount_price"
                  type="number"
                  step="0.01"
                  value={formData.discount_price}
                  onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* الكمية ونسبة العمولة (Stock and Commission) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock_quantity" dir="rtl">الكمية المتوفرة *</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="affiliate_commission_rate" dir="rtl">نسبة عمولة المسوقين (%)</Label>
                <Input
                  id="affiliate_commission_rate"
                  type="number"
                  step="0.1"
                  value={formData.affiliate_commission_rate}
                  onChange={(e) => setFormData({ ...formData, affiliate_commission_rate: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                editingBook ? 'تحديث' : 'إضافة'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

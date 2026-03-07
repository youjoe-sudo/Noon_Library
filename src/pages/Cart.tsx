// صفحة السلة (Cart Page)
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, updateQuantity, removeItem, clearCart, loading } = useCart();

  if (!user) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-4" dir="rtl">
            يرجى تسجيل الدخول
          </h2>
          <p className="text-muted-foreground mb-6" dir="rtl">
            يجب تسجيل الدخول لعرض السلة
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
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-4" dir="rtl">
            السلة فارغة
          </h2>
          <p className="text-muted-foreground mb-6" dir="rtl">
            لم تقم بإضافة أي كتب إلى السلة بعد
          </p>
          <Button onClick={() => navigate('/books')}>
            تصفح الكتب
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8" dir="rtl">
          سلة التسوق 🛒
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* عناصر السلة (Cart Items) */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const book = item.books;
              if (!book) return null;

              const finalPrice = book.discount_price || book.price;
              const itemTotal = finalPrice * item.quantity;

              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* صورة الكتاب (Book Image) */}
                      <div
                        className="w-24 h-32 bg-muted rounded cursor-pointer shrink-0"
                        onClick={() => navigate(`/books/${book.id}`)}
                      >
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

                      {/* تفاصيل الكتاب (Book Details) */}
                      <div className="flex-1">
                        <h3
                          className="font-semibold text-lg mb-1 cursor-pointer hover:text-primary"
                          dir="rtl"
                          onClick={() => navigate(`/books/${book.id}`)}
                        >
                          {book.title_ar}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2" dir="rtl">
                          {book.author_ar}
                        </p>
                        <p className="text-lg font-bold text-primary" dir="rtl">
                          {finalPrice.toFixed(2)} ج.م
                        </p>
                      </div>

                      {/* التحكم بالكمية (Quantity Control) */}
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <div className="flex items-center gap-2 border rounded">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= book.stock}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm font-semibold" dir="rtl">
                          المجموع: {itemTotal.toFixed(2)} ج.م
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Button variant="outline" onClick={clearCart} className="w-full">
              <Trash2 className="ml-2 h-4 w-4" />
              مسح السلة
            </Button>
          </div>

          {/* ملخص الطلب (Order Summary) */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle dir="rtl">ملخص الطلب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between" dir="rtl">
                  <span>المجموع الفرعي:</span>
                  <span className="font-semibold">{cartTotal.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground" dir="rtl">
                  <span>الشحن:</span>
                  <span>يحسب عند الدفع</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold" dir="rtl">
                  <span>الإجمالي:</span>
                  <span className="text-primary">{cartTotal.toFixed(2)} ج.م</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/checkout')}
                >
                  إتمام الطلب
                </Button>
              </CardFooter>
            </Card>

            <Card className="mt-4">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground" dir="rtl">
                  💡 <strong>نصيحة:</strong> احصل على شحن مجاني عند الطلب بقيمة 500 ج.م أو أكثر!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

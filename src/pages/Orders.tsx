// صفحة الطلبات (Orders Page)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserOrders } from '@/db/api';
import type { Order } from '@/types';
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getUserOrders(user.id);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { label: 'معلق', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
      pending_payment: { label: 'انتظار الدفع', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      awaiting_review: { label: 'قيد المراجعة', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      payment_rejected: { label: 'رُفض الدفع', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
      confirmed: { label: 'مؤكد', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      preparing: { label: 'قيد التحضير', variant: 'default', icon: <Package className="h-3 w-3" /> },
      shipped: { label: 'تم الشحن', variant: 'default', icon: <Truck className="h-3 w-3" /> },
      delivered: { label: 'تم التوصيل', variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
      cancelled: { label: 'ملغي', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
    };

    const statusInfo = statusMap[status] || statusMap.awaiting_review;
    return (
      <Badge variant={statusInfo.variant} className="gap-1">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      deposit: 'عربون',
      full_payment: 'دفع كامل',
      online: 'دفع إلكتروني',
    };
    return methodMap[method] || method;
  };

  const getShippingMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      express: 'شحن سريع',
      postal: 'بريد عادي',
    };
    return methodMap[method] || method;
  };

  if (!user) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4" dir="rtl">يرجى تسجيل الدخول</h2>
          <Button onClick={() => navigate('/login')}>تسجيل الدخول</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8" dir="rtl">طلباتي</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-1/3 mb-4 bg-muted" />
                  <Skeleton className="h-4 w-1/2 mb-2 bg-muted" />
                  <Skeleton className="h-4 w-1/4 bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8" dir="rtl">طلباتي</h1>
          <Card>
            <CardContent className="p-16 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2" dir="rtl">لا توجد طلبات</h2>
              <p className="text-muted-foreground mb-6" dir="rtl">
                لم تقم بأي طلبات بعد
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
        <h1 className="text-3xl font-bold mb-8" dir="rtl">طلباتي 📦</h1>

        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg" dir="rtl">
                      طلب رقم: {order.order_number}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground" dir="rtl">
                      {new Date(order.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* عناصر الطلب (Order Items) */}
                <div className="space-y-2">
                  {order.order_items?.map((item) => {
                    const book = item.books;
                    if (!book) return null;
                    return (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-16 h-20 bg-muted rounded shrink-0">
                          {book.cover_image ? (
                            <img
                              src={book.cover_image}
                              alt={book.title_ar}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <span className="text-xl">📚</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold" dir="rtl">{book.title_ar}</h4>
                          <p className="text-sm text-muted-foreground" dir="rtl">
                            الكمية: {item.quantity} × {item.price.toFixed(2)} ج.م
                          </p>
                        </div>
                        <div className="font-semibold" dir="rtl">
                          {(item.quantity * item.price).toFixed(2)} ج.م
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* تفاصيل الطلب (Order Details) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground" dir="rtl">طريقة الدفع:</p>
                    <p className="font-semibold" dir="rtl">{getPaymentMethodLabel(order.payment_method)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground" dir="rtl">طريقة الشحن:</p>
                    <p className="font-semibold" dir="rtl">{getShippingMethodLabel(order.shipping_method)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground" dir="rtl">تكلفة الشحن:</p>
                    <p className="font-semibold" dir="rtl">
                      {order.shipping_cost === 0 ? 'مجاني' : `${order.shipping_cost.toFixed(2)} ج.م`}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground" dir="rtl">الإجمالي:</p>
                    <p className="font-semibold text-primary text-lg" dir="rtl">
                      {order.total_amount.toFixed(2)} ج.م
                    </p>
                  </div>
                </div>

                {/* عنوان التوصيل (Shipping Address) */}
                {(order.addresses || order.guest_address) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1" dir="rtl">عنوان التوصيل:</p>
                      {order.addresses ? (
                        <p className="text-sm" dir="rtl">
                          {order.addresses.full_name} - {order.addresses.phone}<br />
                          {order.addresses.street}, {order.addresses.city}, {order.addresses.governorate}
                        </p>
                      ) : (
                        <p className="text-sm" dir="rtl">
                          {order.guest_name} - {order.guest_phone}<br />
                          {order.guest_address}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* ملاحظات (Notes) */}
                {order.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1" dir="rtl">ملاحظات:</p>
                      <p className="text-sm" dir="rtl">{order.notes}</p>
                    </div>
                  </>
                )}

                {/* زر دفع العربون (Payment Button) */}
                {order.status === 'pending_payment' && (
                  <>
                    <Separator />
                    <Button
                      onClick={() => window.location.href = `/payment/${order.id}`}
                      className="w-full"
                      size="lg"
                    >
                      💳 دفع العربون الآن
                    </Button>
                  </>
                )}

                {/* رسالة رفض الدفع (Payment Rejected Message) */}
                {order.status === 'payment_rejected' && (
                  <>
                    <Separator />
                    <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                      <p className="text-sm text-destructive font-semibold" dir="rtl">
                        ⚠️ تم رفض إيصال الدفع. يرجى التحقق من الإشعارات لمعرفة السبب وإعادة المحاولة.
                      </p>
                      <Button
                        onClick={() => window.location.href = `/payment/${order.id}`}
                        variant="destructive"
                        className="w-full mt-3"
                      >
                        إعادة رفع الإيصال
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

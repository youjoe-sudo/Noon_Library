// إدارة الطلبات (Admin Orders Management)
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getAllOrders, 
  updateOrderStatus, 
  getPaymentReceiptByOrderId,
  approvePaymentReceipt,
  rejectPaymentReceipt 
} from '@/db/api';
import type { Order, OrderStatus, PaymentReceipt } from '@/types';
import { Package, Clock, CheckCircle, Truck, XCircle, FileText, Eye, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الطلبات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة الطلب بنجاح',
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحديث حالة الطلب',
        variant: 'destructive',
      });
    }
  };

  const handleViewReceipt = async (order: Order) => {
    try {
      const receipt = await getPaymentReceiptByOrderId(order.id);
      if (receipt) {
        setSelectedReceipt(receipt);
        setReceiptDialogOpen(true);
      } else {
        toast({
          title: 'تنبيه',
          description: 'لم يتم رفع إيصال دفع لهذا الطلب بعد',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading receipt:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الإيصال',
        variant: 'destructive',
      });
    }
  };

  const handleApproveReceipt = async () => {
    if (!selectedReceipt || !user) return;
    try {
      setProcessing(true);
      await approvePaymentReceipt(selectedReceipt.id, user.id, adminNotes || undefined);
      toast({
        title: 'تم الموافقة',
        description: 'تم الموافقة على الإيصال وتأكيد الطلب',
      });
      setReceiptDialogOpen(false);
      setAdminNotes('');
      loadOrders();
    } catch (error: any) {
      console.error('Error approving receipt:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل الموافقة على الإيصال',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectReceipt = async () => {
    if (!selectedReceipt || !user) return;
    if (!adminNotes.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى كتابة سبب الرفض',
        variant: 'destructive',
      });
      return;
    }
    try {
      setProcessing(true);
      await rejectPaymentReceipt(selectedReceipt.id, user.id, adminNotes);
      toast({
        title: 'تم الرفض',
        description: 'تم رفض الإيصال وإرسال إشعار للعميل',
      });
      setReceiptDialogOpen(false);
      setAdminNotes('');
      loadOrders();
    } catch (error: any) {
      console.error('Error rejecting receipt:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل رفض الإيصال',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
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

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8" dir="rtl">إدارة الطلبات</h1>
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
      <h1 className="text-3xl font-bold mb-8" dir="rtl">إدارة الطلبات 📦</h1>

      {/* الفلتر (Filter) */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium" dir="rtl">تصفية حسب الحالة:</span>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">جميع الطلبات</SelectItem>
                <SelectItem value="awaiting_review">قيد المراجعة</SelectItem>
                <SelectItem value="confirmed">مؤكد</SelectItem>
                <SelectItem value="preparing">قيد التحضير</SelectItem>
                <SelectItem value="shipped">تم الشحن</SelectItem>
                <SelectItem value="delivered">تم التوصيل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary">
              {filteredOrders.length} طلب
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الطلبات (Orders List) */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground" dir="rtl">
                لا توجد طلبات
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg" dir="rtl">
                      طلب رقم: {order.order_number}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground" dir="rtl">
                      {new Date(order.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* معلومات العميل (Customer Info) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground" dir="rtl">العميل:</p>
                    <p className="font-semibold" dir="rtl">
                      {order.profiles?.username || order.guest_name || 'غير متوفر'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground" dir="rtl">الهاتف:</p>
                    <p className="font-semibold" dir="ltr">
                      {order.addresses?.phone || order.guest_phone || 'غير متوفر'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground" dir="rtl">طريقة الدفع:</p>
                    <p className="font-semibold" dir="rtl">
                      {order.payment_method === 'deposit' ? 'عربون' : 'دفع كامل'}
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
                  <div>
                    <p className="text-sm text-muted-foreground mb-1" dir="rtl">عنوان التوصيل:</p>
                    {order.addresses ? (
                      <p className="text-sm" dir="rtl">
                        {order.addresses.street}, {order.addresses.city}, {order.addresses.governorate}
                      </p>
                    ) : (
                      <p className="text-sm" dir="rtl">{order.guest_address}</p>
                    )}
                  </div>
                )}

                {/* عناصر الطلب (Order Items) */}
                <div>
                  <p className="text-sm font-medium mb-2" dir="rtl">عناصر الطلب:</p>
                  <div className="space-y-2">
                    {order.order_items?.map((item) => {
                      const book = item.books;
                      if (!book) return null;
                      return (
                        <div key={item.id} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                          <span dir="rtl">{book.title_ar} × {item.quantity}</span>
                          <span dir="rtl">{(item.quantity * item.price).toFixed(2)} ج.م</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* تحديث الحالة (Update Status) */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pt-4 border-t">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-sm font-medium" dir="rtl">تحديث الحالة:</span>
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusUpdate(order.id, value as OrderStatus)}
                    >
                      <SelectTrigger className="w-48" dir="rtl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="pending">معلق</SelectItem>
                        <SelectItem value="pending_payment">انتظار الدفع</SelectItem>
                        <SelectItem value="awaiting_review">قيد المراجعة</SelectItem>
                        <SelectItem value="payment_rejected">رُفض الدفع</SelectItem>
                        <SelectItem value="confirmed">مؤكد</SelectItem>
                        <SelectItem value="preparing">قيد التحضير</SelectItem>
                        <SelectItem value="shipped">تم الشحن</SelectItem>
                        <SelectItem value="delivered">تم التوصيل</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(order.status === 'awaiting_review' || order.status === 'pending_payment') && (
                    <Button
                      onClick={() => handleViewReceipt(order)}
                      variant="outline"
                      size="sm"
                    >
                      <FileText className="ml-2 h-4 w-4" />
                      عرض الإيصال
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* الإحصائيات (Statistics) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle dir="rtl">إحصائيات الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground" dir="rtl">إجمالي الطلبات:</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground" dir="rtl">قيد المراجعة:</p>
              <p className="text-2xl font-bold text-accent">
                {orders.filter(o => o.status === 'awaiting_review').length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground" dir="rtl">تم التوصيل:</p>
              <p className="text-2xl font-bold text-success">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground" dir="rtl">ملغي:</p>
              <p className="text-2xl font-bold text-destructive">
                {orders.filter(o => o.status === 'cancelled').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مربع حوار مراجعة الإيصال (Receipt Review Dialog) */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle dir="rtl">مراجعة إيصال الدفع</DialogTitle>
            <DialogDescription dir="rtl">
              يرجى مراجعة تفاصيل الإيصال والموافقة أو الرفض
            </DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-6">
              {/* معلومات الإيصال */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground" dir="rtl">رقم الهاتف المحول منه:</p>
                  <p className="font-semibold" dir="ltr">{selectedReceipt.phone_from}</p>
                </div>
                <div>
                  <p className="text-muted-foreground" dir="rtl">رقم الإيصال:</p>
                  <p className="font-semibold" dir="ltr">{selectedReceipt.receipt_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground" dir="rtl">تاريخ الإرسال:</p>
                  <p className="font-semibold" dir="rtl">
                    {new Date(selectedReceipt.created_at).toLocaleString('ar-EG')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground" dir="rtl">الحالة:</p>
                  <Badge variant={
                    selectedReceipt.status === 'approved' ? 'default' :
                    selectedReceipt.status === 'rejected' ? 'destructive' : 'secondary'
                  }>
                    {selectedReceipt.status === 'approved' ? 'موافق عليه' :
                     selectedReceipt.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* صورة الإيصال */}
              <div>
                <Label dir="rtl" className="mb-2 block">صورة الإيصال:</Label>
                <div className="border rounded-md p-4 bg-muted">
                  <img
                    src={selectedReceipt.receipt_image_url}
                    alt="إيصال الدفع"
                    className="max-w-full h-auto max-h-96 mx-auto rounded-md"
                  />
                </div>
              </div>

              <Separator />

              {/* ملاحظات الإدارة */}
              <div>
                <Label htmlFor="admin_notes" dir="rtl">
                  ملاحظات الإدارة {reviewAction === 'reject' && '*'}
                </Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  dir="rtl"
                  rows={4}
                  placeholder={
                    reviewAction === 'reject'
                      ? 'يرجى كتابة سبب الرفض...'
                      : 'ملاحظات اختيارية...'
                  }
                />
              </div>

              {selectedReceipt.status === 'pending' && (
                <DialogFooter className="gap-2">
                  <Button
                    onClick={handleRejectReceipt}
                    disabled={processing}
                    variant="destructive"
                  >
                    {processing ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ThumbsDown className="ml-2 h-4 w-4" />
                    )}
                    رفض الإيصال
                  </Button>
                  <Button
                    onClick={handleApproveReceipt}
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ThumbsUp className="ml-2 h-4 w-4" />
                    )}
                    الموافقة على الإيصال
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

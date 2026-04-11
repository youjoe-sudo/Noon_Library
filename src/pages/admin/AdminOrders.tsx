// إدارة الطلبات (Admin Orders Management)
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { 
  Package, 
  Clock, 
  Eye, 
  ThumbsUp, 
  ThumbsDown, 
  Loader2 
} from 'lucide-react';

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // استخدام any هنا لتجنب خطأ الـ Arguments لو الـ API لا يدعم الفلتر حالياً
      const data = await (getAllOrders as any)(filterStatus === 'all' ? undefined : filterStatus);
      setOrders(data);
    } catch (err: any) {
      toast({
        title: 'خطأ في تحميل الطلبات',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus as OrderStatus);
      toast({
        title: 'تم تحديث الحالة',
        description: 'تم تغيير حالة الطلب بنجاح.',
      });
      loadOrders();
    } catch (err: any) {
      toast({
        title: 'فشل التحديث',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleViewReceipt = async (orderId: string) => {
    try {
      setProcessing(true);
      const receipt = await getPaymentReceiptByOrderId(orderId);
      if (receipt) {
        setSelectedReceipt(receipt);
        setAdminNotes(receipt.admin_notes || '');
        setReceiptDialogOpen(true);
      } else {
        toast({
          title: 'لا يوجد إيصال',
          description: 'لم يقم العميل برفع إيصال دفع لهذا الطلب بعد.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في استرداد بيانات الإيصال',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveReceipt = async () => {
    if (!selectedReceipt || !user) return;
    try {
      setProcessing(true);
      await approvePaymentReceipt(selectedReceipt.id, user.id, adminNotes);
      toast({ title: 'تمت الموافقة', description: 'تم تأكيد الدفع بنجاح.' });
      setReceiptDialogOpen(false);
      loadOrders();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectReceipt = async () => {
    if (!selectedReceipt || !user) return;
    if (!adminNotes.trim()) {
      toast({ title: 'ملاحظات مطلوبة', description: 'يرجى كتابة سبب الرفض.', variant: 'destructive' });
      return;
    }
    try {
      setProcessing(true);
      await rejectPaymentReceipt(selectedReceipt.id, user.id, adminNotes);
      toast({ title: 'تم رفض الإيصال', description: 'سيتمكن العميل من رفع إيصال جديد.' });
      setReceiptDialogOpen(false);
      loadOrders();
    } catch (err: any) {
      toast({ title: 'خطأ في الرفض', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: any) => {
    const s = String(status);
    switch (s) {
      case 'pending_payment': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">في انتظار الدفع</Badge>;
      case 'pending_approval': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">في انتظار المراجعة</Badge>;
      case 'processing': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">جاري التجهيز</Badge>;
      case 'shipped': return <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">تم الشحن</Badge>;
      case 'delivered': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">تم الاستلام</Badge>;
      case 'cancelled': return <Badge variant="destructive">ملغي</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 text-right">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            إدارة الطلبات
          </h1>
          <p className="text-muted-foreground mt-1">عرض وإدارة جميع طلبات العملاء وحالات الدفع</p>
        </div>

        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button variant={filterStatus === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setFilterStatus('all')}>الكل</Button>
          <Button variant={filterStatus === 'pending_approval' ? 'default' : 'ghost'} size="sm" onClick={() => setFilterStatus('pending_approval')}>المراجعة</Button>
          <Button variant={filterStatus === 'processing' ? 'default' : 'ghost'} size="sm" onClick={() => setFilterStatus('processing')}>التجهيز</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-medium">لا توجد طلبات حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-right">
                      <h3 className="font-bold text-lg">طلب #{order.order_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('ar-EG', { dateStyle: 'long' })}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4 text-right">
                  <div>
                    <span className="text-muted-foreground block">العميل:</span>
                    <span className="font-medium">{(order as any).profiles?.username || 'عميل'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">الإجمالي:</span>
                    <span className="font-medium text-primary">{order.total_amount.toFixed(2)} ج.م</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">العربون:</span>
                    <span className="font-medium text-orange-600">{order.deposit_amount.toFixed(2)} ج.م</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">طريقة الدفع:</span>
                    <span className="font-medium">{String(order.payment_method) === 'cod' ? 'عند الاستلام' : 'دفع عربون'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {String(order.status) === 'pending_approval' && (
                    <Button size="sm" onClick={() => handleViewReceipt(order.id)} className="gap-1">
                      <Eye className="h-4 w-4" /> مراجعة الإيصال
                    </Button>
                  )}
                  
                  <Select defaultValue={order.status} onValueChange={(val) => handleStatusChange(order.id, val)}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="تغيير الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_payment">في انتظار الدفع</SelectItem>
                      <SelectItem value="processing">جاري التجهيز</SelectItem>
                      <SelectItem value="shipped">تم الشحن</SelectItem>
                      <SelectItem value="delivered">تم الاستلام</SelectItem>
                      <SelectItem value="cancelled">إلغاء الطلب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-xl">مراجعة إيصال دفع العربون</DialogTitle>
            <DialogDescription className="text-right">يرجى التحقق من صحة الصورة والمبلغ قبل اتخاذ قرار.</DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-6">
              <div className="border rounded-lg overflow-hidden bg-muted flex items-center justify-center min-h-[300px]">
                <img 
                  src={selectedReceipt.receipt_image_url} 
                  alt="Receipt" 
                  className="max-w-full max-h-[500px] object-contain"
                />
              </div>

              <div className="bg-primary/5 p-4 rounded-lg flex justify-between items-center text-right">
                <span className="font-bold">مبلغ العربون المطلوب:</span>
                <span className="text-xl font-bold text-primary">{(selectedReceipt as any).amount || '0'} ج.م</span>
              </div>

              <div className="space-y-3 text-right">
                <Label className="font-bold">ملاحظات الأدمن (تظهر للعميل):</Label>
                <Textarea 
                  value={adminNotes} 
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="اكتب سبب الرفض أو ملاحظات القبول هنا..."
                  className="min-h-[100px] text-right"
                  dir="rtl"
                />
              </div>

              <DialogFooter className="flex-row-reverse gap-3 sm:justify-start">
                <Button 
                  onClick={handleApproveReceipt} 
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <ThumbsUp className="ml-2 h-4 w-4" />}
                  قبول الإيصال
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleRejectReceipt} 
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <ThumbsDown className="ml-2 h-4 w-4" />}
                  رفض الإيصال
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
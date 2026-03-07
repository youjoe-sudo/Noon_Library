// صفحة دفع العربون (Payment Deposit Page)
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import {
  getOrder,
  createPaymentReceipt,
  uploadReceiptImage,
  updateOrderStatus,
} from '@/db/api';
import type { Order } from '@/types';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Phone,
  FileText,
  Loader2,
} from 'lucide-react';

export default function PaymentDeposit() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    phone_from: '',
    receipt_number: '',
  });

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const orderData = await getOrder(orderId);
      if (!orderData) {
        toast({
          title: 'خطأ',
          description: 'الطلب غير موجود',
          variant: 'destructive',
        });
        navigate('/orders');
        return;
      }
      setOrder(orderData);
    } catch (error) {
      console.error('Error loading order:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل بيانات الطلب',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار صورة فقط',
        variant: 'destructive',
      });
      return;
    }

    // التحقق من حجم الملف (1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: 'خطأ',
        description: 'حجم الصورة يجب أن يكون أقل من 1 ميجابايت',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!order || !user) return;

    if (!formData.phone_from || !formData.receipt_number || !imageFile) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول وإرفاق صورة الإيصال',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      // رفع الصورة
      const imageUrl = await uploadReceiptImage(imageFile, user.id);

      // إنشاء سجل الإيصال
      await createPaymentReceipt({
        order_id: order.id,
        phone_from: formData.phone_from,
        receipt_image_url: imageUrl,
        receipt_number: formData.receipt_number,
      });

      // تحديث حالة الطلب
      await updateOrderStatus(order.id, 'awaiting_review');

      toast({
        title: 'تم الإرسال بنجاح',
        description: 'تم إرسال إيصال الدفع. سيتم مراجعته خلال 24 ساعة.',
      });

      navigate('/orders');
    } catch (error: any) {
      console.error('Error submitting receipt:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل إرسال الإيصال',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const depositAmount = order.deposit_amount || order.shipping_cost;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2" dir="rtl">
            دفع العربون 💳
          </h1>
          <p className="text-muted-foreground" dir="rtl">
            الطلب #{order.order_number}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* ملخص الطلب */}
          <Card>
            <CardHeader>
              <CardTitle dir="rtl">ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between" dir="rtl">
                <span className="text-muted-foreground">إجمالي المبلغ:</span>
                <span className="font-semibold">{order.total_amount.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between" dir="rtl">
                <span className="text-muted-foreground">تكلفة الشحن:</span>
                <span className="font-semibold">{order.shipping_cost.toFixed(2)} ج.م</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg" dir="rtl">
                <span className="font-bold">العربون المطلوب:</span>
                <span className="font-bold text-primary">{depositAmount.toFixed(2)} ج.م</span>
              </div>
            </CardContent>
          </Card>

          {/* معلومات التحويل */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle dir="rtl">معلومات التحويل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription dir="rtl">
                  <div className="space-y-2">
                    <p className="font-semibold">حول العربون إلى:</p>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm">فودافون كاش</p>
                      <p className="text-lg font-mono font-bold">01012345678</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      أو عبر InstaPay / تحويل بنكي
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* الشروط والأحكام */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle dir="rtl">⚠️ شروط الدفع</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm" dir="rtl">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <span>العربون المطلوب هو قيمة الشحن فقط ({depositAmount.toFixed(2)} ج.م)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <span>باقي المبلغ يُدفع عند الاستلام (الدفع عند الاستلام)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <span>يرجى إرفاق صورة واضحة لإيصال التحويل</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <span>سيتم مراجعة الإيصال خلال 24 ساعة</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <span>في حالة رفض الإيصال، سيتم إشعارك بالسبب</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* نموذج رفع الإيصال */}
        <Card>
          <CardHeader>
            <CardTitle dir="rtl">إرسال إيصال الدفع</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone_from" dir="rtl">
                  <Phone className="inline ml-2 h-4 w-4" />
                  رقم الهاتف الذي حولت منه *
                </Label>
                <Input
                  id="phone_from"
                  type="tel"
                  value={formData.phone_from}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_from: e.target.value })
                  }
                  required
                  dir="ltr"
                  placeholder="01XXXXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_number" dir="rtl">
                  <FileText className="inline ml-2 h-4 w-4" />
                  رقم الإيصال / رقم التحويل *
                </Label>
                <Input
                  id="receipt_number"
                  value={formData.receipt_number}
                  onChange={(e) =>
                    setFormData({ ...formData, receipt_number: e.target.value })
                  }
                  required
                  dir="ltr"
                  placeholder="مثال: 123456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_image" dir="rtl">
                  <Upload className="inline ml-2 h-4 w-4" />
                  صورة الإيصال *
                </Label>
                <Input
                  id="receipt_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                />
                <p className="text-xs text-muted-foreground" dir="rtl">
                  الحد الأقصى: 1 ميجابايت | الصيغ المدعومة: JPG, PNG
                </p>
              </div>

              {imagePreview && (
                <div className="space-y-2">
                  <Label dir="rtl">معاينة الصورة:</Label>
                  <div className="border rounded-md p-4 bg-muted">
                    <img
                      src={imagePreview}
                      alt="معاينة الإيصال"
                      className="max-w-full h-auto max-h-96 mx-auto rounded-md"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <CheckCircle className="ml-2 h-5 w-5" />
                    إرسال الإيصال
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

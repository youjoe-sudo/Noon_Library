// لوحة المسوق (Affiliate Dashboard)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { 
  getAffiliateByUserId, 
  getAffiliateTrackingLinks, 
  generateTrackingCode,
  getAffiliateOrders 
} from '@/db/api';
import type { Affiliate, AffiliateTracking, Order } from '@/types';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Link as LinkIcon, 
  Copy, 
  Tag, 
  Plus,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [trackingLinks, setTrackingLinks] = useState<AffiliateTracking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    }
  }, [user]);

  const loadAffiliateData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const affiliateData = await getAffiliateByUserId(user.id);
      if (affiliateData) {
        setAffiliate(affiliateData);
        // تحميل روابط التتبع (Load tracking links)
        const trackingData = await getAffiliateTrackingLinks(affiliateData.id);
        setTrackingLinks(trackingData);
        // تحميل الطلبات (Load orders)
        const ordersData = await getAffiliateOrders(affiliateData.id);
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTrackingLink = async () => {
    if (!affiliate) return;
    try {
      setGeneratingLink(true);
      const newCode = await generateTrackingCode(affiliate.id);
      toast({
        title: 'تم إنشاء رابط التتبع',
        description: `كود التتبع: ${newCode}`,
      });
      loadAffiliateData(); // إعادة تحميل البيانات
    } catch (error: any) {
      console.error('Error generating tracking link:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل إنشاء رابط التتبع',
        variant: 'destructive',
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    toast({
      title: 'تم النسخ',
      description: 'تم نسخ رابط التتبع',
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getOrderStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'secondary', icon: Clock, label: 'قيد الانتظار' },
      confirmed: { variant: 'default', icon: CheckCircle, label: 'مؤكد' },
      preparing: { variant: 'default', icon: ShoppingBag, label: 'قيد التحضير' },
      shipped: { variant: 'default', icon: TrendingUp, label: 'تم الشحن' },
      delivered: { variant: 'default', icon: CheckCircle, label: 'تم التوصيل' },
      cancelled: { variant: 'destructive', icon: XCircle, label: 'ملغي' },
    };
    const config = badges[status] || badges.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="ml-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleCopyReferralLink = () => {
    if (!affiliate) return;
    const referralUrl = `${window.location.origin}?ref=${affiliate.referral_code}`;
    navigator.clipboard.writeText(referralUrl);
    toast({
      title: 'تم النسخ',
      description: 'تم نسخ رابط الإحالة',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      pending: { label: 'قيد المراجعة', variant: 'secondary' },
      active: { label: 'نشط', variant: 'default' },
      suspended: { label: 'معلق', variant: 'destructive' },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
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
          <Skeleton className="h-10 w-64 mb-8 bg-muted" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-24 mb-2 bg-muted" />
                  <Skeleton className="h-8 w-32 bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="p-16 text-center">
              <h2 className="text-2xl font-bold mb-4" dir="rtl">لست مسجلاً كمسوق</h2>
              <p className="text-muted-foreground mb-6" dir="rtl">
                يجب التسجيل في برنامج التسويق بالعمولة أولاً
              </p>
              <Button onClick={() => navigate('/affiliate/register')}>
                التسجيل كمسوق
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const referralUrl = `${window.location.origin}?ref=${affiliate.referral_code}`;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold" dir="rtl">لوحة المسوق 💼</h1>
            {getStatusBadge(affiliate.status)}
          </div>
          <Button onClick={() => navigate('/affiliate/coupons')}>
            <Tag className="ml-2 h-4 w-4" />
            إدارة الكوبونات
          </Button>
        </div>

        {affiliate.status === 'pending' && (
          <Card className="mb-8 border-yellow-500">
            <CardContent className="p-6">
              <p className="text-center" dir="rtl">
                ⏳ طلبك قيد المراجعة. سيتم إشعارك بالقرار خلال 24-48 ساعة.
              </p>
            </CardContent>
          </Card>
        )}

        {affiliate.status === 'suspended' && (
          <Card className="mb-8 border-destructive">
            <CardContent className="p-6">
              <p className="text-center text-destructive" dir="rtl">
                ⚠️ حسابك معلق حالياً. يرجى التواصل مع الإدارة.
              </p>
            </CardContent>
          </Card>
        )}

        {/* الإحصائيات (Statistics) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground" dir="rtl">إجمالي الأرباح</p>
                  <p className="text-2xl font-bold" dir="rtl">{affiliate.total_earnings.toFixed(2)} ج.م</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground" dir="rtl">الأرباح المعلقة</p>
                  <p className="text-2xl font-bold" dir="rtl">{affiliate.pending_earnings.toFixed(2)} ج.م</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground" dir="rtl">عدد المبيعات</p>
                  <p className="text-2xl font-bold">{affiliate.total_sales}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <LinkIcon className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground" dir="rtl">نسبة العمولة</p>
                  <p className="text-2xl font-bold">{affiliate.commission_rate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط الإحالة (Referral Link) */}
        {affiliate.status === 'active' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle dir="rtl">رابط الإحالة الخاص بك</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={referralUrl}
                  readOnly
                  dir="ltr"
                  className="flex-1"
                />
                <Button onClick={handleCopyReferralLink} variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground" dir="rtl">
                شارك هذا الرابط مع عملائك للحصول على عمولة من كل عملية شراء
              </p>
            </CardContent>
          </Card>
        )}

        {/* معلومات الحساب (Account Info) */}
        <Card>
          <CardHeader>
            <CardTitle dir="rtl">معلومات الحساب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground" dir="rtl">اسم النشاط التجاري:</p>
                <p className="font-semibold" dir="rtl">{affiliate.business_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground" dir="rtl">رقم الهاتف:</p>
                <p className="font-semibold" dir="ltr">{affiliate.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground" dir="rtl">كود الإحالة:</p>
                <p className="font-semibold font-mono">{affiliate.referral_code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground" dir="rtl">تاريخ الانضمام:</p>
                <p className="font-semibold">
                  {new Date(affiliate.created_at).toLocaleDateString('ar-EG')}
                </p>
              </div>
            </div>

            {affiliate.website && (
              <div>
                <p className="text-sm text-muted-foreground" dir="rtl">الموقع الإلكتروني:</p>
                <a
                  href={affiliate.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {affiliate.website}
                </a>
              </div>
            )}

            {affiliate.social_media && (
              <div>
                <p className="text-sm text-muted-foreground" dir="rtl">حسابات التواصل:</p>
                <p dir="rtl">{affiliate.social_media}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* روابط التتبع (Tracking Links) */}
        {affiliate.status === 'active' && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle dir="rtl">روابط التتبع 🔗</CardTitle>
                <Button onClick={handleGenerateTrackingLink} disabled={generatingLink} size="sm">
                  {generatingLink ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="ml-2 h-4 w-4" />
                  )}
                  إنشاء رابط جديد
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {trackingLinks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" dir="rtl">
                  <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لم تقم بإنشاء أي روابط تتبع بعد</p>
                  <p className="text-sm mt-2">انقر على "إنشاء رابط جديد" للبدء</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trackingLinks.map((link) => (
                    <Card key={link.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-sm font-mono bg-accent px-2 py-1 rounded">
                                {link.tracking_code}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyLink(link.tracking_code)}
                              >
                                {copiedCode === link.tracking_code ? (
                                  <CheckCircle className="h-4 w-4 text-success" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">النقرات: </span>
                                <span className="font-semibold">{link.clicks}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">التحويلات: </span>
                                <span className="font-semibold text-success">{link.conversions}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">معدل التحويل: </span>
                                <span className="font-semibold">
                                  {link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : 0}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`${window.location.origin}?ref=${link.tracking_code}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* الطلبات (Orders) */}
        {affiliate.status === 'active' && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle dir="rtl">طلباتي ({orders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" dir="rtl">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد طلبات بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 10).map((order) => (
                    <Card key={order.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">#{order.order_number}</span>
                              {getOrderStatusBadge(order.status)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div dir="rtl">
                                <span className="text-muted-foreground">المبلغ: </span>
                                <span className="font-semibold">{order.total_amount.toFixed(2)} ج.م</span>
                              </div>
                              <div dir="rtl">
                                <span className="text-muted-foreground">العمولة: </span>
                                <span className="font-semibold text-success">
                                  {(order.total_amount * affiliate.commission_rate / 100).toFixed(2)} ج.م
                                </span>
                              </div>
                              <div dir="rtl">
                                <span className="text-muted-foreground">العناصر: </span>
                                <span>{order.order_items?.length || 0}</span>
                              </div>
                              <div dir="rtl">
                                <span className="text-muted-foreground">التاريخ: </span>
                                <span>{new Date(order.created_at).toLocaleDateString('ar-EG')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {orders.length > 10 && (
                    <div className="text-center pt-4">
                      <Button variant="outline" onClick={() => navigate('/orders')}>
                        عرض جميع الطلبات ({orders.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* نصائح للمسوقين (Tips for Affiliates) */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle dir="rtl">💡 نصائح لزيادة أرباحك</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm" dir="rtl">
              <li>• شارك رابطك على وسائل التواصل الاجتماعي</li>
              <li>• اكتب مراجعات للكتب التي تروج لها</li>
              <li>• استهدف الجمهور المهتم بالقراءة والثقافة</li>
              <li>• استخدم محتوى جذاب وصور عالية الجودة</li>
              <li>• تابع إحصائياتك بانتظام لتحسين أدائك</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

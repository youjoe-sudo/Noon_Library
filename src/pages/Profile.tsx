// صفحة الملف الشخصي (Profile Page)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getAffiliateByUserId } from '@/db/api';
import type { Affiliate } from '@/types';
import { LayoutDashboard, Tag, TrendingUp, Loader2 } from 'lucide-react';

export default function Profile() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loadingAffiliate, setLoadingAffiliate] = useState(true);

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    }
  }, [user]);

  const loadAffiliateData = async () => {
    if (!user) return;
    try {
      setLoadingAffiliate(true);
      const data = await getAffiliateByUserId(user.id);
      setAffiliate(data);
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoadingAffiliate(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="secondary">⏳ قيد المراجعة</Badge>,
      active: <Badge variant="default">✅ نشط</Badge>,
      suspended: <Badge variant="destructive">⚠️ معلق</Badge>,
    };
    return badges[status as keyof typeof badges] || null;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8" dir="rtl">الملف الشخصي</h1>
        
        <div className="space-y-6">
          {/* معلومات الحساب (Account Information) */}
          <Card>
            <CardHeader>
              <CardTitle dir="rtl">معلومات الحساب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center" dir="rtl">
                <span className="text-muted-foreground">اسم المستخدم:</span>
                <span className="font-semibold">
                  {String(profile?.username || user?.email?.split('@')[0] || 'غير متوفر')}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center" dir="rtl">
                <span className="text-muted-foreground">البريد الإلكتروني:</span>
                <span className="font-semibold">
                  {String(profile?.email || user?.email || 'غير متوفر')}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center" dir="rtl">
                <span className="text-muted-foreground">الدور:</span>
                <span className="font-semibold">
                  {profile?.role === 'admin' ? 'مدير' : profile?.role === 'affiliate' ? 'مسوق' : 'مستخدم'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* قسم المسوق (Affiliate Section) */}
          {loadingAffiliate ? (
            <Card>
              <CardContent className="p-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : affiliate ? (
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle dir="rtl">حساب المسوق 💼</CardTitle>
                  {getStatusBadge(affiliate.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2" dir="rtl">
                    <p className="text-sm text-muted-foreground">اسم العمل</p>
                    <p className="font-semibold">{affiliate.business_name || 'غير محدد'}</p>
                  </div>
                  <div className="space-y-2" dir="rtl">
                    <p className="text-sm text-muted-foreground">نسبة العمولة</p>
                    <p className="font-semibold text-primary">{affiliate.commission_rate}%</p>
                  </div>
                  <div className="space-y-2" dir="rtl">
                    <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                    <p className="font-semibold">{affiliate.total_sales.toFixed(2)} ج.م</p>
                  </div>
                  <div className="space-y-2" dir="rtl">
                    <p className="text-sm text-muted-foreground">إجمالي العمولات</p>
                    <p className="font-semibold text-success">{affiliate.total_earnings.toFixed(2)} ج.م</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button 
                    onClick={() => navigate('/affiliate/dashboard')}
                    className="w-full"
                  >
                    <LayoutDashboard className="ml-2 h-4 w-4" />
                    لوحة المسوق
                  </Button>
                  <Button 
                    onClick={() => navigate('/affiliate/coupons')}
                    variant="outline"
                    className="w-full"
                  >
                    <Tag className="ml-2 h-4 w-4" />
                    إدارة الكوبونات
                  </Button>
                  <Button 
                    onClick={() => navigate('/orders')}
                    variant="outline"
                    className="w-full"
                  >
                    <TrendingUp className="ml-2 h-4 w-4" />
                    المبيعات
                  </Button>
                </div>

                {affiliate.status === 'pending' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center" dir="rtl">
                    <p className="text-sm">⏳ طلبك قيد المراجعة. سيتم إشعارك بالقرار خلال 24-48 ساعة.</p>
                  </div>
                )}

                {affiliate.status === 'suspended' && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center" dir="rtl">
                    <p className="text-sm text-destructive">⚠️ حسابك معلق حالياً. يرجى التواصل مع الإدارة.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <div className="text-4xl mb-2">💼</div>
                <h3 className="text-xl font-semibold" dir="rtl">هل تريد أن تصبح مسوقاً؟</h3>
                <p className="text-muted-foreground" dir="rtl">
                  انضم إلى برنامج التسويق بالعمولة واحصل على عمولات من كل عملية بيع
                </p>
                <Button onClick={() => navigate('/affiliate/register')} size="lg">
                  التسجيل كمسوق
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

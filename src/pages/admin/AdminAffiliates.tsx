// إدارة المسوقين (Admin Affiliates Management)
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { getAllAffiliates, updateAffiliateStatus } from '@/db/api';
import type { Affiliate, AffiliateStatus } from '@/types';
import { TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    try {
      setLoading(true);
      const data = await getAllAffiliates();
      setAffiliates(data);
    } catch (error) {
      console.error('Error loading affiliates:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل المسوقين',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (affiliateId: string, newStatus: AffiliateStatus) => {
    try {
      await updateAffiliateStatus(affiliateId, newStatus);
      setAffiliates(affiliates.map(affiliate => 
        affiliate.id === affiliateId ? { ...affiliate, status: newStatus } : affiliate
      ));
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة المسوق بنجاح',
      });
    } catch (error) {
      console.error('Error updating affiliate status:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحديث حالة المسوق',
        variant: 'destructive',
      });
    }
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

  const filteredAffiliates = filterStatus === 'all' 
    ? affiliates 
    : affiliates.filter(affiliate => affiliate.status === filterStatus);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8" dir="rtl">إدارة المسوقين</h1>
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
      <h1 className="text-3xl font-bold mb-8" dir="rtl">إدارة المسوقين 💼</h1>

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
                <SelectItem value="all">جميع المسوقين</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="suspended">معلق</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary">
              {filteredAffiliates.length} مسوق
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* قائمة المسوقين (Affiliates List) */}
      <div className="space-y-4">
        {filteredAffiliates.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground" dir="rtl">
                لا يوجد مسوقون
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAffiliates.map((affiliate) => (
            <Card key={affiliate.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg" dir="rtl">
                      {affiliate.business_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground" dir="rtl">
                      كود الإحالة: {affiliate.referral_code}
                    </p>
                  </div>
                  {getStatusBadge(affiliate.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* معلومات المسوق (Affiliate Info) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground" dir="rtl">إجمالي الأرباح</p>
                      <p className="font-semibold" dir="rtl">{affiliate.total_earnings.toFixed(2)} ج.م</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded">
                      <TrendingUp className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground" dir="rtl">الأرباح المعلقة</p>
                      <p className="font-semibold" dir="rtl">{affiliate.pending_earnings.toFixed(2)} ج.م</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded">
                      <ShoppingBag className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground" dir="rtl">عدد المبيعات</p>
                      <p className="font-semibold">{affiliate.total_sales}</p>
                    </div>
                  </div>
                </div>

                {/* تفاصيل إضافية (Additional Details) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground" dir="rtl">رقم الهاتف:</p>
                    <p className="font-semibold" dir="ltr">{affiliate.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground" dir="rtl">نسبة العمولة:</p>
                    <p className="font-semibold">{affiliate.commission_rate}%</p>
                  </div>
                  {affiliate.website && (
                    <div>
                      <p className="text-muted-foreground" dir="rtl">الموقع الإلكتروني:</p>
                      <a
                        href={affiliate.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        {affiliate.website}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground" dir="rtl">تاريخ الانضمام:</p>
                    <p className="font-semibold">
                      {new Date(affiliate.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>

                {affiliate.social_media && (
                  <div>
                    <p className="text-sm text-muted-foreground" dir="rtl">حسابات التواصل:</p>
                    <p className="text-sm" dir="rtl">{affiliate.social_media}</p>
                  </div>
                )}

                {affiliate.marketing_experience && (
                  <div>
                    <p className="text-sm text-muted-foreground" dir="rtl">الخبرة التسويقية:</p>
                    <p className="text-sm" dir="rtl">{affiliate.marketing_experience}</p>
                  </div>
                )}

                {/* تحديث الحالة (Update Status) */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <span className="text-sm font-medium" dir="rtl">تحديث الحالة:</span>
                  <Select
                    value={affiliate.status}
                    onValueChange={(value) => handleStatusUpdate(affiliate.id, value as AffiliateStatus)}
                  >
                    <SelectTrigger className="w-48" dir="rtl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="pending">قيد المراجعة</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="suspended">معلق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* الإحصائيات (Statistics) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle dir="rtl">إحصائيات المسوقين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground" dir="rtl">إجمالي المسوقين:</p>
              <p className="text-2xl font-bold">{affiliates.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground" dir="rtl">نشط:</p>
              <p className="text-2xl font-bold text-success">
                {affiliates.filter(a => a.status === 'active').length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground" dir="rtl">قيد المراجعة:</p>
              <p className="text-2xl font-bold text-accent">
                {affiliates.filter(a => a.status === 'pending').length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground" dir="rtl">معلق:</p>
              <p className="text-2xl font-bold text-destructive">
                {affiliates.filter(a => a.status === 'suspended').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

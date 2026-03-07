// صفحة إدارة الكوبونات للمسوقين (Affiliate Coupons Management Page)
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { getAffiliateByUserId, getAffiliateCoupons, createCoupon, updateCoupon } from '@/db/api';
import type { Coupon, Affiliate } from '@/types';
import { Loader2, Plus, Tag, Copy, Edit, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AffiliateCoupons() {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_purchase_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    valid_until: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const affiliateData = await getAffiliateByUserId(user.id);
      if (affiliateData) {
        setAffiliate(affiliateData);
        const couponsData = await getAffiliateCoupons(affiliateData.id);
        setCoupons(couponsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliate) return;

    // التحقق من الصحة (Validation)
    if (!formData.code.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال كود الكوبون',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال قيمة خصم صحيحة',
        variant: 'destructive',
      });
      return;
    }

    if (formData.discount_type === 'percentage' && parseFloat(formData.discount_value) > 100) {
      toast({
        title: 'خطأ',
        description: 'نسبة الخصم يجب أن تكون بين 1 و 100',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      const couponData = {
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : 0,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        affiliate_id: affiliate.id,
        is_active: true,
      };

      await createCoupon(couponData);

      toast({
        title: 'تم إنشاء الكوبون',
        description: 'تم إنشاء الكوبون بنجاح',
      });

      setDialogOpen(false);
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_purchase_amount: '',
        max_discount_amount: '',
        usage_limit: '',
        valid_until: '',
      });
      loadData();
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل إنشاء الكوبون',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await updateCoupon(coupon.id, { is_active: !coupon.is_active });
      toast({
        title: coupon.is_active ? 'تم تعطيل الكوبون' : 'تم تفعيل الكوبون',
        description: `الكوبون ${coupon.code} ${coupon.is_active ? 'معطل' : 'مفعل'} الآن`,
      });
      loadData();
    } catch (error: any) {
      console.error('Error toggling coupon:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل تحديث الكوبون',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'تم النسخ',
      description: `تم نسخ الكود: ${code}`,
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">يرجى تسجيل الدخول</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">يجب أن تكون مسوقاً لإدارة الكوبونات</p>
            <Button className="mt-4" onClick={() => window.location.href = '/affiliate/register'}>
              التسجيل كمسوق
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tag className="h-6 w-6" />
              <CardTitle dir="rtl">إدارة الكوبونات</CardTitle>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="ml-2 h-4 w-4" />
                  إنشاء كوبون جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle dir="rtl">إنشاء كوبون جديد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" dir="rtl">كود الكوبون *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="مثال: SUMMER2026"
                      required
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount_type" dir="rtl">نوع الخصم *</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value: 'percentage' | 'fixed') => 
                        setFormData({ ...formData, discount_type: value })
                      }
                    >
                      <SelectTrigger dir="rtl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                        <SelectItem value="fixed">مبلغ ثابت (ج.م)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount_value" dir="rtl">
                      قيمة الخصم * {formData.discount_type === 'percentage' ? '(%)' : '(ج.م)'}
                    </Label>
                    <Input
                      id="discount_value"
                      type="number"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      required
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_purchase" dir="rtl">الحد الأدنى للشراء (ج.م)</Label>
                    <Input
                      id="min_purchase"
                      type="number"
                      step="0.01"
                      value={formData.min_purchase_amount}
                      onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                      placeholder="0"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_discount" dir="rtl">الحد الأقصى للخصم (ج.م)</Label>
                    <Input
                      id="max_discount"
                      type="number"
                      step="0.01"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                      placeholder="غير محدد"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usage_limit" dir="rtl">حد الاستخدام</Label>
                    <Input
                      id="usage_limit"
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                      placeholder="غير محدد"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valid_until" dir="rtl">صالح حتى</Label>
                    <Input
                      id="valid_until"
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      dir="ltr"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    إنشاء الكوبون
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لم تقم بإنشاء أي كوبونات بعد</p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                إنشاء أول كوبون
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <Card key={coupon.id} className={!coupon.is_active ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-lg font-bold bg-accent px-3 py-1 rounded">
                            {coupon.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(coupon.code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                            {coupon.is_active ? 'مفعل' : 'معطل'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm" dir="rtl">
                          <div>
                            <span className="text-muted-foreground">الخصم: </span>
                            <span className="font-semibold">
                              {coupon.discount_type === 'percentage' 
                                ? `${coupon.discount_value}%` 
                                : `${coupon.discount_value} ج.م`}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">الاستخدام: </span>
                            <span className="font-semibold">
                              {coupon.used_count} / {coupon.usage_limit || '∞'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">الحد الأدنى: </span>
                            <span>{coupon.min_purchase_amount} ج.م</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">صالح حتى: </span>
                            <span>{formatDate(coupon.valid_until)}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(coupon)}
                      >
                        {coupon.is_active ? (
                          <ToggleRight className="h-5 w-5 text-success" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

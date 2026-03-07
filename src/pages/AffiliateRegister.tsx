// صفحة تسجيل المسوق (Affiliate Register Page)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { createAffiliate } from '@/db/api';
import { Loader2, TrendingUp, DollarSign, Users, Award } from 'lucide-react';

export default function AffiliateRegister() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    business_name: '',
    phone: '',
    website: '',
    social_media: '',
    marketing_experience: '',
    payment_method: '',
    payment_details: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'خطأ',
        description: 'يجب تسجيل الدخول أولاً',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (!formData.business_name || !formData.phone || !formData.payment_method || !formData.payment_details) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // إنشاء حساب مسوق (Create affiliate account)
      const referralCode = `REF${Date.now().toString().slice(-8)}`;
      
      await createAffiliate({
        user_id: user.id,
        business_name: formData.business_name,
        phone: formData.phone,
        website: formData.website || null,
        social_media: formData.social_media || null,
        marketing_experience: formData.marketing_experience || null,
        payment_method: formData.payment_method,
        payment_details: formData.payment_details,
        referral_code: referralCode,
        commission_rate: 10, // نسبة عمولة افتراضية 10%
        status: 'pending',
      });

      toast({
        title: 'تم التسجيل بنجاح',
        description: 'سيتم مراجعة طلبك وإشعارك بالقرار قريباً',
      });

      navigate('/affiliate/dashboard');
    } catch (error: any) {
      console.error('Error registering affiliate:', error);
      
      // عرض رسالة خطأ أكثر تفصيلاً (Show more detailed error message)
      let errorMessage = 'فشل التسجيل. يرجى المحاولة مرة أخرى.';
      
      if (error?.message?.includes('duplicate') || error?.code === '23505') {
        errorMessage = 'أنت مسجل بالفعل كمسوق.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" dir="rtl">
            انضم كمسوق 💰
          </h1>
          <p className="text-xl text-muted-foreground" dir="rtl">
            احصل على عمولات مجزية من كل عملية بيع تتم عبر رابطك الخاص
          </p>
        </div>

        {/* المزايا (Benefits) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-10 w-10 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2" dir="rtl">عمولات عالية</h3>
              <p className="text-sm text-muted-foreground" dir="rtl">
                حتى 15% عمولة على كل عملية بيع
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2" dir="rtl">نمو مستمر</h3>
              <p className="text-sm text-muted-foreground" dir="rtl">
                زيادة العمولة مع زيادة المبيعات
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-10 w-10 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2" dir="rtl">دعم كامل</h3>
              <p className="text-sm text-muted-foreground" dir="rtl">
                فريق دعم متخصص لمساعدتك
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-10 w-10 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2" dir="rtl">مكافآت خاصة</h3>
              <p className="text-sm text-muted-foreground" dir="rtl">
                بونص عند تحقيق أهداف المبيعات
              </p>
            </CardContent>
          </Card>
        </div>

        {/* نموذج التسجيل (Registration Form) */}
        <Card>
          <CardHeader>
            <CardTitle dir="rtl">نموذج التسجيل</CardTitle>
            <CardDescription dir="rtl">
              املأ البيانات التالية للانضمام إلى برنامج التسويق بالعمولة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name" dir="rtl">اسم النشاط التجاري *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    required
                    dir="rtl"
                    placeholder="مثال: متجر الكتب الإلكتروني"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" dir="rtl">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    dir="ltr"
                    placeholder="+20 1XX XXX XXXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" dir="rtl">الموقع الإلكتروني (اختياري)</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  dir="ltr"
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="social_media" dir="rtl">حسابات التواصل الاجتماعي (اختياري)</Label>
                <Input
                  id="social_media"
                  value={formData.social_media}
                  onChange={(e) => setFormData({ ...formData, social_media: e.target.value })}
                  dir="rtl"
                  placeholder="مثال: @username على تويتر، فيسبوك، إنستغرام"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketing_experience" dir="rtl">خبرتك في التسويق (اختياري)</Label>
                <Textarea
                  id="marketing_experience"
                  value={formData.marketing_experience}
                  onChange={(e) => setFormData({ ...formData, marketing_experience: e.target.value })}
                  dir="rtl"
                  rows={4}
                  placeholder="أخبرنا عن خبرتك في التسويق والمبيعات..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_method" dir="rtl">طريقة استلام الأرباح *</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger dir="rtl">
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="vodafone_cash">فودافون كاش</SelectItem>
                      <SelectItem value="instapay">InstaPay</SelectItem>
                      <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                      <SelectItem value="etisalat_cash">اتصالات كاش</SelectItem>
                      <SelectItem value="orange_cash">أورانج كاش</SelectItem>
                      <SelectItem value="we_pay">WE Pay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_details" dir="rtl">
                    {formData.payment_method === 'bank_transfer' 
                      ? 'رقم الحساب البنكي *' 
                      : 'رقم المحفظة / الحساب *'}
                  </Label>
                  <Input
                    id="payment_details"
                    value={formData.payment_details}
                    onChange={(e) => setFormData({ ...formData, payment_details: e.target.value })}
                    required
                    dir="ltr"
                    placeholder={formData.payment_method === 'bank_transfer' 
                      ? 'مثال: 1234567890' 
                      : 'مثال: 01XXXXXXXXX'}
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded">
                <h4 className="font-semibold mb-2" dir="rtl">📋 ملاحظات مهمة:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground" dir="rtl">
                  <li>• سيتم مراجعة طلبك خلال 24-48 ساعة</li>
                  <li>• ستحصل على رابط إحالة خاص بك بعد الموافقة</li>
                  <li>• العمولة الأساسية 10% وتزيد مع زيادة المبيعات</li>
                  <li>• يمكنك سحب أرباحك عند الوصول إلى 100 ج.م</li>
                </ul>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                تقديم الطلب
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

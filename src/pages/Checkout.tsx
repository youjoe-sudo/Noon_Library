// صفحة الدفع (Checkout Page) - النسخة النهائية المصلحة بالكامل (No Errors)
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  getAddresses, 
  createOrder, 
  createOrderItems, 
  validateCoupon, 
  incrementCouponUsage, 
  createCouponUsage, 
  calculateShippingCost, 
  getAffiliateByReferralCode,
  recordTrackingConversion 
} from '@/db/api';
import type { Address } from '@/types';
import { Loader2, MapPin, Navigation, X } from 'lucide-react'; // شيلنا Tag اللي مكنتش مستخدمة وضفنا X للـ Coupon

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // تصليح الـ Type Error: خليناه any عشان يتوافق مع أي بيانات راجعة من الـ API
  const [affiliateData, setAffiliateData] = useState<any | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [shippingCost, setShippingCost] = useState(0);
  const [shippingMessage, setShippingMessage] = useState(''); // تم تفعيل استخدامه في الـ UI
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    governorate: '',
    city: '',
    street: '',
    payment_method: 'deposit' as 'deposit' | 'full_payment',
    shipping_method: 'express' as 'express' | 'postal',
    notes: '',
  });

  const governorates = [
    'القاهرة', 'الجيزة', 'محطات المترو', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'القليوبية',
    'كفر الشيخ', 'الغربية', 'المنوفية', 'البحيرة', 'الإسماعيلية', 'بورسعيد',
    'السويس', 'دمياط', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج',
    'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد', 'مطروح',
    'شمال سيناء', 'جنوب سيناء'
  ];

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  useEffect(() => {
    const checkAffiliateCode = async () => {
      const refCode = searchParams.get('ref') || localStorage.getItem('affiliate_ref');
      
      if (refCode) {
        try {
          if (searchParams.get('ref')) {
            localStorage.setItem('affiliate_ref', refCode);
          }
          
          const affiliate = await getAffiliateByReferralCode(refCode);
          if (affiliate && affiliate.status === 'active') {
            setAffiliateData(affiliate);
            console.log('✅ Affiliate tracked:', affiliate.business_name);
          }
        } catch (err) {
          console.error('Error tracking affiliate:', err);
        }
      }
    };
    
    checkAffiliateCode();
  }, [searchParams]);

  const loadAddresses = async () => {
    if (!user) return;
    try {
      const data = await getAddresses(user.id);
      setAddresses(data);
      const defaultAddr = data.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
      if (data.length === 0) {
        setShowNewAddress(true);
      }
    } catch (err) {
      console.error('Error loading addresses:', err);
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({ title: 'خطأ', description: 'المتصفح لا يدعم تحديد الموقع', variant: 'destructive' });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=ar`
          );
          const data = await response.json();
          if (data && data.address) {
            setFormData(prev => ({
              ...prev,
              governorate: data.address.state || data.address.province || '',
              city: data.address.city || data.address.town || data.address.village || '',
              street: data.address.road || data.address.suburb || '',
            }));
            toast({ title: 'تم تحديد الموقع', description: 'تم ملء حقول العنوان تلقائياً' });
          }
        } catch (err) {
          console.error('Error getting address:', err);
        } finally {
          setGettingLocation(false);
        }
      },
      () => {
        toast({ title: 'خطأ', description: 'فشل تحديد الموقع يدوياً', variant: 'destructive' });
        setGettingLocation(false);
      }
    );
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setValidatingCoupon(true);
      const result = await validateCoupon(couponCode.trim().toUpperCase(), cartTotal);
      if (result && result.valid) {
        setAppliedCoupon(result);
        setCouponDiscount(result.discount_amount);
        toast({ title: 'تم تطبيق الكوبون', description: result.message });
      } else {
        toast({ title: 'خطأ', description: result?.message || 'كوبون غير صالح', variant: 'destructive' });
      }
    } finally {
      setValidatingCoupon(false);
    }
  };

  // تم تفعيل الدالة واستخدامها في الـ UI
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    toast({ title: 'تمت إزالة الكوبون' });
  };

  const updateShippingCost = async () => {
    const bookCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const gov = showNewAddress ? formData.governorate : addresses.find(a => a.id === selectedAddressId)?.governorate;

    if (!gov) {
      setShippingCost(0);
      setShippingMessage('');
      return;
    }

    try {
      setCalculatingShipping(true);
      const result = await calculateShippingCost(gov, formData.shipping_method, bookCount, formData.payment_method);
      if (result.success) {
        setShippingCost(result.total_cost || 0);
        setShippingMessage(result.message || '');
      }
    } catch (err) {
      console.error('Shipping calc error:', err);
    } finally {
      setCalculatingShipping(false);
    }
  };

  useEffect(() => {
    if (cartItems.length > 0) updateShippingCost();
  }, [formData.governorate, formData.shipping_method, formData.payment_method, selectedAddressId, cartItems.length, showNewAddress]);

  const subtotalAfterDiscount = Math.max(0, cartTotal - couponDiscount);
  const totalAmount = subtotalAfterDiscount + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || cartItems.length === 0) return;

    if (showNewAddress && (!formData.full_name || !formData.phone || !formData.governorate)) {
      toast({ title: 'خطأ', description: 'يرجى ملء بيانات التوصيل', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);

      const order = await createOrder({
        user_id: user.id,
        total_amount: totalAmount,
        shipping_cost: shippingCost,
        discount_amount: couponDiscount,
        deposit_amount: shippingCost,
        coupon_id: appliedCoupon?.coupon_id || null,
        affiliate_id: affiliateData?.id || null,
        payment_method: formData.payment_method,
        shipping_method: formData.shipping_method,
        status: 'pending_payment',
        address_id: selectedAddressId || null,
        guest_name: showNewAddress ? formData.full_name : null,
        guest_phone: showNewAddress ? formData.phone : null,
        guest_address: showNewAddress ? `${formData.street}, ${formData.city}, ${formData.governorate}` : null,
        notes: formData.notes || null,
      });

      const orderItems = cartItems.map(item => {
        const itemPrice = item.books?.discount_price || item.books?.price || 0;
        let itemCommission = 0;
        
        if (affiliateData && affiliateData.commission_rate) {
          itemCommission = (itemPrice * affiliateData.commission_rate) / 100;
        }

        return {
          order_id: order.id,
          book_id: item.book_id,
          quantity: item.quantity,
          price: itemPrice,
          affiliate_commission: itemCommission * item.quantity,
        };
      });

      await createOrderItems(orderItems);

      const refCode = searchParams.get('ref') || localStorage.getItem('affiliate_ref');
      if (refCode && affiliateData) {
        await recordTrackingConversion(refCode).catch(() => {});
      }

      if (appliedCoupon?.coupon_id) {
        await incrementCouponUsage(appliedCoupon.coupon_id);
        await createCouponUsage({
          coupon_id: appliedCoupon.coupon_id,
          order_id: order.id,
          user_id: user.id,
          discount_amount: couponDiscount,
        });
      }

      await clearCart();
      toast({ title: 'تم إنشاء الطلب', description: `رقم الطلب: ${order.order_number}` });
      navigate(`/payment/${order.id}`);
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-right" dir="rtl">إتمام الطلب 🛒</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* اختيار العنوان */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-right" dir="rtl">عنوان التوصيل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.length > 0 && !showNewAddress ? (
                    <div className="space-y-3">
                      <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                        {addresses.map((addr) => (
                          <div key={addr.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted transition-colors">
                            <RadioGroupItem value={addr.id} id={addr.id} />
                            <Label htmlFor={addr.id} className="flex-1 cursor-pointer text-right" dir="rtl">
                              <div className="font-bold">{addr.full_name}</div>
                              <div className="text-sm text-muted-foreground">{addr.phone}</div>
                              <div className="text-sm">{addr.street}, {addr.city}, {addr.governorate}</div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      <Button type="button" variant="outline" onClick={() => setShowNewAddress(true)} className="w-full">
                        <MapPin className="ml-2 h-4 w-4" /> إضافة عنوان مختلف
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button type="button" variant="secondary" onClick={getCurrentLocation} disabled={gettingLocation} className="w-full">
                        {gettingLocation ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Navigation className="ml-2 h-4 w-4" />}
                        استخدام موقعي الحالي
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input placeholder="الاسم الكامل *" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} dir="rtl" />
                        <Input placeholder="رقم الهاتف *" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} dir="ltr" />
                      </div>
                      <Select value={formData.governorate} onValueChange={v => setFormData({...formData, governorate: v})}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر المحافظة *" /></SelectTrigger>
                        <SelectContent dir="rtl">{governorates.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input placeholder="المدينة / المركز *" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} dir="rtl" />
                      <Textarea placeholder="العنوان بالتفصيل (الشارع / رقم المنزل) *" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} dir="rtl" />
                      {addresses.length > 0 && (
                        <Button type="button" variant="link" onClick={() => setShowNewAddress(false)} className="w-full text-muted-foreground">العودة للعناوين المسجلة</Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* الشحن والدفع */}
              <Card>
                <CardHeader><CardTitle className="text-right" dir="rtl">طريقة الشحن والدفع</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-right block" dir="rtl">وسيلة الشحن:</Label>
                    <RadioGroup value={formData.shipping_method} onValueChange={(v: any) => setFormData({...formData, shipping_method: v})} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <RadioGroupItem value="express" id="express" />
                        <Label htmlFor="express" className="text-right flex-1" dir="rtl">🚚 شحن سريع (مندوب نون)</Label>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg opacity-80">
                        <RadioGroupItem value="postal" id="postal" />
                        <Label htmlFor="postal" className="text-right flex-1" dir="rtl">📮 بريد حكومي (استلام من المكتب)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-right block" dir="rtl">طريقة السداد:</Label>
                    <RadioGroup value={formData.payment_method} onValueChange={(v: any) => setFormData({...formData, payment_method: v})} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <RadioGroupItem value="deposit" id="pay_deposit" />
                        <Label htmlFor="pay_deposit" className="text-right flex-1" dir="rtl">💳 عربون مقدماً + الباقي عند الاستلام</Label>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <RadioGroupItem value="full_payment" id="pay_full" />
                        <Label htmlFor="pay_full" className="text-right flex-1" dir="rtl">💰 دفع المبلغ بالكامل (أسرع في التجهيز)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Textarea 
                    placeholder="هل لديك أي ملاحظات إضافية للطلب؟" 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                    dir="rtl" 
                  />
                </CardContent>
              </Card>
            </div>

            {/* ملخص الحساب */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-primary/20 shadow-lg">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-right" dir="rtl">ملخص الحساب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="space-y-2">
                    <Label className="text-right block text-xs" dir="rtl">كود الخصم:</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="أدخل الكود" 
                        value={couponCode} 
                        onChange={e => setCouponCode(e.target.value.toUpperCase())} 
                        disabled={!!appliedCoupon}
                        dir="ltr"
                        className="text-center font-bold"
                      />
                      {appliedCoupon ? (
                        <Button type="button" variant="destructive" size="icon" onClick={handleRemoveCoupon}><X className="h-4 w-4" /></Button>
                      ) : (
                        <Button type="button" onClick={handleApplyCoupon} disabled={validatingCoupon || !couponCode}>{validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "تطبيق"}</Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between" dir="rtl">
                      <span className="text-muted-foreground">إجمالي الكتب:</span>
                      <span>{cartTotal.toFixed(2)} ج.م</span>
                    </div>
                    
                    {appliedCoupon && (
                      <div className="flex justify-between text-success font-medium" dir="rtl">
                        <span>خصم الكوبون ({appliedCoupon.code}):</span>
                        <span>-{couponDiscount.toFixed(2)} ج.م</span>
                      </div>
                    )}

                    <div className="flex justify-between" dir="rtl">
                      <span className="text-muted-foreground">مصاريف الشحن:</span>
                      <span>{calculatingShipping ? <Loader2 className="h-3 w-3 animate-spin inline" /> : `${shippingCost.toFixed(2)} ج.م`}</span>
                    </div>

                    {shippingMessage && (
                      <p className="text-[10px] text-primary text-right bg-primary/5 p-2 rounded" dir="rtl">ℹ️ {shippingMessage}</p>
                    )}
                  </div>

                  <Separator />
                  
                  <div className="flex justify-between text-xl font-extrabold text-primary" dir="rtl">
                    <span>الإجمالي:</span>
                    <span>{totalAmount.toFixed(2)} ج.م</span>
                  </div>

                  {affiliateData && (
                    <div className="bg-success/10 border border-success/20 p-2 rounded text-[10px] text-center text-success font-medium">
                      ✓ طلبك مدعوم من المسوق: {affiliateData.business_name}
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full text-lg font-bold h-14" disabled={loading || cartItems.length === 0}>
                    {loading ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : "تأكيد والذهاب للدفع"}
                  </Button>
                  
                  <p className="text-[10px] text-muted-foreground text-center" dir="rtl">
                    بالضغط على الزر أعلاه، أنت توافق على سياسة الاستبدال والاسترجاع الخاصة بـ Noon Library.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
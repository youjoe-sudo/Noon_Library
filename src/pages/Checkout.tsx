// صفحة الدفع (Checkout Page)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { getAddresses, createOrder, createOrderItems, validateCoupon, incrementCouponUsage, createCouponUsage, calculateShippingCost } from '@/db/api';
import type { Address } from '@/types';
import { Loader2, MapPin, Tag, Navigation } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // حالة الكوبون (Coupon state)
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // حالة الشحن (Shipping state)
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingMessage, setShippingMessage] = useState('');
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

  const loadAddresses = async () => {
    if (!user) return;
    try {
      const data = await getAddresses(user.id);
      setAddresses(data);
      const defaultAddr = data.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
      // إذا لم يكن هناك عناوين محفوظة، اعرض نموذج العنوان الجديد تلقائياً
      // If no saved addresses, automatically show new address form
      if (data.length === 0) {
        setShowNewAddress(true);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  // الحصول على الموقع الحالي (Get current location)
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: 'خطأ',
        description: 'المتصفح لا يدعم تحديد الموقع',
        variant: 'destructive',
      });
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // استخدام Nominatim API للحصول على العنوان من الإحداثيات (Use Nominatim API to get address from coordinates)
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
            
            toast({
              title: 'تم تحديد الموقع',
              description: 'تم ملء حقول العنوان تلقائياً',
            });
          }
        } catch (error) {
          console.error('Error getting address:', error);
          toast({
            title: 'تنبيه',
            description: 'تم تحديد الموقع ولكن فشل الحصول على تفاصيل العنوان. يرجى إدخال العنوان يدوياً.',
            variant: 'destructive',
          });
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'فشل تحديد الموقع';
        
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'تم رفض إذن الوصول للموقع. يرجى السماح بالوصول للموقع من إعدادات المتصفح.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'معلومات الموقع غير متوفرة';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'انتهت مهلة طلب الموقع';
        }
        
        toast({
          title: 'خطأ',
          description: errorMessage,
          variant: 'destructive',
        });
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // التحقق من الكوبون (Validate coupon)
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال كود الكوبون',
        variant: 'destructive',
      });
      return;
    }

    try {
      setValidatingCoupon(true);
      const result = await validateCoupon(couponCode.trim().toUpperCase(), cartTotal);
      
      if (result && result.valid) {
        setAppliedCoupon(result);
        setCouponDiscount(result.discount_amount);
        toast({
          title: 'تم تطبيق الكوبون',
          description: result.message,
        });
      } else {
        toast({
          title: 'خطأ',
          description: result?.message || 'كوبون غير صالح',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل التحقق من الكوبون',
        variant: 'destructive',
      });
    } finally {
      setValidatingCoupon(false);
    }
  };

  // إزالة الكوبون (Remove coupon)
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
  };

  // حساب تكلفة الشحن ديناميكياً (Calculate shipping cost dynamically)
  const updateShippingCost = async () => {
    const bookCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const governorate = showNewAddress ? formData.governorate : addresses.find(a => a.id === selectedAddressId)?.governorate;

    if (!governorate) {
      setShippingCost(0);
      setShippingMessage('');
      return;
    }

    try {
      setCalculatingShipping(true);
      const result = await calculateShippingCost(
        governorate,
        formData.shipping_method,
        bookCount,
        formData.payment_method
      );

      if (result.success) {
        setShippingCost(result.total_cost || 0);
        setShippingMessage(result.message || '');
      } else {
        setShippingCost(0);
        setShippingMessage(result.error || '');
        toast({
          title: 'تنبيه',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
      setShippingCost(60); // السعر الافتراضي
      setShippingMessage('');
    } finally {
      setCalculatingShipping(false);
    }
  };

  // تحديث تكلفة الشحن عند تغيير المحافظة أو طريقة الشحن أو الدفع
  useEffect(() => {
    if (cartItems.length > 0) {
      updateShippingCost();
    }
  }, [
    formData.governorate,
    formData.shipping_method,
    formData.payment_method,
    selectedAddressId,
    cartItems.length
  ]);
  const subtotalAfterDiscount = Math.max(0, cartTotal - couponDiscount);
  const totalAmount = subtotalAfterDiscount + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (cartItems.length === 0) {
      toast({
        title: 'خطأ',
        description: 'السلة فارغة',
        variant: 'destructive',
      });
      return;
    }

    // التحقق من العنوان (Validate address)
    if (showNewAddress) {
      // التحقق من حقول العنوان الجديد (Validate new address fields)
      if (!formData.full_name || !formData.phone || !formData.governorate || !formData.city || !formData.street) {
        toast({
          title: 'خطأ',
          description: 'يرجى ملء جميع حقول العنوان',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // التحقق من اختيار عنوان محفوظ (Validate saved address selection)
      if (!selectedAddressId) {
        toast({
          title: 'خطأ',
          description: 'يرجى اختيار عنوان التوصيل أو إضافة عنوان جديد',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setLoading(true);

      // إنشاء الطلب (Create order)
      const order = await createOrder({
        user_id: user.id,
        total_amount: totalAmount,
        shipping_cost: shippingCost,
        discount_amount: couponDiscount,
        deposit_amount: shippingCost, // العربون = تكلفة الشحن
        coupon_id: appliedCoupon?.coupon_id || null,
        payment_method: formData.payment_method,
        shipping_method: formData.shipping_method,
        status: 'pending_payment', // حالة انتظار الدفع
        address_id: selectedAddressId || null,
        guest_name: showNewAddress ? formData.full_name : null,
        guest_phone: showNewAddress ? formData.phone : null,
        guest_address: showNewAddress ? `${formData.street}, ${formData.city}, ${formData.governorate}` : null,
        notes: formData.notes || null,
      });

      // إنشاء عناصر الطلب (Create order items)
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        book_id: item.book_id,
        quantity: item.quantity,
        price: item.books?.discount_price || item.books?.price || 0,
        affiliate_commission: 0,
      }));

      await createOrderItems(orderItems);

      // تسجيل استخدام الكوبون (Record coupon usage)
      if (appliedCoupon && appliedCoupon.coupon_id) {
        try {
          await incrementCouponUsage(appliedCoupon.coupon_id);
          await createCouponUsage({
            coupon_id: appliedCoupon.coupon_id,
            order_id: order.id,
            user_id: user.id,
            discount_amount: couponDiscount,
          });
        } catch (error) {
          console.error('Error recording coupon usage:', error);
        }
      }

      // مسح السلة (Clear cart)
      await clearCart();

      toast({
        title: 'تم إنشاء الطلب بنجاح',
        description: `رقم الطلب: ${order.order_number}. سيتم تحويلك لصفحة الدفع...`,
      });

      // التوجيه لصفحة دفع العربون
      navigate(`/payment/${order.id}`);
    } catch (error: any) {
      console.error('Error creating order:', error);
      
      // عرض رسالة خطأ أكثر تفصيلاً (Show more detailed error message)
      let errorMessage = 'فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.';
      
      if (error?.message) {
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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4" dir="rtl">السلة فارغة</h2>
          <Button onClick={() => navigate('/books')}>تصفح الكتب</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8" dir="rtl">إتمام الطلب</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* معلومات التوصيل (Shipping Information) */}
            <div className="lg:col-span-2 space-y-6">
              {/* العنوان (Address) */}
              <Card>
                <CardHeader>
                  <CardTitle dir="rtl">عنوان التوصيل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.length > 0 && !showNewAddress && (
                    <div className="space-y-3">
                      <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                        {addresses.map((addr) => (
                          <div key={addr.id} className="flex items-start gap-3 p-3 border rounded">
                            <RadioGroupItem value={addr.id} id={addr.id} />
                            <Label htmlFor={addr.id} className="flex-1 cursor-pointer">
                              <div className="font-semibold" dir="rtl">{addr.full_name}</div>
                              <div className="text-sm text-muted-foreground" dir="rtl">
                                {addr.phone}
                              </div>
                              <div className="text-sm text-muted-foreground" dir="rtl">
                                {addr.street}, {addr.city}, {addr.governorate}
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewAddress(true)}
                        className="w-full"
                      >
                        <MapPin className="ml-2 h-4 w-4" />
                        إضافة عنوان جديد
                      </Button>
                    </div>
                  )}

                  {(addresses.length === 0 || showNewAddress) && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {showNewAddress && addresses.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowNewAddress(false)}
                            className="flex-1"
                          >
                            اختيار من العناوين المحفوظة
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="default"
                          onClick={getCurrentLocation}
                          disabled={gettingLocation}
                          className={addresses.length > 0 ? "flex-1" : "w-full"}
                        >
                          {gettingLocation ? (
                            <>
                              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                              جاري التحديد...
                            </>
                          ) : (
                            <>
                              <Navigation className="ml-2 h-4 w-4" />
                              تحديد موقعي تلقائياً
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name" dir="rtl">الاسم الكامل *</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                            dir="rtl"
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
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="governorate" dir="rtl">المحافظة *</Label>
                          <Select
                            value={formData.governorate}
                            onValueChange={(value) => setFormData({ ...formData, governorate: value })}
                            required
                          >
                            <SelectTrigger dir="rtl">
                              <SelectValue placeholder="اختر المحافظة" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                              {governorates.map((gov) => (
                                <SelectItem key={gov} value={gov}>
                                  {gov}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city" dir="rtl">المدينة *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            required
                            dir="rtl"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="street" dir="rtl">العنوان بالتفصيل *</Label>
                        <Textarea
                          id="street"
                          value={formData.street}
                          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                          required
                          dir="rtl"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* طريقة الشحن (Shipping Method) */}
              <Card>
                <CardHeader>
                  <CardTitle dir="rtl">طريقة الشحن</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.shipping_method}
                    onValueChange={(value: 'express' | 'postal') => setFormData({ ...formData, shipping_method: value })}
                  >
                    <div className="flex items-start gap-3 p-3 border rounded">
                      <RadioGroupItem value="express" id="express" />
                      <Label htmlFor="express" className="flex-1 cursor-pointer">
                        <div className="font-semibold" dir="rtl">🚚 شحن سريع</div>
                        <div className="text-sm text-muted-foreground" dir="rtl">
                          التوصيل خلال 2-3 أيام عمل
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded">
                      <RadioGroupItem value="postal" id="postal" />
                      <Label htmlFor="postal" className="flex-1 cursor-pointer">
                        <div className="font-semibold" dir="rtl">📮 البريد العادي</div>
                        <div className="text-sm text-muted-foreground" dir="rtl">
                          التوصيل خلال 5-7 أيام عمل - 50 ج.م فقط
                        </div>
                        <div className="text-xs text-amber-600 mt-1" dir="rtl">
                          ⚠️ متاح فقط مع الدفع المسبق الكامل
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* طريقة الدفع (Payment Method) */}
              <Card>
                <CardHeader>
                  <CardTitle dir="rtl">طريقة الدفع</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.payment_method}
                    onValueChange={(value: 'deposit' | 'full_payment') => setFormData({ ...formData, payment_method: value })}
                  >
                    <div className="flex items-start gap-3 p-3 border rounded">
                      <RadioGroupItem value="deposit" id="deposit" />
                      <Label htmlFor="deposit" className="flex-1 cursor-pointer">
                        <div className="font-semibold" dir="rtl">💳 دفع عربون (للشحن السريع)</div>
                        <div className="text-sm text-muted-foreground" dir="rtl">
                          ادفع عربون الآن والباقي عند الاستلام
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded">
                      <RadioGroupItem value="full_payment" id="full_payment" />
                      <Label htmlFor="full_payment" className="flex-1 cursor-pointer">
                        <div className="font-semibold" dir="rtl">💰 دفع كامل (للبريد العادي)</div>
                        <div className="text-sm text-muted-foreground" dir="rtl">
                          ادفع المبلغ كاملاً الآن
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* ملاحظات (Notes) */}
              <Card>
                <CardHeader>
                  <CardTitle dir="rtl">ملاحظات إضافية (اختياري)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="أي ملاحظات خاصة بالطلب..."
                    dir="rtl"
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* ملخص الطلب (Order Summary) */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle dir="rtl">ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* كود الخصم (Coupon Code) */}
                  <div className="space-y-2">
                    <Label htmlFor="coupon" dir="rtl">كود الخصم (اختياري)</Label>
                    {appliedCoupon ? (
                      <div className="flex items-center gap-2 p-3 bg-success/10 border border-success rounded-md">
                        <Tag className="h-4 w-4 text-success" />
                        <span className="flex-1 text-sm font-medium text-success" dir="rtl">
                          تم تطبيق الكوبون: {couponCode}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCoupon}
                          className="h-auto p-1"
                        >
                          إزالة
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          id="coupon"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="أدخل كود الخصم"
                          dir="ltr"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon || !couponCode.trim()}
                        >
                          {validatingCoupon ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'تطبيق'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    {cartItems.map((item) => {
                      const book = item.books;
                      if (!book) return null;
                      const price = book.discount_price || book.price;
                      return (
                        <div key={item.id} className="flex justify-between text-sm" dir="rtl">
                          <span>{book.title_ar} × {item.quantity}</span>
                          <span>{(price * item.quantity).toFixed(2)} ج.م</span>
                        </div>
                      );
                    })}
                  </div>
                  <Separator />
                  <div className="flex justify-between" dir="rtl">
                    <span>المجموع الفرعي:</span>
                    <span className="font-semibold">{cartTotal.toFixed(2)} ج.م</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-success" dir="rtl">
                      <span>الخصم:</span>
                      <span className="font-semibold">-{couponDiscount.toFixed(2)} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between" dir="rtl">
                    <span>الشحن:</span>
                    <span className="font-semibold">
                      {calculatingShipping ? (
                        <Loader2 className="h-4 w-4 animate-spin inline" />
                      ) : (
                        shippingCost === 0 ? 'مجاني' : `${shippingCost.toFixed(2)} ج.م`
                      )}
                    </span>
                  </div>
                  {shippingMessage && (
                    <div className="text-xs text-muted-foreground" dir="rtl">
                      ℹ️ {shippingMessage}
                    </div>
                  )}
                  {cartTotal >= 500 && (
                    <div className="text-sm text-success" dir="rtl">
                      ✓ شحن مجاني للطلبات فوق 500 ج.م
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold" dir="rtl">
                    <span>الإجمالي:</span>
                    <span className="text-primary">{totalAmount.toFixed(2)} ج.م</span>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    تأكيد الطلب
                  </Button>
                  <p className="text-xs text-muted-foreground text-center" dir="rtl">
                    بالضغط على "تأكيد الطلب" فإنك توافق على شروط الخدمة
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

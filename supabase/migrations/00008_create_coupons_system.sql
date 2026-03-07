-- إنشاء نوع خصم الكوبون (Create coupon discount type enum)
CREATE TYPE public.coupon_discount_type AS ENUM ('percentage', 'fixed');

-- إنشاء جدول الكوبونات (Create coupons table)
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type public.coupon_discount_type NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0.00,
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0 NOT NULL,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  valid_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_affiliate ON public.coupons(affiliate_id);

-- إنشاء جدول استخدام الكوبونات (Create coupon usage table)
CREATE TABLE public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_order ON public.coupon_usage(order_id);
CREATE INDEX idx_coupon_usage_user ON public.coupon_usage(user_id);

-- إضافة حقول الكوبون للطلبات (Add coupon fields to orders)
ALTER TABLE public.orders
ADD COLUMN coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0.00 NOT NULL;

-- سياسات الأمان للكوبونات (Coupons security policies)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Affiliates can create their coupons" ON public.coupons
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can view their coupons" ON public.coupons
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all coupons" ON public.coupons
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- سياسات الأمان لاستخدام الكوبونات (Coupon usage security policies)
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their coupon usage" ON public.coupon_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert coupon usage" ON public.coupon_usage
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can view all coupon usage" ON public.coupon_usage
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- دالة للتحقق من صحة الكوبون (Function to validate coupon)
CREATE OR REPLACE FUNCTION public.validate_coupon(
  coupon_code TEXT,
  order_amount DECIMAL
)
RETURNS TABLE(
  valid BOOLEAN,
  discount_amount DECIMAL,
  message TEXT,
  coupon_id UUID
) LANGUAGE plpgsql AS $$
DECLARE
  v_coupon RECORD;
  v_discount DECIMAL;
BEGIN
  -- البحث عن الكوبون (Find coupon)
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = coupon_code AND is_active = true;

  -- التحقق من وجود الكوبون (Check if coupon exists)
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0.00::DECIMAL, 'كوبون غير صالح'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- التحقق من تاريخ الصلاحية (Check validity dates)
  IF v_coupon.valid_from > NOW() THEN
    RETURN QUERY SELECT false, 0.00::DECIMAL, 'الكوبون غير نشط بعد'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
    RETURN QUERY SELECT false, 0.00::DECIMAL, 'انتهت صلاحية الكوبون'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- التحقق من حد الاستخدام (Check usage limit)
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT false, 0.00::DECIMAL, 'تم استخدام الكوبون بالكامل'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- التحقق من الحد الأدنى للشراء (Check minimum purchase)
  IF order_amount < v_coupon.min_purchase_amount THEN
    RETURN QUERY SELECT false, 0.00::DECIMAL, 
      'الحد الأدنى للشراء: ' || v_coupon.min_purchase_amount || ' ج.م'::TEXT, 
      NULL::UUID;
    RETURN;
  END IF;

  -- حساب الخصم (Calculate discount)
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := order_amount * (v_coupon.discount_value / 100);
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;

  -- تطبيق الحد الأقصى للخصم (Apply max discount)
  IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
    v_discount := v_coupon.max_discount_amount;
  END IF;

  -- التأكد من عدم تجاوز الخصم لقيمة الطلب (Ensure discount doesn't exceed order amount)
  IF v_discount > order_amount THEN
    v_discount := order_amount;
  END IF;

  RETURN QUERY SELECT true, v_discount, 'تم تطبيق الكوبون بنجاح'::TEXT, v_coupon.id;
END;
$$;

COMMENT ON TABLE public.coupons IS 'جدول الكوبونات والخصومات';
COMMENT ON TABLE public.coupon_usage IS 'جدول تتبع استخدام الكوبونات';
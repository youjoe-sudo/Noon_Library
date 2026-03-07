-- إنشاء جدول قواعد الشحن (Shipping Rules Table)
CREATE TABLE IF NOT EXISTS shipping_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name TEXT NOT NULL UNIQUE,
  region_type TEXT NOT NULL CHECK (region_type IN ('cairo_giza', 'metro', 'lower_egypt', 'upper_egypt', 'remote', 'postal')),
  base_cost DECIMAL(10, 2) NOT NULL,
  governorates TEXT[] NOT NULL,
  requires_prepayment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- إدراج قواعد الشحن الافتراضية
INSERT INTO shipping_rules (region_name, region_type, base_cost, governorates, requires_prepayment) VALUES
  ('القاهرة والجيزة', 'cairo_giza', 60.00, ARRAY['القاهرة', 'الجيزة'], false),
  ('محطات المترو', 'metro', 50.00, ARRAY['محطات المترو'], false),
  ('وجه بحري والقناة', 'lower_egypt', 80.00, ARRAY['الإسكندرية', 'الدقهلية', 'الشرقية', 'القليوبية', 'كفر الشيخ', 'الغربية', 'المنوفية', 'البحيرة', 'الإسماعيلية', 'بورسعيد', 'السويس', 'دمياط'], false),
  ('وجه قبلي', 'upper_egypt', 85.00, ARRAY['الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان'], false),
  ('المحافظات النائية', 'remote', 120.00, ARRAY['مطروح', 'شمال سيناء', 'جنوب سيناء', 'البحر الأحمر', 'الوادي الجديد'], false),
  ('شحن البريد', 'postal', 50.00, ARRAY['جميع المحافظات'], true)
ON CONFLICT (region_name) DO NOTHING;

-- دالة لحساب تكلفة الشحن
CREATE OR REPLACE FUNCTION calculate_shipping_cost(
  governorate_param TEXT,
  shipping_method_param TEXT,
  book_count_param INTEGER,
  payment_method_param TEXT
)
RETURNS JSON AS $$
DECLARE
  base_cost DECIMAL(10, 2);
  extra_cost DECIMAL(10, 2) := 0;
  total_cost DECIMAL(10, 2);
  region_info RECORD;
  result JSON;
BEGIN
  -- التحقق من طريقة الشحن
  IF shipping_method_param = 'postal' THEN
    -- شحن البريد: 50 ج.م (متاح فقط مع الدفع المسبق)
    IF payment_method_param != 'full_payment' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'شحن البريد متاح فقط مع الدفع المسبق الكامل',
        'cost', 0
      );
    END IF;
    base_cost := 50.00;
  ELSE
    -- شحن عادي: حسب المحافظة
    -- البحث عن المحافظة في قواعد الشحن
    SELECT base_cost, region_name, region_type
    INTO region_info
    FROM shipping_rules
    WHERE governorate_param = ANY(governorates)
      AND region_type != 'postal'
    LIMIT 1;

    -- إذا لم يتم العثور على المحافظة، استخدام السعر الافتراضي
    IF NOT FOUND THEN
      base_cost := 80.00; -- السعر الافتراضي
    ELSE
      base_cost := region_info.base_cost;
    END IF;
  END IF;

  -- حساب التكلفة الإضافية للكتب الزائدة عن 10
  IF book_count_param > 10 THEN
    extra_cost := (book_count_param - 10) * 5.00; -- 5 ج.م لكل كتاب إضافي
  END IF;

  total_cost := base_cost + extra_cost;

  result := json_build_object(
    'success', true,
    'base_cost', base_cost,
    'extra_cost', extra_cost,
    'total_cost', total_cost,
    'book_count', book_count_param,
    'message', CASE 
      WHEN book_count_param > 10 THEN 'تم إضافة ' || extra_cost || ' ج.م لـ ' || (book_count_param - 10) || ' كتاب إضافي'
      ELSE 'تكلفة الشحن الأساسية'
    END
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- سياسات الأمان لجدول قواعد الشحن
ALTER TABLE shipping_rules ENABLE ROW LEVEL SECURITY;

-- الجميع يمكنهم قراءة قواعد الشحن
CREATE POLICY "Anyone can view shipping rules"
  ON shipping_rules FOR SELECT
  USING (true);

-- الإدارة فقط يمكنها تعديل قواعد الشحن
CREATE POLICY "Admins can manage shipping rules"
  ON shipping_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
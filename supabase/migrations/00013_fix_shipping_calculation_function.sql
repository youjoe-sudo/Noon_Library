-- إصلاح دالة حساب تكلفة الشحن (Fix shipping cost calculation function)
CREATE OR REPLACE FUNCTION calculate_shipping_cost(
  governorate_param TEXT,
  shipping_method_param TEXT,
  book_count_param INTEGER,
  payment_method_param TEXT
)
RETURNS JSON AS $$
DECLARE
  shipping_base_cost DECIMAL(10, 2);
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
    shipping_base_cost := 50.00;
  ELSE
    -- شحن عادي: حسب المحافظة
    -- البحث عن المحافظة في قواعد الشحن
    SELECT sr.base_cost, sr.region_name, sr.region_type
    INTO region_info
    FROM shipping_rules sr
    WHERE governorate_param = ANY(sr.governorates)
      AND sr.region_type != 'postal'
    LIMIT 1;

    -- إذا لم يتم العثور على المحافظة، استخدام السعر الافتراضي
    IF NOT FOUND THEN
      shipping_base_cost := 80.00; -- السعر الافتراضي
    ELSE
      shipping_base_cost := region_info.base_cost;
    END IF;
  END IF;

  -- حساب التكلفة الإضافية للكتب الزائدة عن 10
  IF book_count_param > 10 THEN
    extra_cost := (book_count_param - 10) * 5.00; -- 5 ج.م لكل كتاب إضافي
  END IF;

  total_cost := shipping_base_cost + extra_cost;

  result := json_build_object(
    'success', true,
    'base_cost', shipping_base_cost,
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
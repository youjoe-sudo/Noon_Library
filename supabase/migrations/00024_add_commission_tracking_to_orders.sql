-- إضافة حقول العمولة إلى جدول orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0.00;

-- إنشاء دالة لحساب العمولة (Calculate Commission Function)
CREATE OR REPLACE FUNCTION calculate_order_commission()
RETURNS TRIGGER AS $$
DECLARE
  affiliate_commission_rate DECIMAL(5,2);
  calculated_commission DECIMAL(10,2);
BEGIN
  -- إذا كان هناك affiliate_id، احسب العمولة
  IF NEW.affiliate_id IS NOT NULL THEN
    -- الحصول على نسبة العمولة من جدول affiliates
    SELECT commission_rate INTO affiliate_commission_rate
    FROM affiliates
    WHERE id = NEW.affiliate_id;
    
    -- حساب العمولة
    IF affiliate_commission_rate IS NOT NULL THEN
      calculated_commission := (NEW.total_amount * affiliate_commission_rate / 100);
      NEW.commission_rate := affiliate_commission_rate;
      NEW.commission_amount := calculated_commission;
    END IF;
  ELSE
    -- إذا لم يكن هناك مسوق، العمولة = 0
    NEW.commission_rate := 0;
    NEW.commission_amount := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لحساب العمولة عند إنشاء أو تحديث الطلب
DROP TRIGGER IF EXISTS calculate_commission_on_order ON orders;
CREATE TRIGGER calculate_commission_on_order
  BEFORE INSERT OR UPDATE OF total_amount, affiliate_id ON orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_commission();

-- إنشاء دالة لتحديث أرباح المسوق (Update Affiliate Earnings Function)
CREATE OR REPLACE FUNCTION update_affiliate_earnings()
RETURNS TRIGGER AS $$
BEGIN
  -- عند تغيير حالة الطلب إلى "delivered"، أضف العمولة إلى total_earnings
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.affiliate_id IS NOT NULL THEN
    UPDATE affiliates
    SET 
      total_earnings = total_earnings + NEW.commission_amount,
      pending_earnings = GREATEST(pending_earnings - NEW.commission_amount, 0)
    WHERE id = NEW.affiliate_id;
  END IF;
  
  -- عند تغيير حالة الطلب إلى "confirmed"، أضف العمولة إلى pending_earnings
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' AND NEW.affiliate_id IS NOT NULL THEN
    UPDATE affiliates
    SET pending_earnings = pending_earnings + NEW.commission_amount
    WHERE id = NEW.affiliate_id;
  END IF;
  
  -- عند إلغاء الطلب، اطرح العمولة من pending_earnings
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND NEW.affiliate_id IS NOT NULL THEN
    UPDATE affiliates
    SET pending_earnings = GREATEST(pending_earnings - NEW.commission_amount, 0)
    WHERE id = NEW.affiliate_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لتحديث أرباح المسوق عند تغيير حالة الطلب
DROP TRIGGER IF EXISTS update_earnings_on_order_status ON orders;
CREATE TRIGGER update_earnings_on_order_status
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_earnings();

-- تحديث العمولات للطلبات الموجودة
UPDATE orders
SET 
  commission_rate = COALESCE((SELECT commission_rate FROM affiliates WHERE id = orders.affiliate_id), 0),
  commission_amount = CASE 
    WHEN affiliate_id IS NOT NULL THEN 
      (total_amount * COALESCE((SELECT commission_rate FROM affiliates WHERE id = orders.affiliate_id), 0) / 100)
    ELSE 0
  END
WHERE affiliate_id IS NOT NULL;
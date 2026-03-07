-- إضافة حقل طريقة الدفع للمسوقين (Add payment method field for affiliates)
ALTER TABLE affiliates
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_details TEXT;

-- إضافة جدول لتتبع الروابط والنقرات (Add table for tracking links and clicks)
CREATE TABLE IF NOT EXISTS affiliate_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  tracking_code TEXT NOT NULL UNIQUE,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_click_at TIMESTAMPTZ
);

-- إنشاء فهرس للبحث السريع (Create index for fast lookup)
CREATE INDEX IF NOT EXISTS idx_affiliate_tracking_code ON affiliate_tracking(tracking_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_tracking_affiliate_id ON affiliate_tracking(affiliate_id);

-- إضافة جدول لإشعارات الإدارة (Add table for admin notifications)
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- دالة لإنشاء كود تتبع فريد (Function to create unique tracking code)
CREATE OR REPLACE FUNCTION generate_tracking_code(affiliate_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- إنشاء كود عشوائي من 8 أحرف (Generate random 8-character code)
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- التحقق من عدم وجود الكود (Check if code doesn't exist)
    SELECT EXISTS(SELECT 1 FROM affiliate_tracking WHERE tracking_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- إدراج الكود الجديد (Insert new code)
  INSERT INTO affiliate_tracking (affiliate_id, tracking_code)
  VALUES (affiliate_id_param, new_code);
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- دالة لتسجيل نقرة على رابط التتبع (Function to record tracking link click)
CREATE OR REPLACE FUNCTION record_tracking_click(tracking_code_param TEXT)
RETURNS JSONB AS $$
DECLARE
  tracking_record RECORD;
BEGIN
  -- تحديث عداد النقرات (Update click counter)
  UPDATE affiliate_tracking
  SET clicks = clicks + 1,
      last_click_at = NOW()
  WHERE tracking_code = tracking_code_param
  RETURNING * INTO tracking_record;
  
  IF tracking_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'كود التتبع غير صحيح');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'affiliate_id', tracking_record.affiliate_id,
    'tracking_code', tracking_record.tracking_code
  );
END;
$$ LANGUAGE plpgsql;

-- دالة لتسجيل تحويل (عملية شراء) (Function to record conversion)
CREATE OR REPLACE FUNCTION record_tracking_conversion(tracking_code_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE affiliate_tracking
  SET conversions = conversions + 1
  WHERE tracking_code = tracking_code_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- دالة للتحقق من وصول المسوق لحد الأرباح (Function to check if affiliate reached earnings threshold)
CREATE OR REPLACE FUNCTION check_affiliate_earnings_threshold()
RETURNS TRIGGER AS $$
DECLARE
  threshold_amount NUMERIC := 1000; -- الحد الأدنى للإشعار: 1000 جنيه
  affiliate_record RECORD;
BEGIN
  -- الحصول على بيانات المسوق (Get affiliate data)
  SELECT * INTO affiliate_record
  FROM affiliates
  WHERE id = NEW.affiliate_id;
  
  -- التحقق من وصول الأرباح المعلقة للحد الأدنى (Check if pending earnings reached threshold)
  IF affiliate_record.pending_earnings >= threshold_amount THEN
    -- إنشاء إشعار للإدارة (Create admin notification)
    INSERT INTO admin_notifications (type, title, message, affiliate_id)
    VALUES (
      'affiliate_earnings',
      'مسوق وصل للحد الأدنى للسحب',
      'المسوق ' || affiliate_record.business_name || ' وصل لرصيد ' || affiliate_record.pending_earnings || ' ج.م',
      NEW.affiliate_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger للتحقق من الأرباح عند تحديث الطلبات (Create trigger to check earnings on order update)
DROP TRIGGER IF EXISTS trigger_check_earnings_threshold ON orders;
CREATE TRIGGER trigger_check_earnings_threshold
AFTER UPDATE OF status ON orders
FOR EACH ROW
WHEN (NEW.status = 'delivered' AND NEW.affiliate_id IS NOT NULL)
EXECUTE FUNCTION check_affiliate_earnings_threshold();

-- سياسات الأمان (Security policies)
ALTER TABLE affiliate_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- المسوقون يمكنهم رؤية روابطهم فقط (Affiliates can only see their own tracking links)
CREATE POLICY "affiliates_view_own_tracking" ON affiliate_tracking
FOR SELECT
USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  )
);

-- المسؤولون يمكنهم رؤية كل شيء (Admins can see everything)
CREATE POLICY "admins_view_all_tracking" ON affiliate_tracking
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- المسؤولون فقط يمكنهم رؤية الإشعارات (Only admins can see notifications)
CREATE POLICY "admins_view_notifications" ON admin_notifications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- الجميع يمكنهم تسجيل النقرات (Everyone can record clicks - for public tracking)
CREATE POLICY "public_record_clicks" ON affiliate_tracking
FOR UPDATE
USING (true);

COMMENT ON TABLE affiliate_tracking IS 'جدول تتبع روابط المسوقين والنقرات والتحويلات';
COMMENT ON TABLE admin_notifications IS 'إشعارات الإدارة عن المسوقين والطلبات';
COMMENT ON COLUMN affiliates.payment_method IS 'طريقة استلام الأرباح (فودافون كاش، InstaPay، إلخ)';
COMMENT ON COLUMN affiliates.payment_details IS 'تفاصيل الدفع (رقم المحفظة، رقم الحساب، إلخ)';
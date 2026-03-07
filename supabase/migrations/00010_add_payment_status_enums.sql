-- إضافة حالات جديدة لحالة الطلب
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending_payment';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_rejected';

-- تحديث جدول إيصالات الدفع لإضافة الحقول المطلوبة
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_receipts' AND column_name = 'phone_from') THEN
    ALTER TABLE payment_receipts ADD COLUMN phone_from TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_receipts' AND column_name = 'receipt_number') THEN
    ALTER TABLE payment_receipts ADD COLUMN receipt_number TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_receipts' AND column_name = 'admin_notes') THEN
    ALTER TABLE payment_receipts ADD COLUMN admin_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_receipts' AND column_name = 'updated_at') THEN
    ALTER TABLE payment_receipts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_receipts' AND column_name = 'image_url') THEN
    ALTER TABLE payment_receipts RENAME COLUMN image_url TO receipt_image_url;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deposit_amount') THEN
    ALTER TABLE orders ADD COLUMN deposit_amount DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- دالة لتحديث حالة الطلب عند الموافقة على الإيصال
CREATE OR REPLACE FUNCTION approve_payment_receipt(
  receipt_id_param UUID,
  admin_id_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  order_id_var UUID;
  result JSON;
BEGIN
  UPDATE payment_receipts
  SET 
    status = 'approved',
    admin_notes = notes_param,
    reviewed_by = admin_id_param,
    reviewed_at = now(),
    updated_at = now()
  WHERE id = receipt_id_param
  RETURNING order_id INTO order_id_var;

  UPDATE orders
  SET 
    status = 'confirmed',
    updated_at = now()
  WHERE id = order_id_var;

  result := json_build_object(
    'success', true,
    'message', 'تم الموافقة على الإيصال وتأكيد الطلب'
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لرفض الإيصال وإرسال إشعار
CREATE OR REPLACE FUNCTION reject_payment_receipt(
  receipt_id_param UUID,
  admin_id_param UUID,
  notes_param TEXT
)
RETURNS JSON AS $$
DECLARE
  order_record RECORD;
  result JSON;
BEGIN
  SELECT o.id, o.order_number, o.user_id, o.total_amount
  INTO order_record
  FROM payment_receipts pr
  JOIN orders o ON pr.order_id = o.id
  WHERE pr.id = receipt_id_param;

  UPDATE payment_receipts
  SET 
    status = 'rejected',
    admin_notes = notes_param,
    reviewed_by = admin_id_param,
    reviewed_at = now(),
    updated_at = now()
  WHERE id = receipt_id_param;

  UPDATE orders
  SET 
    status = 'payment_rejected',
    updated_at = now()
  WHERE id = order_record.id;

  INSERT INTO notifications (user_id, type, title, message, related_id)
  VALUES (
    order_record.user_id,
    'payment_rejected',
    'تم رفض إيصال الدفع',
    'عذراً، تم رفض إيصال الدفع للطلب #' || order_record.order_number || '. السبب: ' || notes_param,
    order_record.id
  );

  result := json_build_object(
    'success', true,
    'message', 'تم رفض الإيصال وإرسال إشعار للعميل'
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
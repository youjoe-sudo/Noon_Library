-- إنشاء نوع نوع الإشعار (Create notification type enum)
CREATE TYPE public.notification_type AS ENUM ('order', 'payment', 'affiliate', 'system', 'inventory');

-- إنشاء جدول الإشعارات (Create notifications table)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title_ar TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read) WHERE is_read = FALSE;

-- سياسات الأمان للإشعارات (Notifications security policies)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (TRUE);

-- إنشاء حاويات التخزين (Create storage buckets)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('app-9bhb4jqwpi4h_book_covers', 'app-9bhb4jqwpi4h_book_covers', TRUE),
  ('app-9bhb4jqwpi4h_payment_receipts', 'app-9bhb4jqwpi4h_payment_receipts', FALSE)
ON CONFLICT (id) DO NOTHING;

-- سياسات التخزين لأغلفة الكتب (Storage policies for book covers)
CREATE POLICY "Anyone can view book covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-9bhb4jqwpi4h_book_covers');

CREATE POLICY "Admins can upload book covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'app-9bhb4jqwpi4h_book_covers' 
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can update book covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'app-9bhb4jqwpi4h_book_covers' 
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete book covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'app-9bhb4jqwpi4h_book_covers' 
    AND public.is_admin(auth.uid())
  );

-- سياسات التخزين لإيصالات الدفع (Storage policies for payment receipts)
CREATE POLICY "Users can view their receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'app-9bhb4jqwpi4h_payment_receipts'
    AND (
      public.is_admin(auth.uid())
      OR (storage.foldername(name))[1] = auth.uid()::TEXT
    )
  );

CREATE POLICY "Users can upload their receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'app-9bhb4jqwpi4h_payment_receipts'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- دالة لتحديث المخزون بعد الطلب (Function to update inventory after order)
CREATE OR REPLACE FUNCTION public.update_inventory_after_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.books
  SET stock = stock - NEW.quantity
  WHERE id = NEW.book_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_after_order();
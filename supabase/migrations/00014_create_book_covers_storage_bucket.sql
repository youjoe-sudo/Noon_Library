-- إنشاء bucket لأغلفة الكتب في Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Admins can upload book covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view book covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete book covers" ON storage.objects;

-- سياسات Storage لأغلفة الكتب
CREATE POLICY "Admins can upload book covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'book-covers' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view book covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-covers');

CREATE POLICY "Admins can delete book covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'book-covers' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
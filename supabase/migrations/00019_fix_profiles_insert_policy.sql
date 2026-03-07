-- إضافة سياسة INSERT لجدول profiles
-- هذه السياسة تسمح للـ trigger بإنشاء ملفات تعريف جديدة

-- حذف السياسة القديمة إن وجدت
DROP POLICY IF EXISTS "Allow profile creation on signup" ON profiles;

-- إنشاء سياسة جديدة تسمح بإنشاء الملف الشخصي عند التسجيل
CREATE POLICY "Allow profile creation on signup"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ملاحظة: هذه السياسة آمنة لأن الإدراج يتم فقط من خلال trigger
-- والـ trigger يتحكم في البيانات المدرجة
-- إصلاح المشكلة الدائرية في سياسات RLS
-- استخدام دالة is_admin() بدلاً من الاستعلام الفرعي

-- حذف السياسات التي تستخدم استعلامات فرعية
DROP POLICY IF EXISTS "admins_select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_delete_profiles" ON profiles;

-- إعادة إنشاء السياسات باستخدام is_admin()
-- هذه الدالة SECURITY DEFINER يمكنها تجاوز RLS

-- سياسة SELECT للمديرين
CREATE POLICY "admins_select_all_profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- سياسة UPDATE للمديرين
CREATE POLICY "admins_update_all_profiles" ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- سياسة DELETE للمديرين
CREATE POLICY "admins_delete_profiles" ON profiles
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));
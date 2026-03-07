-- إصلاح سياسات RLS لجدول profiles
-- حذف جميع السياسات القديمة وإنشاء سياسات جديدة بسيطة وواضحة

-- حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON profiles;

-- سياسة SELECT: المستخدمون يمكنهم قراءة ملفهم الشخصي
CREATE POLICY "users_select_own_profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- سياسة SELECT: المديرون يمكنهم قراءة جميع الملفات الشخصية
CREATE POLICY "admins_select_all_profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_role
    )
  );

-- سياسة INSERT: السماح بإنشاء الملف الشخصي عند التسجيل
CREATE POLICY "allow_profile_creation" ON profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

-- سياسة UPDATE: المستخدمون يمكنهم تحديث ملفهم الشخصي (بدون تغيير الدور)
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- سياسة UPDATE: المديرون يمكنهم تحديث جميع الملفات الشخصية
CREATE POLICY "admins_update_all_profiles" ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_role
    )
  );

-- سياسة DELETE: المديرون فقط يمكنهم حذف الملفات الشخصية
CREATE POLICY "admins_delete_profiles" ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_role
    )
  );
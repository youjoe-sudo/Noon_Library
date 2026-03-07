-- إصلاح إنشاء ملف المستخدم (Fix user profile creation)

-- حذف المشغل والدالة القديمة
DROP TRIGGER IF EXISTS set_first_user_as_admin ON profiles;
DROP FUNCTION IF EXISTS make_first_user_admin();

-- تحديث دالة handle_new_user لتعمل بشكل صحيح
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INT;
BEGIN
  -- عد المستخدمين الموجودين في auth.users (وليس profiles)
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- إدراج ملف تعريف مع الحقول الصحيحة
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(NEW.email, '@', 1),
    -- أول مستخدم يكون مدير، الباقي مستخدمين عاديين
    CASE WHEN user_count <= 1 THEN 'admin'::public.user_role ELSE 'customer'::public.user_role END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- التأكد من وجود المشغل
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
-- إصلاح دالة handle_new_user لاستخدام 'user' بدلاً من 'customer'

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INT;
BEGIN
  -- عد المديرين الموجودين في profiles
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  
  -- إدراج ملف تعريف مع الحقول الصحيحة
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(NEW.email, '@', 1),
    -- إذا لم يكن هناك مدير، اجعل هذا المستخدم مديراً
    CASE WHEN admin_count = 0 THEN 'admin'::public.user_role 
         ELSE 'user'::public.user_role END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
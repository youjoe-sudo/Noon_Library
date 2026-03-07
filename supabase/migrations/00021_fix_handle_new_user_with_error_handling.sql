-- تحسين دالة handle_new_user مع معالجة أفضل للأخطاء

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INT;
  new_role public.user_role;
BEGIN
  -- عد المديرين الموجودين في profiles
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  
  -- تحديد الدور
  IF admin_count = 0 THEN
    new_role := 'admin'::public.user_role;
    RAISE NOTICE 'Creating first user as admin: %', NEW.email;
  ELSE
    new_role := 'user'::public.user_role;
    RAISE NOTICE 'Creating regular user: %', NEW.email;
  END IF;
  
  -- إدراج ملف تعريف مع معالجة الأخطاء
  BEGIN
    INSERT INTO public.profiles (id, email, username, role)
    VALUES (
      NEW.id,
      NEW.email,
      SPLIT_PART(NEW.email, '@', 1),
      new_role
    );
    RAISE NOTICE 'Profile created successfully for user: %', NEW.email;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'Profile already exists for user: %', NEW.email;
      -- لا نرمي خطأ، فقط نسجل الملاحظة
    WHEN foreign_key_violation THEN
      RAISE WARNING 'Foreign key violation for user: %', NEW.email;
      RAISE;
    WHEN OTHERS THEN
      RAISE WARNING 'Error creating profile for user %: % %', NEW.email, SQLERRM, SQLSTATE;
      RAISE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- دالة لجعل أول مستخدم مديراً (Function to make first user admin)

CREATE OR REPLACE FUNCTION make_first_user_admin()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- عد المستخدمين الموجودين
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- إذا كان هذا أول مستخدم، اجعله مديراً
  IF user_count = 0 THEN
    NEW.role := 'admin';
    RAISE NOTICE 'أول مستخدم تم تعيينه كمدير';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف المشغل القديم إن وجد
DROP TRIGGER IF EXISTS set_first_user_as_admin ON profiles;

-- إنشاء المشغل
CREATE TRIGGER set_first_user_as_admin
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION make_first_user_admin();
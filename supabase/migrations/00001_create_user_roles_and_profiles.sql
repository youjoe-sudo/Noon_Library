-- إنشاء نوع دور المستخدم (Create user role enum)
CREATE TYPE public.user_role AS ENUM ('user', 'affiliate', 'admin');

-- إنشاء جدول الملفات الشخصية (Create profiles table)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE,
  role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
  phone TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- إنشاء دالة مساعدة للتحقق من المشرف (Helper function to check admin)
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.role = 'admin'::public.user_role
  );
$$;

-- إنشاء دالة مزامنة المستخدم الجديد (Create user sync function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- إدراج ملف تعريف متزامن مع الحقول المجمعة عند التسجيل
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(NEW.email, '@', 1),
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  RETURN NEW;
END;
$$;

-- إنشاء مشغل لمزامنة المستخدمين (Create trigger for user sync)
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- سياسات الأمان للملفات الشخصية (Profiles security policies)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- إنشاء عرض للملفات العامة (Create public profiles view)
CREATE VIEW public.public_profiles AS
  SELECT id, username, role, created_at FROM public.profiles;
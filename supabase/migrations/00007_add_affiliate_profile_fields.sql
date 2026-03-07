-- إضافة حقول الملف الشخصي للمسوقين (Add affiliate profile fields)
ALTER TABLE public.affiliates
ADD COLUMN business_name TEXT NOT NULL DEFAULT 'مسوق',
ADD COLUMN phone TEXT NOT NULL DEFAULT '',
ADD COLUMN website TEXT,
ADD COLUMN social_media TEXT,
ADD COLUMN marketing_experience TEXT,
ADD COLUMN commission_rate DECIMAL(5, 2) DEFAULT 10.00 NOT NULL;

-- إزالة القيم الافتراضية بعد الإضافة (Remove defaults after adding)
ALTER TABLE public.affiliates
ALTER COLUMN business_name DROP DEFAULT,
ALTER COLUMN phone DROP DEFAULT;

COMMENT ON COLUMN public.affiliates.business_name IS 'اسم العمل أو الاسم التجاري للمسوق';
COMMENT ON COLUMN public.affiliates.phone IS 'رقم هاتف المسوق';
COMMENT ON COLUMN public.affiliates.website IS 'الموقع الإلكتروني للمسوق (اختياري)';
COMMENT ON COLUMN public.affiliates.social_media IS 'حسابات التواصل الاجتماعي (اختياري)';
COMMENT ON COLUMN public.affiliates.marketing_experience IS 'الخبرة التسويقية (اختياري)';
COMMENT ON COLUMN public.affiliates.commission_rate IS 'نسبة العمولة للمسوق';
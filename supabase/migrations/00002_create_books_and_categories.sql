-- إنشاء جدول الكتب (Create books table)
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  author_ar TEXT NOT NULL,
  description_ar TEXT,
  price DECIMAL(10, 2) NOT NULL,
  discount_price DECIMAL(10, 2),
  cover_image TEXT,
  category TEXT NOT NULL,
  stock INTEGER DEFAULT 0 NOT NULL,
  affiliate_commission_rate DECIMAL(5, 2) DEFAULT 10.00 NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_bestseller BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- فهرس للبحث والفلترة (Index for search and filtering)
CREATE INDEX idx_books_category ON public.books(category);
CREATE INDEX idx_books_featured ON public.books(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_books_bestseller ON public.books(is_bestseller) WHERE is_bestseller = TRUE;
CREATE INDEX idx_books_new ON public.books(is_new) WHERE is_new = TRUE;

-- سياسات الأمان للكتب (Books security policies)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view books" ON public.books
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage books" ON public.books
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- إدراج بيانات تجريبية للكتب (Insert sample books data)
INSERT INTO public.books (title_ar, author_ar, description_ar, price, discount_price, category, stock, is_featured, is_bestseller, affiliate_commission_rate) VALUES
('الخيميائي', 'باولو كويلو', 'رواية عن رحلة راعي أندلسي شاب يبحث عن كنز في الأهرامات المصرية', 120.00, 99.00, 'روايات', 50, TRUE, TRUE, 15.00),
('مئة عام من العزلة', 'غابرييل غارسيا ماركيز', 'رواية تحكي قصة عائلة بوينديا على مدى سبعة أجيال', 150.00, 120.00, 'روايات', 30, TRUE, TRUE, 15.00),
('العادات السبع للناس الأكثر فعالية', 'ستيفن كوفي', 'كتاب تطوير ذاتي يقدم نهجاً شاملاً لحل المشكلات الشخصية والمهنية', 180.00, 150.00, 'تطوير ذاتي', 40, TRUE, FALSE, 12.00),
('الأب الغني والأب الفقير', 'روبرت كيوساكي', 'كتاب عن التعليم المالي والاستثمار', 140.00, 110.00, 'مال وأعمال', 45, FALSE, TRUE, 12.00),
('فن اللامبالاة', 'مارك مانسون', 'نهج غير تقليدي لعيش حياة جيدة', 130.00, 100.00, 'تطوير ذاتي', 60, TRUE, TRUE, 10.00),
('البداية', 'دان براون', 'رواية إثارة وغموض', 160.00, NULL, 'روايات', 25, FALSE, FALSE, 10.00),
('التفكير السريع والبطيء', 'دانيال كانيمان', 'كتاب عن علم النفس والاقتصاد السلوكي', 200.00, 170.00, 'علم نفس', 20, FALSE, FALSE, 12.00),
('الرجل الذي حسب زوجته قبعة', 'أوليفر ساكس', 'قصص طبية غريبة ومثيرة', 110.00, NULL, 'علم نفس', 15, FALSE, FALSE, 10.00),
('قواعد العشق الأربعون', 'إليف شافاق', 'رواية عن الحب والتصوف', 135.00, 115.00, 'روايات', 35, TRUE, TRUE, 15.00),
('الجريمة والعقاب', 'فيودور دوستويفسكي', 'رواية كلاسيكية روسية', 170.00, NULL, 'روايات', 18, FALSE, FALSE, 10.00),
('كيف تكسب الأصدقاء وتؤثر في الناس', 'ديل كارنيجي', 'كتاب كلاسيكي في التنمية البشرية', 125.00, 95.00, 'تطوير ذاتي', 55, FALSE, TRUE, 10.00),
('الجينات والشعوب واللغات', 'لويجي كافالي سفورزا', 'كتاب عن التطور البشري', 190.00, NULL, 'علوم', 12, FALSE, FALSE, 12.00);
-- إنشاء نوع حالة المسوق (Create affiliate status enum)
CREATE TYPE public.affiliate_status AS ENUM ('pending', 'active', 'suspended');

-- إنشاء جدول المسوقين (Create affiliates table)
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  total_sales DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  pending_earnings DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  sales_count INTEGER DEFAULT 0 NOT NULL,
  commission_bonus DECIMAL(5, 2) DEFAULT 0.00 NOT NULL,
  status public.affiliate_status DEFAULT 'pending'::public.affiliate_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_affiliates_user ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_code ON public.affiliates(referral_code);

-- سياسات الأمان للمسوقين (Affiliates security policies)
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own affiliate data" ON public.affiliates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their affiliate account" ON public.affiliates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all affiliates" ON public.affiliates
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update affiliates" ON public.affiliates
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- إنشاء جدول روابط المسوقين (Create affiliate links table)
CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  clicks INTEGER DEFAULT 0 NOT NULL,
  conversions INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_affiliate_links_affiliate ON public.affiliate_links(affiliate_id);
CREATE INDEX idx_affiliate_links_book ON public.affiliate_links(book_id);

-- سياسات الأمان لروابط المسوقين (Affiliate links security policies)
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their own links" ON public.affiliate_links
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can create their links" ON public.affiliate_links
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all affiliate links" ON public.affiliate_links
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- دالة لتوليد كود إحالة فريد (Function to generate unique referral code)
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'REF' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.affiliates WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;
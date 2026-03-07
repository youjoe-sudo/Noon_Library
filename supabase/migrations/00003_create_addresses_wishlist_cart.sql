-- إنشاء جدول العناوين (Create addresses table)
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  governorate TEXT NOT NULL,
  city TEXT NOT NULL,
  street TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_addresses_user ON public.addresses(user_id);

-- سياسات الأمان للعناوين (Addresses security policies)
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own addresses" ON public.addresses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" ON public.addresses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" ON public.addresses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" ON public.addresses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses" ON public.addresses
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- إنشاء جدول قائمة الأمنيات (Create wishlist table)
CREATE TABLE public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, book_id)
);

CREATE INDEX idx_wishlist_user ON public.wishlist(user_id);

-- سياسات الأمان لقائمة الأمنيات (Wishlist security policies)
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wishlist" ON public.wishlist
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their wishlist" ON public.wishlist
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their wishlist" ON public.wishlist
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- إنشاء جدول عناصر السلة (Create cart items table)
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, book_id)
);

CREATE INDEX idx_cart_items_user ON public.cart_items(user_id);

-- سياسات الأمان لعناصر السلة (Cart items security policies)
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cart" ON public.cart_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their cart" ON public.cart_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their cart" ON public.cart_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can remove from their cart" ON public.cart_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
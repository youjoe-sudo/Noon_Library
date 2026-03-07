-- إنشاء نوع حالة الطلب (Create order status enum)
CREATE TYPE public.order_status AS ENUM ('awaiting_review', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled');

-- إنشاء نوع طريقة الدفع (Create payment method enum)
CREATE TYPE public.payment_method AS ENUM ('deposit', 'full_payment', 'online');

-- إنشاء نوع طريقة الشحن (Create shipping method enum)
CREATE TYPE public.shipping_method AS ENUM ('express', 'postal');

-- إنشاء جدول الطلبات (Create orders table)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) NOT NULL,
  payment_method public.payment_method NOT NULL,
  shipping_method public.shipping_method NOT NULL,
  status public.order_status DEFAULT 'awaiting_review'::public.order_status NOT NULL,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_phone TEXT,
  guest_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_affiliate ON public.orders(affiliate_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_number ON public.orders(order_number);

-- دالة لتوليد رقم طلب فريد (Function to generate unique order number)
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  num TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    num := 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = num) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN num;
END;
$$;

-- سياسات الأمان للطلبات (Orders security policies)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- إنشاء جدول عناصر الطلب (Create order items table)
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  affiliate_commission DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- سياسات الأمان لعناصر الطلب (Order items security policies)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their order items" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Users can create order items" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR user_id IS NULL)
    )
  );

CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- إنشاء نوع حالة إيصال الدفع (Create payment receipt status enum)
CREATE TYPE public.receipt_status AS ENUM ('pending', 'approved', 'rejected');

-- إنشاء جدول إيصالات الدفع (Create payment receipts table)
CREATE TABLE public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  status public.receipt_status DEFAULT 'pending'::public.receipt_status NOT NULL,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_payment_receipts_order ON public.payment_receipts(order_id);
CREATE INDEX idx_payment_receipts_status ON public.payment_receipts(status);

-- سياسات الأمان لإيصالات الدفع (Payment receipts security policies)
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their receipts" ON public.payment_receipts
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload receipts" ON public.payment_receipts
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all receipts" ON public.payment_receipts
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update receipts" ON public.payment_receipts
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
// أنواع TypeScript لمكتبة نون (TypeScript types for Noon Library)

export type UserRole = 'user' | 'affiliate' | 'admin';

export type AffiliateStatus = 'pending' | 'active' | 'suspended';

export type CouponDiscountType = 'percentage' | 'fixed';

export type OrderStatus = 'pending' | 'pending_payment' | 'awaiting_review' | 'payment_rejected' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export type PaymentMethod = 'deposit' | 'full_payment' | 'online';

export type ShippingMethod = 'express' | 'postal';

export type ReceiptStatus = 'pending' | 'approved' | 'rejected';

export type NotificationType = 'order' | 'payment' | 'affiliate' | 'system' | 'inventory';

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  role: UserRole;
  phone: string | null;
  full_name: string | null;
  created_at: string;
}

export interface Book {
  id: string;
  title_ar: string;
  author_ar: string;
  description_ar: string | null;
  price: number;
  discount_price: number | null;
  cover_image: string | null;
  category: string;
  stock: number;
  affiliate_commission_rate: number;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  governorate: string;
  city: string;
  street: string;
  is_default: boolean;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  book_id: string;
  created_at: string;
  books?: Book;
}

export interface CartItem {
  id: string;
  user_id: string;
  book_id: string;
  quantity: number;
  created_at: string;
  books?: Book;
}

export interface Affiliate {
  id: string;
  user_id: string;
  business_name: string;
  phone: string;
  website: string | null;
  social_media: string | null;
  marketing_experience: string | null;
  payment_method: string | null;
  payment_details: string | null;
  referral_code: string;
  commission_rate: number;
  total_sales: number;
  total_earnings: number;
  pending_earnings: number;
  sales_count: number;
  commission_bonus: number;
  status: AffiliateStatus;
  created_at: string;
  profiles?: Profile;
}

export interface AffiliateTracking {
  id: string;
  affiliate_id: string;
  tracking_code: string;
  clicks: number;
  conversions: number;
  created_at: string;
  last_click_at: string | null;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  affiliate_id: string | null;
  order_id: string | null;
  is_read: boolean;
  created_at: string;
  affiliates?: Affiliate;
  orders?: Order;
}

export interface AffiliateLink {
  id: string;
  affiliate_id: string;
  book_id: string | null;
  clicks: number;
  conversions: number;
  created_at: string;
  books?: Book;
}

export interface Order {
  id: string;
  user_id: string | null;
  affiliate_id: string | null;
  order_number: string;
  total_amount: number;
  shipping_cost: number;
  discount_amount: number;
  deposit_amount: number;
  coupon_id: string | null;
  payment_method: PaymentMethod;
  shipping_method: ShippingMethod;
  status: OrderStatus;
  address_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  addresses?: Address;
  affiliates?: Affiliate;
  profiles?: Profile;
  order_items?: OrderItem[];
  coupons?: Coupon;
  payment_receipts?: PaymentReceipt[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  book_id: string;
  quantity: number;
  price: number;
  affiliate_commission: number;
  created_at: string;
  books?: Book;
}

export interface PaymentReceipt {
  id: string;
  order_id: string;
  image_url: string;
  status: ReceiptStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  orders?: Order;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title_ar: string;
  message_ar: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

// أنواع النماذج (Form types)
export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  full_name?: string;
}

export interface AddressFormData {
  full_name: string;
  phone: string;
  governorate: string;
  city: string;
  street: string;
  is_default: boolean;
}

export interface BookFormData {
  title_ar: string;
  author_ar: string;
  description_ar: string;
  price: number;
  discount_price: number | null;
  cover_image: string | null;
  category: string;
  stock: number;
  affiliate_commission_rate: number;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
}

export interface CheckoutFormData {
  full_name: string;
  phone: string;
  governorate: string;
  city: string;
  street: string;
  payment_method: PaymentMethod;
  shipping_method: ShippingMethod;
  notes?: string;
}

// أنواع الاستجابة (Response types)
export interface ShippingCalculation {
  cost: number;
  estimated_days: number;
  free_shipping: boolean;
}

export interface CommissionCalculation {
  base_commission: number;
  bonus_commission: number;
  total_commission: number;
}

export interface AffiliateStats {
  total_sales: number;
  total_earnings: number;
  pending_earnings: number;
  sales_count: number;
  commission_bonus: number;
  recent_orders: Order[];
}

export interface AdminAnalytics {
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  total_books: number;
  low_stock_books: number;
  total_affiliates: number;
  active_affiliates: number;
  bestselling_books: Book[];
  top_affiliates: Affiliate[];
  recent_orders: Order[];
}

// ============ الكوبونات (Coupons) ============
export interface Coupon {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  affiliate_id: string | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  affiliates?: Affiliate;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  order_id: string;
  user_id: string | null;
  discount_amount: number;
  created_at: string;
  coupons?: Coupon;
}

export interface CouponValidation {
  valid: boolean;
  discount_amount: number;
  message: string;
  coupon_id: string | null;
}

export type PaymentReceiptStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentReceipt {
  id: string;
  order_id: string;
  phone_from: string;
  receipt_image_url: string;
  receipt_number: string;
  admin_notes: string | null;
  status: PaymentReceiptStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingRule {
  id: string;
  region_name: string;
  region_type: string;
  base_cost: number;
  governorates: string[];
  requires_prepayment: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingCostCalculation {
  success: boolean;
  base_cost?: number;
  extra_cost?: number;
  total_cost?: number;
  book_count?: number;
  message?: string;
  error?: string;
}

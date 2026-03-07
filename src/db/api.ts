// طبقة API لقاعدة البيانات (Database API layer)
import { supabase } from './supabase';
import type {
  Profile,
  Book,
  Address,
  WishlistItem,
  CartItem,
  Affiliate,
  AffiliateLink,
  AffiliateTracking,
  AdminNotification,
  Order,
  OrderItem,
  PaymentReceipt,
  Notification,
  AddressFormData,
  BookFormData,
} from '@/types';

// ============ ملفات المستخدمين (Profiles) ============
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Profile | null;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Profile;
};

export const getAllProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// ============ الكتب (Books) ============
export const getBooks = async (filters?: {
  category?: string;
  search?: string;
  is_featured?: boolean;
  is_bestseller?: boolean;
  is_new?: boolean;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase.from('books').select('*', { count: 'exact' });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.search) {
    query = query.or(`title_ar.ilike.%${filters.search}%,author_ar.ilike.%${filters.search}%`);
  }
  if (filters?.is_featured) {
    query = query.eq('is_featured', true);
  }
  if (filters?.is_bestseller) {
    query = query.eq('is_bestseller', true);
  }
  if (filters?.is_new) {
    query = query.eq('is_new', true);
  }

  query = query.order('created_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  
  if (error) throw error;
  return { books: Array.isArray(data) ? data : [], count: count || 0 };
};

export const getBook = async (bookId: string) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Book | null;
};

export const createBook = async (bookData: BookFormData) => {
  const { data, error } = await supabase
    .from('books')
    .insert(bookData)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Book;
};

export const updateBook = async (bookId: string, updates: Partial<BookFormData>) => {
  const { data, error } = await supabase
    .from('books')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', bookId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Book;
};

export const deleteBook = async (bookId: string) => {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId);
  
  if (error) throw error;
};

export const getCategories = async () => {
  const { data, error } = await supabase
    .from('books')
    .select('category')
    .order('category');
  
  if (error) throw error;
  const categories = Array.isArray(data) ? [...new Set(data.map(b => b.category))] : [];
  return categories;
};

// ============ العناوين (Addresses) ============
export const getAddresses = async (userId: string) => {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createAddress = async (addressData: AddressFormData & { user_id: string }) => {
  const { data, error } = await supabase
    .from('addresses')
    .insert(addressData)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Address;
};

export const updateAddress = async (addressId: string, updates: Partial<AddressFormData>) => {
  const { data, error } = await supabase
    .from('addresses')
    .update(updates)
    .eq('id', addressId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Address;
};

export const deleteAddress = async (addressId: string) => {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId);
  
  if (error) throw error;
};

// ============ قائمة الأمنيات (Wishlist) ============
export const getWishlist = async (userId: string) => {
  const { data, error } = await supabase
    .from('wishlist')
    .select('*, books(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const addToWishlist = async (userId: string, bookId: string) => {
  const { data, error } = await supabase
    .from('wishlist')
    .insert({ user_id: userId, book_id: bookId })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as WishlistItem;
};

export const removeFromWishlist = async (userId: string, bookId: string) => {
  const { error } = await supabase
    .from('wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('book_id', bookId);
  
  if (error) throw error;
};

export const isInWishlist = async (userId: string, bookId: string) => {
  const { data, error } = await supabase
    .from('wishlist')
    .select('id')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .maybeSingle();
  
  if (error) throw error;
  return !!data;
};

// ============ السلة (Cart) ============
export const getCart = async (userId: string) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, books(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const addToCart = async (userId: string, bookId: string, quantity: number = 1) => {
  // تحقق من وجود العنصر في السلة (Check if item exists in cart)
  const { data: existing } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .maybeSingle();

  if (existing) {
    // تحديث الكمية (Update quantity)
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as CartItem;
  }

  // إضافة عنصر جديد (Add new item)
  const { data, error } = await supabase
    .from('cart_items')
    .insert({ user_id: userId, book_id: bookId, quantity })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as CartItem;
};

export const updateCartItem = async (cartItemId: string, quantity: number) => {
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as CartItem;
};

export const removeFromCart = async (cartItemId: string) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);
  
  if (error) throw error;
};

export const clearCart = async (userId: string) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);
  
  if (error) throw error;
};

// ============ المسوقون (Affiliates) ============
export const getAffiliate = async (userId: string) => {
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Affiliate | null;
};

export const createAffiliate = async (affiliateData: Omit<Affiliate, "id" | "created_at" | "total_sales" | "total_earnings" | "pending_earnings" | "sales_count" | "commission_bonus">) => {
  const { data, error } = await supabase
    .from("affiliates")
    .insert(affiliateData)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Affiliate;
};

export const getAffiliateByCode = async (code: string) => {
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('referral_code', code)
    .maybeSingle();
  
  if (error) throw error;
  return data as Affiliate | null;
};

export const getAllAffiliates = async () => {
  const { data, error } = await supabase
    .from('affiliates')
    .select('*, profiles(*)')
    .order('total_sales', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const updateAffiliate = async (affiliateId: string, updates: Partial<Affiliate>) => {
  const { data, error } = await supabase
    .from('affiliates')
    .update(updates)
    .eq('id', affiliateId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Affiliate;
};

// ============ الطلبات (Orders) ============
export const getOrders = async (userId?: string, filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase
    .from('orders')
    .select('*, addresses(*), affiliates(*), profiles(*)', { count: 'exact' });

  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  query = query.order('created_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  
  if (error) throw error;
  return { orders: Array.isArray(data) ? data : [], count: count || 0 };
};

export const getOrder = async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, addresses(*), affiliates(*), profiles(*)')
    .eq('id', orderId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Order | null;
};

export const getOrderItems = async (orderId: string) => {
  const { data, error } = await supabase
    .from('order_items')
    .select('*, books(*)')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createOrder = async (orderData: Partial<Order>) => {
  // توليد رقم طلب (Generate order number)
  const { data: orderNumber, error: numberError } = await supabase
    .rpc('generate_order_number');
  
  if (numberError) throw numberError;

  const { data, error } = await supabase
    .from('orders')
    .insert({ ...orderData, order_number: orderNumber })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Order;
};

export const createOrderItems = async (items: Partial<OrderItem>[]) => {
  const { data, error } = await supabase
    .from('order_items')
    .insert(items)
    .select();
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Order;
};

// ============ إيصالات الدفع (Payment Receipts) ============
export const getPaymentReceipts = async (orderId?: string) => {
  let query = supabase
    .from('payment_receipts')
    .select('*, orders(*)');

  if (orderId) {
    query = query.eq('order_id', orderId);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};


export const updatePaymentReceipt = async (
  receiptId: string,
  updates: Partial<PaymentReceipt>
) => {
  const { data, error } = await supabase
    .from('payment_receipts')
    .update(updates)
    .eq('id', receiptId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as PaymentReceipt;
};

// ============ الإشعارات (Notifications) ============
export const getNotifications = async (userId: string, unreadOnly: boolean = false) => {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  query = query.order('created_at', { ascending: false }).limit(50);

  const { data, error } = await query;
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  
  if (error) throw error;
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  if (error) throw error;
};

export const createNotification = async (notificationData: Partial<Notification>) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Notification;
};

// ============ دوال إضافية (Additional Functions) ============

// Get all books (for admin)
export const getAllBooks = async () => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Update book stock
export const updateBookStock = async (bookId: string, stock: number) => {
  const { data, error } = await supabase
    .from('books')
    .update({ stock })
    .eq('id', bookId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Get all orders (for admin)
export const getAllOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!orders_user_id_fkey(username, email),
      addresses(*),
      order_items(*, books(*))
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Get user orders
export const getUserOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      addresses(*),
      order_items(*, books(*))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Get all affiliates (for admin)

// Get affiliate by user ID
export const getAffiliateByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Get affiliate links
export const getAffiliateLinks = async (affiliateId: string) => {
  const { data, error } = await supabase
    .from('affiliate_links')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Update affiliate status
export const updateAffiliateStatus = async (affiliateId: string, status: string) => {
  const { data, error } = await supabase
    .from('affiliates')
    .update({ status })
    .eq('id', affiliateId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// ============ الكوبونات (Coupons) ============

// Validate coupon
export const validateCoupon = async (code: string, orderAmount: number) => {
  const { data, error } = await supabase
    .rpc('validate_coupon', {
      coupon_code: code,
      order_amount: orderAmount
    });
  
  if (error) throw error;
  // RPC returns an array, get first result
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
};

// Get coupon by code
export const getCouponByCode = async (code: string) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Create coupon (for affiliates)
export const createCoupon = async (couponData: Partial<any>) => {
  const { data, error } = await supabase
    .from('coupons')
    .insert(couponData)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Get affiliate coupons
export const getAffiliateCoupons = async (affiliateId: string) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Update coupon
export const updateCoupon = async (couponId: string, updates: Partial<any>) => {
  const { data, error } = await supabase
    .from('coupons')
    .update(updates)
    .eq('id', couponId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Increment coupon usage
export const incrementCouponUsage = async (couponId: string) => {
  const { data: coupon, error: fetchError } = await supabase
    .from("coupons")
    .select("used_count")
    .eq("id", couponId)
    .maybeSingle();
  
  if (fetchError) throw fetchError;
  if (!coupon) throw new Error("Coupon not found");
  
  const { data, error } = await supabase
    .from("coupons")
    .update({ used_count: coupon.used_count + 1 })
    .eq("id", couponId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};
// Create coupon usage record
export const createCouponUsage = async (usageData: Partial<any>) => {
  const { data, error } = await supabase
    .from('coupon_usage')
    .insert(usageData)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Get unread notifications count
export const getUnreadNotificationsCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  if (error) throw error;
  return count || 0;
};

// ============ نظام تتبع المسوقين (Affiliate Tracking System) ============

// Generate tracking code for affiliate
export const generateTrackingCode = async (affiliateId: string) => {
  const { data, error } = await supabase
    .rpc('generate_tracking_code', {
      affiliate_id_param: affiliateId
    });
  
  if (error) throw error;
  return data as string;
};

// Get affiliate tracking links
export const getAffiliateTrackingLinks = async (affiliateId: string) => {
  const { data, error } = await supabase
    .from('affiliate_tracking')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [] as AffiliateTracking[];
};

// Record tracking click
export const recordTrackingClick = async (trackingCode: string) => {
  const { data, error } = await supabase
    .rpc('record_tracking_click', {
      tracking_code_param: trackingCode
    });
  
  if (error) throw error;
  return data;
};

// Record tracking conversion
export const recordTrackingConversion = async (trackingCode: string) => {
  const { data, error } = await supabase
    .rpc('record_tracking_conversion', {
      tracking_code_param: trackingCode
    });
  
  if (error) throw error;
  return data;
};

// Get affiliate orders with details
export const getAffiliateOrders = async (affiliateId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*, books(*)),
      addresses(*),
      profiles(username, email)
    `)
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [] as Order[];
};

// ============ إشعارات الإدارة (Admin Notifications) ============

// Get admin notifications
export const getAdminNotifications = async (unreadOnly: boolean = false) => {
  let query = supabase
    .from('admin_notifications')
    .select(`
      *,
      affiliates(business_name, phone),
      orders(order_number, total_amount)
    `)
    .order('created_at', { ascending: false });
  
  if (unreadOnly) {
    query = query.eq('is_read', false);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return Array.isArray(data) ? data : [] as AdminNotification[];
};

// Get unread admin notifications count
export const getUnreadAdminNotificationsCount = async () => {
  const { count, error } = await supabase
    .from('admin_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);
  
  if (error) throw error;
  return count || 0;
};

// Mark admin notification as read
export const markAdminNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('admin_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  
  if (error) throw error;
};

// Mark all admin notifications as read
export const markAllAdminNotificationsAsRead = async () => {
  const { error } = await supabase
    .from('admin_notifications')
    .update({ is_read: true })
    .eq('is_read', false);
  
  if (error) throw error;
};

// Send bulk notification to users
export const sendBulkNotification = async (
  title: string,
  message: string,
  recipientType: 'all' | 'customers' | 'affiliates'
) => {
  // الحصول على قائمة المستخدمين المستهدفين
  let query = supabase.from('profiles').select('id, role');
  
  if (recipientType === 'customers') {
    query = query.eq('role', 'user');
  } else if (recipientType === 'affiliates') {
    query = query.eq('role', 'affiliate');
  }
  
  const { data: users, error: usersError } = await query;
  
  if (usersError) throw usersError;
  if (!users || users.length === 0) {
    throw new Error('لا يوجد مستخدمين لإرسال الإشعار إليهم');
  }
  
  // إنشاء إشعارات لجميع المستخدمين
  const notifications = users.map(user => ({
    user_id: user.id,
    title,
    message,
    type: 'announcement',
    is_read: false,
  }));
  
  const { error: insertError } = await supabase
    .from('notifications')
    .insert(notifications);
  
  if (insertError) throw insertError;
  
  return { success: true, count: notifications.length };
};

// ============ نظام إيصالات الدفع (Payment Receipts System) ============

// Create payment receipt
export const createPaymentReceipt = async (receipt: {
  order_id: string;
  phone_from: string;
  receipt_image_url: string;
  receipt_number: string;
}) => {
  const { data, error } = await supabase
    .from('payment_receipts')
    .insert(receipt)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Get payment receipt by order ID
export const getPaymentReceiptByOrderId = async (orderId: string) => {
  const { data, error } = await supabase
    .from('payment_receipts')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Upload receipt image to storage
export const uploadReceiptImage = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName);
  
  return publicUrl;
};

// Upload book cover image
export const uploadBookCover = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `books/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('book-covers')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('book-covers')
    .getPublicUrl(fileName);
  
  return publicUrl;
};

// Approve payment receipt (admin only)
export const approvePaymentReceipt = async (
  receiptId: string,
  adminId: string,
  notes?: string
) => {
  const { data, error } = await supabase.rpc('approve_payment_receipt', {
    receipt_id_param: receiptId,
    admin_id_param: adminId,
    notes_param: notes || null
  });
  
  if (error) throw error;
  return data;
};

// Reject payment receipt (admin only)
export const rejectPaymentReceipt = async (
  receiptId: string,
  adminId: string,
  notes: string
) => {
  const { data, error } = await supabase.rpc('reject_payment_receipt', {
    receipt_id_param: receiptId,
    admin_id_param: adminId,
    notes_param: notes
  });
  
  if (error) throw error;
  return data;
};

// Get all payment receipts (admin only)
export const getAllPaymentReceipts = async (status?: string) => {
  let query = supabase
    .from('payment_receipts')
    .select(`
      *,
      orders(
        order_number,
        total_amount,
        deposit_amount,
        user_id,
        profiles(username, email)
      )
    `)
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// ============ نظام الشحن (Shipping System) ============

// Get all shipping rules
export const getShippingRules = async () => {
  const { data, error } = await supabase
    .from('shipping_rules')
    .select('*')
    .order('base_cost', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Calculate shipping cost
export const calculateShippingCost = async (
  governorate: string,
  shippingMethod: string,
  bookCount: number,
  paymentMethod: string
) => {
  const { data, error } = await supabase.rpc('calculate_shipping_cost', {
    governorate_param: governorate,
    shipping_method_param: shippingMethod,
    book_count_param: bookCount,
    payment_method_param: paymentMethod
  });
  
  if (error) throw error;
  return data;
};

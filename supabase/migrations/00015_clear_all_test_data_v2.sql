-- مسح جميع البيانات التجريبية (Clear all test data)

-- حذف البيانات من الجداول بالترتيب الصحيح (مع مراعاة العلاقات)
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM payment_receipts;
DELETE FROM cart_items;
DELETE FROM wishlist;
DELETE FROM notifications;
DELETE FROM admin_notifications;
DELETE FROM affiliate_tracking;
DELETE FROM affiliate_links;
DELETE FROM coupon_usage;
DELETE FROM coupons;
DELETE FROM affiliates;
DELETE FROM books;
DELETE FROM addresses;
DELETE FROM shipping_rules;

-- حذف جميع المستخدمين (سيتم إنشاء أول مستخدم كمدير)
DELETE FROM profiles;

-- رسالة تأكيد
DO $$
BEGIN
  RAISE NOTICE 'تم مسح جميع البيانات التجريبية بنجاح';
END $$;
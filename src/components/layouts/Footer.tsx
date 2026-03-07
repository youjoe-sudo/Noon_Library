// مكون التذييل (Footer Component)
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* معلومات المكتبة (Library Info) */}
          <div>
            <h3 className="text-lg font-bold gradient-text mb-4">مكتبة نون</h3>
            <p className="text-sm text-muted-foreground" dir="rtl">
              اقرأها بطريقتك - منصة ذكية لبيع الكتب مع نظام تسويق بالعمولة
            </p>
          </div>

          {/* روابط سريعة (Quick Links) */}
          <div>
            <h4 className="font-semibold mb-4" dir="rtl">روابط سريعة</h4>
            <ul className="space-y-2 text-sm" dir="rtl">
              <li>
                <Link to="/books" className="text-muted-foreground hover:text-primary transition-colors">
                  تصفح الكتب
                </Link>
              </li>
              <li>
                <Link to="/affiliate/register" className="text-muted-foreground hover:text-primary transition-colors">
                  انضم كمسوق
                </Link>
              </li>
            </ul>
          </div>

          {/* خدمة العملاء (Customer Service) */}
          <div>
            <h4 className="font-semibold mb-4" dir="rtl">خدمة العملاء</h4>
            <ul className="space-y-2 text-sm" dir="rtl">
              <li>
                <Link to="/orders" className="text-muted-foreground hover:text-primary transition-colors">
                  تتبع الطلب
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground">سياسة الإرجاع</span>
              </li>
              <li>
                <span className="text-muted-foreground">الشحن والتوصيل</span>
              </li>
            </ul>
          </div>

          {/* تواصل معنا (Contact Us) */}
          <div>
            <h4 className="font-semibold mb-4" dir="rtl">تواصل معنا</h4>
            <div className="flex gap-4 mb-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p dir="rtl">
            © {currentYear} مكتبة نون. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}

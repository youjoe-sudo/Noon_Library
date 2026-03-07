// مكون الترويسة (Header Component)
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, LogOut, LayoutDashboard, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { NotificationsIcon } from '@/components/common/NotificationsIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // روابط التنقل الأساسية
  const baseNavLinks = [
    { to: '/', label: 'الرئيسية' },
    { to: '/books', label: 'الكتب' },
  ];

  // إضافة رابط لوحة الإدارة للمديرين
  const navLinks = profile?.role === 'admin' 
    ? [...baseNavLinks, { to: '/admin', label: 'لوحة الإدارة' }]
    : baseNavLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* الشعار (Logo) */}
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold gradient-text">
              مكتبة نون
            </div>
          </Link>

          {/* روابط التنقل - سطح المكتب (Navigation Links - Desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* شريط البحث - سطح المكتب (Search Bar - Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-6">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ابحث عن كتاب أو مؤلف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
                dir="rtl"
              />
            </div>
          </form>

          {/* الإجراءات (Actions) */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {user ? (
              <>
                {/* السلة (Cart) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => navigate('/cart')}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {cartCount}
                    </Badge>
                  )}
                </Button>

                {/* قائمة الأمنيات (Wishlist) */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/wishlist')}
                  className="hidden md:inline-flex"
                >
                  <Heart className="h-5 w-5" />
                </Button>

                {/* الإشعارات (Notifications) */}
                <NotificationsIcon />

                {/* قائمة المستخدم (User Menu) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm" dir="rtl">
                      <div className="font-medium">{String(profile?.username ?? 'مستخدم')}</div>
                      <div className="text-xs text-muted-foreground">{String(profile?.email ?? '')}</div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="ml-2 h-4 w-4" />
                      الملف الشخصي
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      <ShoppingCart className="ml-2 h-4 w-4" />
                      طلباتي
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/wishlist')} className="md:hidden">
                      <Heart className="ml-2 h-4 w-4" />
                      قائمة الأمنيات
                    </DropdownMenuItem>
                    {profile?.role === 'affiliate' && (
                      <DropdownMenuItem onClick={() => navigate('/affiliate/dashboard')}>
                        <LayoutDashboard className="ml-2 h-4 w-4" />
                        لوحة المسوق
                      </DropdownMenuItem>
                    )}
                    {profile?.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <LayoutDashboard className="ml-2 h-4 w-4" />
                        لوحة الإدارة
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="ml-2 h-4 w-4" />
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={() => navigate('/login')}>
                تسجيل الدخول
              </Button>
            )}

            {/* قائمة الهاتف المحمول (Mobile Menu) */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" dir="rtl">
                <div className="flex flex-col gap-4 mt-8">
                  {/* شريط البحث - الهاتف (Search Bar - Mobile) */}
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                      type="search"
                      placeholder="ابحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      dir="rtl"
                    />
                    <Button type="submit" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </form>

                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="text-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

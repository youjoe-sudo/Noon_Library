// مكون تخطيط الإدارة (Admin Layout Component)
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, BookOpen, ShoppingBag, Users, BarChart3, Home, Menu, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { getUnreadAdminNotificationsCount } from '@/db/api';

export function AdminLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    // تحديث العدد كل 30 ثانية
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadAdminNotificationsCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const navItems = [
    { to: '/', label: 'العودة للموقع', icon: Home },
    { to: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard },
    { to: '/admin/books', label: 'إدارة الكتب', icon: BookOpen },
    { to: '/admin/orders', label: 'إدارة الطلبات', icon: ShoppingBag },
    { to: '/admin/affiliates', label: 'إدارة المسوقين', icon: Users },
    { to: '/admin/notifications', label: 'الإشعارات', icon: Bell, badge: unreadCount },
    { to: '/admin/analytics', label: 'التحليلات', icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen" dir="rtl">
      {/* الشريط الجانبي - سطح المكتب (Sidebar - Desktop) */}
      <aside className="hidden lg:block w-64 border-l bg-card shrink-0">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold gradient-text">لوحة الإدارة</h2>
          </div>
          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link key={item.to} to={item.to}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3',
                        isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="mr-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </aside>

      {/* المحتوى الرئيسي (Main Content) */}
      <main className="flex-1 overflow-auto">
        {/* شريط الهاتف المحمول (Mobile Header) */}
        <div className="lg:hidden sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-bold gradient-text">لوحة الإدارة</h2>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-bold gradient-text">لوحة الإدارة</h2>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <nav className="space-y-2">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.to;
                        return (
                          <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}>
                            <Button
                              variant={isActive ? 'secondary' : 'ghost'}
                              className={cn(
                                'w-full justify-start gap-3',
                                isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                              )}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="flex-1">{item.label}</span>
                              {item.badge && item.badge > 0 && (
                                <Badge variant="destructive" className="mr-auto">
                                  {item.badge}
                                </Badge>
                              )}
                            </Button>
                          </Link>
                        );
                      })}
                    </nav>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="container mx-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

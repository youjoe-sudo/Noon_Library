// لوحة الإدارة (Admin Dashboard)
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/db/supabase';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, BookOpen } from 'lucide-react';

interface Stats {
  totalOrders: number;
  totalBooks: number;
  totalUsers: number;
  totalRevenue: number;
  activeAffiliates: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalBooks: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeAffiliates: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // عدد الطلبات (Orders count)
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // عدد الكتب (Books count)
      const { count: booksCount } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true });

      // عدد المستخدمين (Users count)
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // إجمالي الإيرادات (Total revenue)
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered');
      
      const totalRevenue = (ordersData as { total_amount: number }[])?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      // المسوقون النشطون (Active affiliates)
      const { count: affiliatesCount } = await supabase
        .from('affiliates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // الطلبات المعلقة (Pending orders)
      const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'awaiting_review');

      setStats({
        totalOrders: ordersCount || 0,
        totalBooks: booksCount || 0,
        totalUsers: usersCount || 0,
        totalRevenue,
        activeAffiliates: affiliatesCount || 0,
        pendingOrders: pendingCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8" dir="rtl">لوحة التحكم</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-24 mb-2 bg-muted" />
                <Skeleton className="h-8 w-32 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" dir="rtl">لوحة التحكم 📊</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* إجمالي الطلبات (Total Orders) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" dir="rtl">إجمالي الطلبات</p>
                <p className="text-3xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الطلبات المعلقة (Pending Orders) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" dir="rtl">طلبات معلقة</p>
                <p className="text-3xl font-bold">{stats.pendingOrders}</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-full">
                <Package className="h-8 w-8 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* إجمالي الكتب (Total Books) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" dir="rtl">إجمالي الكتب</p>
                <p className="text-3xl font-bold">{stats.totalBooks}</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-full">
                <BookOpen className="h-8 w-8 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* إجمالي المستخدمين (Total Users) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" dir="rtl">إجمالي المستخدمين</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="p-3 bg-success/10 rounded-full">
                <Users className="h-8 w-8 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* المسوقون النشطون (Active Affiliates) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" dir="rtl">المسوقون النشطون</p>
                <p className="text-3xl font-bold">{stats.activeAffiliates}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* إجمالي الإيرادات (Total Revenue) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" dir="rtl">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold" dir="rtl">{stats.totalRevenue.toFixed(2)} ج.م</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-full">
                <DollarSign className="h-8 w-8 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ملاحظات سريعة (Quick Notes) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle dir="rtl">ملاحظات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm" dir="rtl">
            {stats.pendingOrders > 0 && (
              <li className="text-accent">• لديك {stats.pendingOrders} طلب معلق يحتاج للمراجعة</li>
            )}
            <li>• إجمالي الكتب المتاحة: {stats.totalBooks}</li>
            <li>• عدد المستخدمين المسجلين: {stats.totalUsers}</li>
            <li>• المسوقون النشطون: {stats.activeAffiliates}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

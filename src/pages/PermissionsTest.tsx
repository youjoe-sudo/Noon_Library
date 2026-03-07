// صفحة اختبار الصلاحيات (Permissions Test Page)
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PermissionsTest() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isAdminResult, setIsAdminResult] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      testIsAdmin();
    }
  }, [user, loading]);

  const testIsAdmin = async () => {
    if (!user) return;
    
    setTesting(true);
    try {
      // @ts-ignore - RPC function not in types
      const { data, error } = await supabase.rpc('is_admin', { uid: user.id });
      if (error) {
        console.error('خطأ في اختبار is_admin:', error);
        setIsAdminResult(null);
      } else {
        setIsAdminResult(data as boolean);
      }
    } catch (error) {
      console.error('خطأ في اختبار is_admin:', error);
      setIsAdminResult(null);
    } finally {
      setTesting(false);
    }
  };

  const handleRefresh = async () => {
    await refreshProfile();
    await testIsAdmin();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">غير مسجل دخول</h2>
            <p className="text-muted-foreground mb-6">
              يجب تسجيل الدخول أولاً لعرض معلومات الصلاحيات
            </p>
            <Button onClick={() => navigate('/login')}>
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">اختبار الصلاحيات</h1>
          <p className="text-muted-foreground">
            هذه الصفحة تساعدك على التحقق من صلاحيات حسابك
          </p>
        </div>

        <div className="grid gap-6">
          {/* حالة المستخدم */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                حالة تسجيل الدخول
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">معرف المستخدم:</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{user.id}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">البريد الإلكتروني:</span>
                  <span className="font-medium">{user.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الملف الشخصي */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {profile ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                الملف الشخصي
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">اسم المستخدم:</span>
                    <span className="font-medium">{String(profile.username ?? 'غير محدد')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">البريد الإلكتروني:</span>
                    <span className="font-medium">{String(profile.email ?? 'غير محدد')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">الدور:</span>
                    <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                      {profile.role === 'admin' && 'مدير'}
                      {profile.role === 'affiliate' && 'مسوق'}
                      {profile.role === 'user' && 'مستخدم'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
                  <p className="text-destructive font-medium">لم يتم تحميل الملف الشخصي</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    قد تكون هناك مشكلة في سياسات RLS
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* اختبار دالة is_admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isAdminResult === true ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : isAdminResult === false ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                اختبار دالة is_admin()
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">نتيجة الاختبار:</span>
                  {testing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Badge variant={isAdminResult === true ? 'default' : 'destructive'}>
                      {isAdminResult === true ? 'مدير ✓' : isAdminResult === false ? 'ليس مدير ✗' : 'لم يتم الاختبار'}
                    </Badge>
                  )}
                </div>
                <Button onClick={testIsAdmin} disabled={testing} variant="outline" className="w-full">
                  <RefreshCw className={`h-4 w-4 ml-2 ${testing ? 'animate-spin' : ''}`} />
                  إعادة الاختبار
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* التوصيات */}
          <Card>
            <CardHeader>
              <CardTitle>التوصيات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!profile && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="font-medium text-destructive mb-2">⚠️ الملف الشخصي غير محمّل</p>
                    <p className="text-sm text-muted-foreground">
                      هناك مشكلة في تحميل ملفك الشخصي. تحقق من سياسات RLS في قاعدة البيانات.
                    </p>
                  </div>
                )}

                {profile && profile.role !== 'admin' && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="font-medium text-yellow-600 dark:text-yellow-500 mb-2">⚠️ ليس لديك صلاحيات مدير</p>
                    <p className="text-sm text-muted-foreground">
                      دورك الحالي: <strong>{String(profile.role)}</strong>. يجب أن يكون الدور "admin" للوصول إلى لوحة الإدارة.
                    </p>
                  </div>
                )}

                {profile && profile.role === 'admin' && isAdminResult === true && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="font-medium text-green-600 dark:text-green-500 mb-2">✅ كل شيء يعمل بشكل صحيح!</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      لديك صلاحيات المدير ويمكنك الوصول إلى لوحة الإدارة.
                    </p>
                    <Button onClick={() => navigate('/admin')} className="w-full">
                      الذهاب إلى لوحة الإدارة
                    </Button>
                  </div>
                )}

                {profile && profile.role === 'admin' && isAdminResult === false && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="font-medium text-destructive mb-2">⚠️ تعارض في الصلاحيات</p>
                    <p className="text-sm text-muted-foreground">
                      الملف الشخصي يظهر أنك مدير، لكن دالة is_admin() تعيد false. قد تكون هناك مشكلة في قاعدة البيانات.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* أزرار الإجراءات */}
          <div className="flex gap-4">
            <Button onClick={handleRefresh} variant="outline" className="flex-1">
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث البيانات
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

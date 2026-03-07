// صفحة تسجيل الدخول (Login Page)
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { signInWithUsername, signUpWithUsername } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await signInWithUsername(loginData.username, loginData.password);
    setLoading(false);

    if (error) {
      toast({
        title: 'فشل تسجيل الدخول',
        description: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'مرحباً بك',
        description: 'تم تسجيل الدخول بنجاح',
      });
      navigate(from, { replace: true });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.username || !registerData.password || !registerData.confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول',
        variant: 'destructive',
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'كلمات المرور غير متطابقة',
        variant: 'destructive',
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }

    // التحقق من اسم المستخدم (Validate username)
    if (!/^[a-zA-Z0-9_]+$/.test(registerData.username)) {
      toast({
        title: 'خطأ',
        description: 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام و _ فقط',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await signUpWithUsername(registerData.username, registerData.password);
    setLoading(false);

    if (error) {
      toast({
        title: 'فشل التسجيل',
        description: error.message || 'حدث خطأ أثناء التسجيل',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'تم التسجيل بنجاح',
        description: 'مرحباً بك في مكتبة نون',
      });
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold gradient-text">مكتبة نون</CardTitle>
          <CardDescription dir="rtl">اقرأها بطريقتك 📚</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" dir="rtl">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
            </TabsList>

            {/* تسجيل الدخول (Login) */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username" dir="rtl">اسم المستخدم</Label>
                  <Input
                    id="login-username"
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    disabled={loading}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" dir="rtl">كلمة المرور</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    disabled={loading}
                    dir="ltr"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  تسجيل الدخول
                </Button>
              </form>
            </TabsContent>

            {/* إنشاء حساب (Register) */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username" dir="rtl">اسم المستخدم</Label>
                  <Input
                    id="register-username"
                    type="text"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    disabled={loading}
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground" dir="rtl">
                    أحرف وأرقام و _ فقط
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" dir="rtl">كلمة المرور</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    disabled={loading}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm" dir="rtl">تأكيد كلمة المرور</Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    disabled={loading}
                    dir="ltr"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  إنشاء حساب
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <p dir="rtl">
            هل أنت مسوق؟{' '}
            <Link to="/affiliate/register" className="text-primary hover:underline">
              انضم كمسوق
            </Link>
          </p>
          <Link to="/" className="text-primary hover:underline">
            العودة إلى الصفحة الرئيسية
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

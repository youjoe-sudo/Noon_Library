// صفحة إنشاء حساب المدير (Create Admin Page)
import { useState } from 'react';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
  admin?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  credentials?: {
    username: string;
    password: string;
    email: string;
  };
}

export default function CreateAdmin() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdminResponse | null>(null);
  const navigate = useNavigate();

  const createAdminAccount = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke<AdminResponse>('create-admin', {
        method: 'POST',
      });

      if (error) {
        setResult({
          success: false,
          error: 'فشل الاتصال بالخادم',
          details: error.message,
        });
        return;
      }

      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'حدث خطأ غير متوقع',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Shield className="h-8 w-8 text-primary" />
              إنشاء حساب المدير
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                سيتم إنشاء حساب مدير جديد بالبيانات التالية:
              </p>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">اسم المستخدم:</span>
                  <code className="bg-background px-2 py-1 rounded">Admin</code>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">كلمة المرور:</span>
                  <code className="bg-background px-2 py-1 rounded">Noon.admin</code>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">البريد الإلكتروني:</span>
                  <code className="bg-background px-2 py-1 rounded">Admin@miaoda.com</code>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">الدور:</span>
                  <code className="bg-background px-2 py-1 rounded text-primary font-bold">admin</code>
                </div>
              </div>

              <Button
                onClick={createAdminAccount}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 ml-2" />
                    إنشاء حساب المدير
                  </>
                )}
              </Button>
            </div>

            {result && (
              <Alert variant={result.success ? 'default' : 'destructive'}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-2">
                    <AlertDescription className="font-medium">
                      {result.message || result.error}
                    </AlertDescription>
                    {result.details && (
                      <AlertDescription className="text-sm opacity-80">
                        {result.details}
                      </AlertDescription>
                    )}
                    {result.success && result.admin && (
                      <div className="mt-4 p-4 bg-background rounded-lg space-y-2">
                        <p className="font-bold text-green-600 dark:text-green-400">
                          ✅ تم إنشاء الحساب بنجاح!
                        </p>
                        <div className="space-y-1 text-sm">
                          <p>
                            <strong>معرف المستخدم:</strong>{' '}
                            <code className="bg-muted px-2 py-0.5 rounded text-xs">
                              {result.admin.id}
                            </code>
                          </p>
                          <p>
                            <strong>اسم المستخدم:</strong> {result.admin.username}
                          </p>
                          <p>
                            <strong>البريد الإلكتروني:</strong> {result.admin.email}
                          </p>
                          <p>
                            <strong>الدور:</strong>{' '}
                            <span className="text-primary font-bold">{result.admin.role}</span>
                          </p>
                        </div>
                        {result.credentials && (
                          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded">
                            <p className="font-bold mb-2">بيانات تسجيل الدخول:</p>
                            <div className="space-y-1 text-sm">
                              <p>
                                <strong>اسم المستخدم:</strong>{' '}
                                <code className="bg-background px-2 py-0.5 rounded">
                                  {result.credentials.username}
                                </code>
                              </p>
                              <p>
                                <strong>كلمة المرور:</strong>{' '}
                                <code className="bg-background px-2 py-0.5 rounded">
                                  {result.credentials.password}
                                </code>
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-3 mt-4">
                          <Button onClick={() => navigate('/login')} className="flex-1">
                            تسجيل الدخول الآن
                          </Button>
                          <Button
                            onClick={() => navigate('/test-permissions')}
                            variant="outline"
                            className="flex-1"
                          >
                            اختبار الصلاحيات
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            )}

            <div className="pt-4 border-t">
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                العودة للرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

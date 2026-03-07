// صفحة ممنوع الوصول (Forbidden Page)
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center py-16">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-16 text-center">
            <ShieldAlert className="h-20 w-20 mx-auto mb-6 text-destructive" />
            <h1 className="text-4xl font-bold mb-4">403</h1>
            <h2 className="text-2xl font-semibold mb-4" dir="rtl">
              ممنوع الوصول
            </h2>
            <p className="text-muted-foreground mb-8" dir="rtl">
              ليس لديك صلاحية للوصول إلى هذه الصفحة
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate(-1)} variant="outline">
                العودة
              </Button>
              <Button onClick={() => navigate('/')}>
                الصفحة الرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

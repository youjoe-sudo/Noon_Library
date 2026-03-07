// التحليلات (Admin Analytics)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminAnalytics() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" dir="rtl">التحليلات</h1>
      <Card>
        <CardHeader>
          <CardTitle dir="rtl">تحليلات المبيعات</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground" dir="rtl">
            صفحة التحليلات قيد التطوير
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

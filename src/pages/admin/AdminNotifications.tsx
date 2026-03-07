// صفحة إشعارات الإدارة (Admin Notifications Page)
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  sendBulkNotification,
} from '@/db/api';
import type { AdminNotification } from '@/types';
import {
  Bell,
  DollarSign,
  ShoppingBag,
  CheckCircle,
  Clock,
  TrendingUp,
  Send,
  Loader2,
} from 'lucide-react';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // حالة مربع حوار إرسال الإشعار (Send notification dialog state)
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    recipient_type: 'all' as 'all' | 'customers' | 'affiliates',
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getAdminNotifications(false);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الإشعارات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAdminNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      toast({
        title: 'تم',
        description: 'تم تحديد الإشعار كمقروء',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحديث الإشعار',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAdminNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast({
        title: 'تم',
        description: 'تم تحديد جميع الإشعارات كمقروءة',
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحديث الإشعارات',
        variant: 'destructive',
      });
    }
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSending(true);
      await sendBulkNotification(
        notificationForm.title,
        notificationForm.message,
        notificationForm.recipient_type
      );
      
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال الإشعار بنجاح',
      });
      
      setSendDialogOpen(false);
      setNotificationForm({
        title: '',
        message: '',
        recipient_type: 'all',
      });
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل إرسال الإشعار',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, any> = {
      affiliate_earnings: DollarSign,
      new_order: ShoppingBag,
      order_status: TrendingUp,
      default: Bell,
    };
    const Icon = icons[type] || icons.default;
    return <Icon className="h-5 w-5" />;
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-8 bg-muted" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-full mb-2 bg-muted" />
                <Skeleton className="h-4 w-3/4 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" dir="rtl">
            الإشعارات
          </h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setSendDialogOpen(true)}>
            <Send className="ml-2 h-4 w-4" />
            إرسال إشعار
          </Button>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <CheckCircle className="ml-2 h-4 w-4" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid w-full md:w-[400px] grid-cols-3">
          <TabsTrigger value="all">
            الكل ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            غير مقروء ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            مقروء ({notifications.length - unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-16 text-center">
                <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg text-muted-foreground" dir="rtl">
                  لا توجد إشعارات
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all ${
                    !notification.is_read
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-full ${
                          !notification.is_read
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3
                            className={`text-lg font-semibold ${
                              !notification.is_read ? 'text-primary' : ''
                            }`}
                            dir="rtl"
                          >
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <Badge variant="default">جديد</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-3" dir="rtl">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(
                                notification.created_at
                              ).toLocaleString('ar-EG', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {!notification.is_read && (
                            <Button
                              onClick={() => handleMarkAsRead(notification.id)}
                              variant="ghost"
                              size="sm"
                            >
                              <CheckCircle className="ml-2 h-4 w-4" />
                              تحديد كمقروء
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* مربع حوار إرسال إشعار (Send Notification Dialog) */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle dir="rtl">إرسال إشعار جديد</DialogTitle>
            <DialogDescription dir="rtl">
              أرسل إشعاراً إلى المستخدمين أو المسوقين
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* الفئة المستهدفة (Target Audience) */}
            <div>
              <Label htmlFor="recipient_type" dir="rtl">الفئة المستهدفة *</Label>
              <Select
                value={notificationForm.recipient_type}
                onValueChange={(value: 'all' | 'customers' | 'affiliates') =>
                  setNotificationForm({ ...notificationForm, recipient_type: value })
                }
              >
                <SelectTrigger dir="rtl">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">الجميع (مشترين ومسوقين)</SelectItem>
                  <SelectItem value="customers">المشترين فقط</SelectItem>
                  <SelectItem value="affiliates">المسوقين فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* عنوان الإشعار (Notification Title) */}
            <div>
              <Label htmlFor="title" dir="rtl">عنوان الإشعار *</Label>
              <Input
                id="title"
                value={notificationForm.title}
                onChange={(e) =>
                  setNotificationForm({ ...notificationForm, title: e.target.value })
                }
                dir="rtl"
                placeholder="مثال: عرض خاص على جميع الكتب"
              />
            </div>

            {/* نص الإشعار (Notification Message) */}
            <div>
              <Label htmlFor="message" dir="rtl">نص الإشعار *</Label>
              <Textarea
                id="message"
                value={notificationForm.message}
                onChange={(e) =>
                  setNotificationForm({ ...notificationForm, message: e.target.value })
                }
                dir="rtl"
                rows={4}
                placeholder="اكتب نص الإشعار هنا..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSendDialogOpen(false)}
              disabled={sending}
            >
              إلغاء
            </Button>
            <Button onClick={handleSendNotification} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="ml-2 h-4 w-4" />
                  إرسال
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

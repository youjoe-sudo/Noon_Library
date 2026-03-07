// مكون حماية المسارات (Protected Route Component)
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'affiliate' | 'user';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔐 ProtectedRoute - التحقق من الصلاحيات:', {
      loading,
      user: user?.id,
      profile: profile,
      requiredRole
    });

    if (!loading) {
      // إذا لم يكن المستخدم مسجل دخول
      if (!user) {
        console.log('❌ المستخدم غير مسجل دخول - إعادة توجيه إلى صفحة تسجيل الدخول');
        navigate('/login');
        return;
      }

      // إذا كان هناك دور مطلوب
      if (requiredRole) {
        // إذا لم يتم تحميل الملف الشخصي بعد
        if (!profile) {
          console.error('❌ لم يتم تحميل الملف الشخصي - إعادة توجيه إلى 403');
          navigate('/403');
          return;
        }

        // التحقق من الدور
        if (profile.role !== requiredRole) {
          console.error(`❌ الوصول مرفوض. الدور المطلوب: ${requiredRole}, دور المستخدم: ${profile.role}`);
          navigate('/403');
          return;
        }
        
        console.log('✅ الوصول مسموح - الدور صحيح:', profile.role);
      }
    }
  }, [user, profile, loading, requiredRole, navigate]);

  // عرض شاشة التحميل أثناء التحقق
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  // إذا لم يكن المستخدم مسجل دخول
  if (!user) {
    return null;
  }

  // إذا كان هناك دور مطلوب ولم يتم تحميل الملف الشخصي
  if (requiredRole && !profile) {
    return null;
  }

  // إذا كان هناك دور مطلوب ولا يتطابق مع دور المستخدم
  if (requiredRole && profile && profile.role !== requiredRole) {
    return null;
  }

  // عرض المحتوى المحمي
  return <>{children}</>;
}

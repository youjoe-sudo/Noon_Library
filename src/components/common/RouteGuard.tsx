import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

// الصفحات التي يمكن الوصول إليها بدون تسجيل دخول (Pages accessible without login)
const PUBLIC_ROUTES = ['/login', '/403', '/404', '/', '/books', '/books/*', '/affiliate/register'];

// المسارات المخصصة للمشرفين فقط (Admin-only routes)
const ADMIN_ROUTES = ['/admin', '/admin/*'];

function matchRoute(path: string, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isPublic = matchRoute(location.pathname, PUBLIC_ROUTES);
    const isAdminRoute = matchRoute(location.pathname, ADMIN_ROUTES);

    // التحقق من تسجيل الدخول (Check login)
    if (!user && !isPublic) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    // التحقق من صلاحيات المشرف (Check admin permissions)
    if (isAdminRoute && user && profile?.role !== 'admin') {
      navigate('/403', { replace: true });
      return;
    }
  }, [user, profile, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
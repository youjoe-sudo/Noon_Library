// تطبيق مكتبة نون (Noon Library App)
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { Toaster } from '@/components/ui/toaster';
import { recordTrackingClick } from '@/db/api'; // استيراد دالة تسجيل النقرات
import routes from './routes';

const App: React.FC = () => {
  // --- كود تتبع المسوقين الجديد ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    
    if (refCode) {
      // تخزين الكود عشان يفضل معانا حتى لو العميل قفل الموقع ورجع تاني
      localStorage.setItem('affiliate_ref', refCode);
      
      // تسجيل النقرة في الداتا بيز للإحصائيات
      recordTrackingClick(refCode).catch(err => {
        console.error('Failed to record click:', err);
      });
    }
  }, []);
  // ------------------------------

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <RouteGuard>
              <IntersectObserver />
              <div className="flex flex-col min-h-screen" dir="rtl">
                <Header />
                <main className="flex-grow">
                  <Routes>
                    {routes.map((route, index) => {
                      if (route.children) {
                        return (
                          <Route key={index} path={route.path} element={route.element}>
                            {route.children.map((child, childIndex) => (
                              <Route
                                key={childIndex}
                                path={child.path}
                                element={child.element}
                              />
                            ))}
                          </Route>
                        );
                      }
                      return (
                        <Route
                          key={index}
                          path={route.path}
                          element={route.element}
                        />
                      );
                    })}
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </main>
                <Footer />
              </div>
              <Toaster />
            </RouteGuard>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
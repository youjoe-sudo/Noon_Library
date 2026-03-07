// تطبيق مكتبة نون (Noon Library App)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { Toaster } from '@/components/ui/toaster';
import routes from './routes';

const App: React.FC = () => {
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

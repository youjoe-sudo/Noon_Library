// تكوين المسارات لمكتبة نون (Routes Configuration for Noon Library)
import type { ReactNode } from 'react';
import Home from './pages/Home';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import PaymentDeposit from './pages/PaymentDeposit';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Notifications from './pages/Notifications';
import AffiliateRegister from './pages/AffiliateRegister';
import AffiliateDashboard from './pages/AffiliateDashboard';
import AffiliateCoupons from './pages/AffiliateCoupons';
import { AdminLayout } from './components/layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminBooks from './pages/admin/AdminBooks';
import AdminOrders from './pages/admin/AdminOrders';
import AdminAffiliates from './pages/admin/AdminAffiliates';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import PermissionsTest from './pages/PermissionsTest';
import CreateAdmin from './pages/CreateAdmin';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  children?: RouteConfig[];
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <Home />,
  },
  {
    name: 'Books',
    path: '/books',
    element: <Books />,
  },
  {
    name: 'Book Detail',
    path: '/books/:id',
    element: <BookDetail />,
  },
  {
    name: 'Cart',
    path: '/cart',
    element: <Cart />,
  },
  {
    name: 'Checkout',
    path: '/checkout',
    element: <Checkout />,
  },
  {
    name: 'Orders',
    path: '/orders',
    element: <Orders />,
  },
  {
    name: 'Payment Deposit',
    path: '/payment/:orderId',
    element: <PaymentDeposit />,
  },
  {
    name: 'Wishlist',
    path: '/wishlist',
    element: <Wishlist />,
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <Profile />,
  },
  {
    name: 'Notifications',
    path: '/notifications',
    element: <Notifications />,
  },
  {
    name: 'Login',
    path: '/login',
    element: <Login />,
  },
  {
    name: 'Affiliate Register',
    path: '/affiliate/register',
    element: <AffiliateRegister />,
  },
  {
    name: 'Affiliate Dashboard',
    path: '/affiliate/dashboard',
    element: <AffiliateDashboard />,
  },
  {
    name: 'Affiliate Coupons',
    path: '/affiliate/coupons',
    element: <AffiliateCoupons />,
  },
  {
    name: 'Forbidden',
    path: '/403',
    element: <Forbidden />,
  },
  {
    name: 'Permissions Test',
    path: '/test-permissions',
    element: <PermissionsTest />,
  },
  {
    name: 'Create Admin',
    path: '/create-admin',
    element: <CreateAdmin />,
  },
  {
    name: 'Admin',
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        name: 'Admin Dashboard',
        path: '',
        element: <AdminDashboard />,
      },
      {
        name: 'Admin Books',
        path: 'books',
        element: <AdminBooks />,
      },
      {
        name: 'Admin Orders',
        path: 'orders',
        element: <AdminOrders />,
      },
      {
        name: 'Admin Affiliates',
        path: 'affiliates',
        element: <AdminAffiliates />,
      },
      {
        name: 'Admin Notifications',
        path: 'notifications',
        element: <AdminNotifications />,
      },
      {
        name: 'Admin Analytics',
        path: 'analytics',
        element: <AdminAnalytics />,
      },
    ],
  },
  {
    name: 'Not Found',
    path: '*',
    element: <NotFound />,
  },
];

export default routes;

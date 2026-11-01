import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './store/auth';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import BoardPage from './pages/BoardPage';
import ProfilePage from './pages/ProfilePage';
import { InsightsPage, JobsPage } from './pages/RemotePages';

function RequireAuth() {
  const token = useAuth((s) => s.refreshToken);
  const location = useLocation();
  return token ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <AuthPage mode="login" /> },
  { path: '/register', element: <AuthPage mode="register" /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/board" replace /> },
          { path: '/board', element: <BoardPage /> },
          { path: '/jobs', element: <JobsPage /> },
          { path: '/insights', element: <InsightsPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

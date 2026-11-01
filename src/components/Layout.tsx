import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { coreApi } from '../lib/api';
import { useAuth, type User } from '../store/auth';
import { Button } from '../ui';

const links = [
  { to: '/board', label: 'Board' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/insights', label: 'Insights' },
  { to: '/profile', label: 'Profile' },
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, setUser, refreshToken, clear } = useAuth();

  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await coreApi.get<User>('/auth/me')).data,
  });
  useEffect(() => {
    if (me.data) setUser(me.data);
  }, [me.data, setUser]);

  async function logout() {
    if (refreshToken) await coreApi.post('/auth/logout', { refreshToken }).catch(() => undefined);
    clear();
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <span className="text-lg font-semibold text-indigo-600">JobRadar</span>
          <nav className="flex gap-1 overflow-x-auto">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{user?.fullName}</span>
            <Button variant="secondary" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

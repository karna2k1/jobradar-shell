import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage, publicApi, type AuthResponse } from '../lib/api';
import { useAuth } from '../store/auth';
import { Button, Card, ErrorNote, Input } from '../ui';

const schema = z.object({
  fullName: z.string().max(120).optional(),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters').max(72),
});
type Form = z.infer<typeof schema>;

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const setTokens = useAuth((s) => s.setTokens);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Form) {
    setError(null);
    if (mode === 'register' && !values.fullName?.trim()) {
      setError('Enter your name');
      return;
    }
    try {
      const { data } = await publicApi.post<AuthResponse>(`/auth/${mode}`, values);
      setTokens(data.accessToken, data.refreshToken);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(mode === 'register' ? '/profile' : from ?? '/board', { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const isRegister = mode === 'register';
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold text-indigo-600">JobRadar</h1>
        <p className="mb-5 text-sm text-slate-500">{isRegister ? 'Create your account' : 'Sign in to your job radar'}</p>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
          {isRegister && (
            <label className="block text-sm">
              Full name
              <Input className="mt-1" autoComplete="name" {...register('fullName')} />
            </label>
          )}
          <label className="block text-sm">
            Email
            <Input className="mt-1" type="email" autoComplete="email" {...register('email')} />
            {formState.errors.email && <span className="text-xs text-rose-600">{formState.errors.email.message}</span>}
          </label>
          <label className="block text-sm">
            Password
            <Input className="mt-1" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} {...register('password')} />
            {formState.errors.password && <span className="text-xs text-rose-600">{formState.errors.password.message}</span>}
          </label>
          {error && <ErrorNote message={error} />}
          <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          {isRegister ? 'Already have an account? ' : 'New here? '}
          <Link className="font-medium text-indigo-600" to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </Card>
    </div>
  );
}

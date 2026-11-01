import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthPage from './AuthPage';

const post = vi.fn().mockResolvedValue({ data: { accessToken: 'a', refreshToken: 'r', expiresIn: 900 } });
vi.mock('../lib/api', () => ({ publicApi: { post: (...args: unknown[]) => post(...args) }, errorMessage: String }));

describe('AuthPage', () => {
  it('submits typed credentials (inputs are registered with react-hook-form)', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthPage mode="login" />
      </MemoryRouter>,
    );
    fireEvent.input(container.querySelector('input[type=email]')!, { target: { value: 'demo@jobradar.dev' } });
    fireEvent.input(container.querySelector('input[type=password]')!, { target: { value: 'Passw0rd!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/auth/login', expect.objectContaining({ email: 'demo@jobradar.dev', password: 'Passw0rd!' })),
    );
  });
});

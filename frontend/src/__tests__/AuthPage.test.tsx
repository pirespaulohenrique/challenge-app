import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthPage from '../app/page';
import { fetchClient } from '@/lib/fetchClient';
import { useRouter } from 'next/navigation';

// --- Mocks ---
jest.mock('@/lib/fetchClient', () => ({
  fetchClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('AuthPage Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  test('renders Login form by default', () => {
    render(<AuthPage />);
    expect(
      screen.getByRole('heading', { name: /welcome back/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Username$/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
  });

  test('toggles between Sign In and Sign Up modes', async () => {
    render(<AuthPage />);

    const toggleButton = screen.getByRole('button', {
      name: /don't have an account/i,
    });
    fireEvent.click(toggleButton);

    expect(
      screen.getByRole('heading', { name: /create account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm Password$/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign up/i })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /already have an account/i })
    );
    expect(
      screen.getByRole('heading', { name: /welcome back/i })
    ).toBeInTheDocument();
  });

  test('validates empty inputs on Login', async () => {
    render(<AuthPage />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText(/username and password are required/i)
    ).toBeInTheDocument();
    expect(fetchClient).not.toHaveBeenCalled();
  });

  test('validates password mismatch on Sign Up', async () => {
    render(<AuthPage />);

    fireEvent.click(screen.getByText(/don't have an account/i));

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/first name/i), 'Test');
    await userEvent.type(screen.getByLabelText(/last name/i), 'User');

    // Exact match regex to avoid selecting the eye icon
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'password123');
    await userEvent.type(
      screen.getByLabelText(/^Confirm Password$/i),
      'mismatch'
    );

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(
      await screen.findByText(/passwords do not match/i)
    ).toBeInTheDocument();
    expect(fetchClient).not.toHaveBeenCalled();
  });

  test('handles successful login and redirects', async () => {
    (fetchClient as jest.Mock).mockResolvedValueOnce({
      sessionId: 'session-123',
      user: { id: '1', username: 'user1' },
    });

    render(<AuthPage />);

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'validuser');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'validpass');

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(fetchClient).toHaveBeenCalledWith(
        '/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('validuser'),
        })
      );
    });

    expect(localStorage.getItem('sessionId')).toBe('session-123');
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  test('displays API errors', async () => {
    (fetchClient as jest.Mock).mockRejectedValueOnce(
      new Error('Invalid credentials')
    );

    render(<AuthPage />);

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'wrong');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'wrong');

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});

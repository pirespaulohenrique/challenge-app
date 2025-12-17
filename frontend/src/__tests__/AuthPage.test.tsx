import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthPage from '../app/page'; // Adjust path if needed
import { fetchClient } from '@/lib/fetchClient';
import { useRouter } from 'next/navigation';

// --- MOCKS ---
// 1. Mock the API client
jest.mock('@/lib/fetchClient', () => ({
  fetchClient: jest.fn(),
}));

// 2. Mock the Next.js Router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('AuthPage (Login & Sign Up)', () => {
  const mockPush = jest.fn();
  const mockFetchClient = fetchClient as jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    // Mock localStorage
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.getItem = jest.fn(() => null);
  });

  it('renders the Login form by default', () => {
    render(<AuthPage />);
    expect(
      screen.getByRole('heading', { name: /welcome back/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it('switches to Sign Up mode when link is clicked', () => {
    render(<AuthPage />);

    const toggleLink = screen.getByText(/don't have an account\? sign up/i);
    fireEvent.click(toggleLink);

    expect(
      screen.getByRole('heading', { name: /create account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign up/i })
    ).toBeInTheDocument();
  });

  it('shows validation error if fields are empty', async () => {
    render(<AuthPage />);

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    // Should see Snackbar with error
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });
  });

  it('validates password length during Sign Up', async () => {
    render(<AuthPage />);
    // Switch to Sign Up
    fireEvent.click(screen.getByText(/don't have an account\? sign up/i));

    // Fill short inputs
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'validUser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '123' },
    }); // Short

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 6 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('calls login API and redirects on success', async () => {
    // Setup Mock Success Response
    mockFetchClient.mockResolvedValueOnce({
      sessionId: 'fake-session-token',
      user: { id: '1', username: 'testuser' },
    });

    render(<AuthPage />);

    // Fill Form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify
    await waitFor(() => {
      expect(mockFetchClient).toHaveBeenCalledWith(
        '/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            username: 'testuser',
            password: 'password123',
          }),
        })
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'sessionId',
        'fake-session-token'
      );
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles API errors gracefully', async () => {
    // Setup Mock Error
    mockFetchClient.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'wrong' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});

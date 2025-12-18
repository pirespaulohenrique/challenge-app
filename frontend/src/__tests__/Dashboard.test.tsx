import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../app/dashboard/page';
import { fetchClient } from '@/lib/fetchClient';
import { useRouter } from 'next/navigation';
import { ThemeContext } from '@/context/ThemeContext'; // Ensure this is exported in ThemeContext.tsx

// --- Mocks ---
jest.mock('@/lib/fetchClient', () => ({
  fetchClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/components/TopBar', () => () => (
  <div data-testid="top-bar">TopBar</div>
));

// Mock User 1 as the logged in admin
const mockUser = {
  id: '1',
  firstName: 'Admin',
  lastName: 'User',
  username: 'admin',
};

const mockUsersData = {
  data: [
    {
      id: '1',
      username: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      status: 'active',
      loginsCounter: 5,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-02',
    },
    {
      id: '2',
      username: 'user2',
      firstName: 'Jane',
      lastName: 'Smith',
      status: 'inactive',
      loginsCounter: 0,
      createdAt: '2023-01-05',
      updatedAt: '2023-01-05',
    },
  ],
  meta: { total: 2, lastPage: 1, page: 1 },
};

describe('Dashboard Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });
  });

  const renderDashboard = () => {
    return render(
      <ThemeContext.Provider value={{ mode: 'light', toggleTheme: jest.fn() }}>
        <Dashboard />
      </ThemeContext.Provider>
    );
  };

  test('fetches and displays users on load', async () => {
    (fetchClient as jest.Mock).mockResolvedValue(mockUsersData);

    renderDashboard();

    await waitFor(() => {
      expect(fetchClient).toHaveBeenCalledWith(
        expect.stringContaining('/users?')
      );
    });

    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
  });

  test('triggers sorting when clicking headers', async () => {
    (fetchClient as jest.Mock).mockResolvedValue(mockUsersData);
    renderDashboard();

    await waitFor(() => expect(screen.getByText('user1')).toBeInTheDocument());

    const usernameHeader = screen.getByRole('button', { name: /username/i });
    fireEvent.click(usernameHeader);

    await waitFor(() => {
      expect(fetchClient).toHaveBeenCalledWith(
        expect.stringContaining('orderBy=username')
      );
    });
  });

  test('opens Add User modal and submits data', async () => {
    (fetchClient as jest.Mock).mockResolvedValue(mockUsersData);
    renderDashboard();

    await waitFor(() => expect(screen.getByText('user1')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /add user/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('New User')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'newuser');
    await userEvent.type(screen.getByLabelText(/first name/i), 'New');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Person');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'password123');
    await userEvent.type(
      screen.getByLabelText(/^Confirm Password$/i),
      'password123'
    );

    (fetchClient as jest.Mock).mockResolvedValueOnce({});

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(fetchClient).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('newuser'),
        })
      );
    });

    expect(
      await screen.findByText(/user created successfully/i)
    ).toBeInTheDocument();
  });

  test('opens Delete confirmation and deletes user', async () => {
    (fetchClient as jest.Mock).mockResolvedValue(mockUsersData);
    renderDashboard();

    await waitFor(() => expect(screen.getByText('user1')).toBeInTheDocument());

    // FIX: Select the second row (User 2) to avoid self-deletion logic which causes logout
    const rows = screen.getAllByRole('row');
    // Row 0 = Header, Row 1 = User 1 (Admin), Row 2 = User 2
    const targetUserRow = rows[2];
    const deleteBtn = within(targetUserRow)
      .getByTestId('DeleteIcon')
      .closest('button');

    if (deleteBtn) fireEvent.click(deleteBtn);

    expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();

    (fetchClient as jest.Mock).mockResolvedValueOnce({});

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      // Expect API call for ID 2
      expect(fetchClient).toHaveBeenCalledWith(
        '/users/2',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    expect(
      await screen.findByText(/user deleted successfully/i)
    ).toBeInTheDocument();
  });
});

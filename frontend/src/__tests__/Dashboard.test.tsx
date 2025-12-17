import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../app/dashboard/page';
import { fetchClient } from '@/lib/fetchClient';
import { useRouter } from 'next/navigation';

// --- MOCKS ---
jest.mock('@/lib/fetchClient', () => ({
  fetchClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the TopBar component to simplify test (optional but cleaner)
jest.mock('@/components/TopBar', () => {
  return function MockTopBar() {
    return <div data-testid="topbar">TopBar</div>;
  };
});

describe('Dashboard', () => {
  const mockFetchClient = fetchClient as jest.Mock;
  const mockPush = jest.fn();

  // Dummy Data
  const mockUsers = [
    {
      id: '1',
      username: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      status: 'active',
      loginsCounter: 5,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-02',
    },
    {
      id: '2',
      username: 'user2',
      firstName: 'Jane',
      lastName: 'Smith',
      status: 'inactive',
      loginsCounter: 0,
      createdAt: '2025-02-01',
      updatedAt: '2025-02-02',
    },
  ];

  const mockMeta = {
    totalItems: 2,
    currentPage: 1,
    lastPage: 1,
    total: 2, // Defensive check we added earlier
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    Storage.prototype.getItem = jest.fn(() =>
      JSON.stringify({ id: 'admin-id', username: 'admin' })
    );
  });

  it('fetches and displays users on load', async () => {
    mockFetchClient.mockResolvedValueOnce({ data: mockUsers, meta: mockMeta });

    render(<Dashboard />);

    // Check if fetch was called with defaults
    expect(mockFetchClient).toHaveBeenCalledWith(
      expect.stringContaining('/users?page=1')
    );

    // Wait for data to render
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
      expect(screen.getByText('Total: 2')).toBeInTheDocument();
    });
  });

  it('triggers sorting when clicking a header', async () => {
    // 1st Call: Initial Load
    mockFetchClient.mockResolvedValueOnce({ data: mockUsers, meta: mockMeta });

    render(<Dashboard />);
    await waitFor(() => screen.getByText('user1')); // Wait for load

    // 2nd Call: Sort by Username
    mockFetchClient.mockResolvedValueOnce({ data: [], meta: mockMeta }); // Return empty for simplicity

    const usernameHeader = screen.getByText('Username');
    fireEvent.click(usernameHeader);

    await waitFor(() => {
      // Check if API was called with sort params
      expect(mockFetchClient).toHaveBeenLastCalledWith(
        expect.stringContaining('orderBy=username')
      );
    });
  });

  it('opens "Add User" dialog and validates input', async () => {
    mockFetchClient.mockResolvedValue({ data: [], meta: mockMeta });
    render(<Dashboard />);

    // Click Add User
    fireEvent.click(screen.getByRole('button', { name: /add user/i }));

    // Dialog should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('New User')).toBeInTheDocument();

    // Try to save empty
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    // Expect Validation Error
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });
  });

  it('successfully creates a new user', async () => {
    mockFetchClient.mockResolvedValue({ data: [], meta: mockMeta }); // Initial load
    render(<Dashboard />);

    // Open Dialog
    fireEvent.click(screen.getByRole('button', { name: /add user/i }));

    // Fill Form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'newuser' },
    });
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'New' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'User' },
    });
    // Note: Password fields might need precise selection if multiple inputs exist
    const passwords = screen.getAllByLabelText(/^password/i); // Matches "Password"
    const confirms = screen.getAllByLabelText(/confirm password/i);

    fireEvent.change(passwords[0], { target: { value: 'password123' } });
    fireEvent.change(confirms[0], { target: { value: 'password123' } });

    // Submit
    mockFetchClient.mockResolvedValueOnce({ id: 'new-id' }); // Create Success
    mockFetchClient.mockResolvedValueOnce({ data: mockUsers, meta: mockMeta }); // Reload list

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      // Check POST call
      expect(mockFetchClient).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('newuser'),
        })
      );
      // Check Success Message
      expect(
        screen.getByText(/user created successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('handles delete user interaction', async () => {
    mockFetchClient.mockResolvedValue({ data: mockUsers, meta: mockMeta });
    render(<Dashboard />);
    await waitFor(() => screen.getByText('user1'));

    // Find delete button for user1 (first row)
    const deleteBtns = screen.getAllByTestId('DeleteIcon');
    // Material UI Icons inside IconButton don't have role="button" easily accessible sometimes,
    // better to use aria-label if added, or rely on the icon wrapper.
    // In our code we didn't add aria-label, so we might need to find the button wrapping the icon.
    // Simplifying: fetch all buttons and filter, or just click the parent of the icon.

    // Simpler approach:
    const rows = screen.getAllByRole('row');
    const firstRow = rows[1]; // 0 is header
    const deleteBtn = within(firstRow).getByRole('button', {
      hidden: true,
      name: /delete/i,
    }); // Material UI often hides icon names, but let's assume standard behavior or just click the icon parent.

    // Actually, in our code: <IconButton ...><DeleteIcon /></IconButton>
    // We can just get all buttons and assume order or add aria-labels in real code.
    // For test stability, let's assume we click the first delete button found.
    const allDeleteButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('svg[data-testid="DeleteIcon"]'));
    fireEvent.click(allDeleteButtons[0]);

    // Dialog appears
    expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();

    // Confirm
    mockFetchClient.mockResolvedValueOnce({}); // Delete success
    mockFetchClient.mockResolvedValueOnce({ data: [], meta: mockMeta }); // Reload

    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    await waitFor(() => {
      expect(mockFetchClient).toHaveBeenCalledWith(
        '/users/1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(
        screen.getByText(/user deleted successfully/i)
      ).toBeInTheDocument();
    });
  });
});

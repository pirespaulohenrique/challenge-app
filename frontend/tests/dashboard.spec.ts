import { test, expect } from '@playwright/test';

test.describe('Dashboard (Mocked API)', () => {
  // Define mock data
  const mockUsers = [
    {
      id: '1',
      username: 'alice',
      firstName: 'Alice',
      lastName: 'A',
      status: 'active',
      loginsCounter: 5,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    {
      id: '2',
      username: 'bob',
      firstName: 'Bob',
      lastName: 'B',
      status: 'inactive',
      loginsCounter: 0,
      createdAt: '2025-02-01',
      updatedAt: '2025-02-01',
    },
  ];

  test.beforeEach(async ({ page }) => {
    // 1. Mock the "Get Users" API call
    // Whenever the frontend asks for /users..., return our mockUsers
    await page.route('**/users?*', async (route) => {
      const json = {
        data: mockUsers,
        meta: { totalItems: 2, currentPage: 1, lastPage: 1 },
      };
      await route.fulfill({ json });
    });

    // 2. Mock LocalStorage to simulate being "Logged In"
    // We bypass the login screen by injecting the session
    await page.addInitScript(() => {
      window.localStorage.setItem('sessionId', 'fake-session-token');
      window.localStorage.setItem(
        'user',
        JSON.stringify({ username: 'admin' })
      );
    });

    // 3. Go straight to dashboard
    await page.goto('/dashboard');
  });

  test('should display the user list correctly', async ({ page }) => {
    // Check if Alice and Bob are visible
    await expect(page.getByText('alice')).toBeVisible();
    await expect(page.getByText('bob')).toBeVisible();

    // Check if the Total count matches our mock
    await expect(page.getByText('Total: 2')).toBeVisible();
  });

  test('should open Add User modal', async ({ page }) => {
    await page.click('button:has-text("Add User")');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('New User')).toBeVisible();
  });

  test('should validate input in Add User modal', async ({ page }) => {
    await page.click('button:has-text("Add User")');

    // Click Save empty
    await page.click('button:has-text("Save")');

    // Expect error
    await expect(page.getByRole('alert')).toContainText('Username is required');
  });

  test('should trigger delete confirmation', async ({ page }) => {
    // Click the delete icon (using aria-label is best, or finding by icon class)
    // Since we added aria-label in previous steps, we can use it:
    // If not, we can select by the SVG or the button index.

    // Let's assume we click the second delete button (for Bob)
    const deleteButtons = page.locator('button svg[data-testid="DeleteIcon"]');
    await deleteButtons.nth(1).click();

    await expect(page.getByText('Confirm Deletion')).toBeVisible();
    await expect(
      page.getByText('Are you sure you want to delete this user?')
    ).toBeVisible();
  });
});

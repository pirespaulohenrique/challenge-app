import { test, expect } from '@playwright/test';

test.describe('Dashboard Management', () => {
  const adminUser = {
    username: `admin_${Date.now()}`,
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  test.beforeAll(async ({ request }) => {
    // SEED: Create a user via API to ensure we can log in
    const res = await request.post(`${API_URL}/auth/register`, {
      data: adminUser,
    });
    // Ensure seed was successful
    expect(res.ok()).toBeTruthy();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Username').fill(adminUser.username);
    await page.getByLabel(/^Password/i).fill(adminUser.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display user list and stats', async ({ page }) => {
    // FIX: strict mode violation. 'exact: true' will match "User Management" but NOT "USER MANAGEMENT" (TopBar)
    await expect(
      page.getByText('User Management', { exact: true })
    ).toBeVisible();

    // Matches "Total: 1" etc.
    await expect(page.getByText(/^Total:/)).toBeVisible();
    await expect(
      page.getByRole('cell', { name: adminUser.username })
    ).toBeVisible();
  });

  test('should create a new user via dashboard', async ({ page }) => {
    const dashboardUser = `dash_${Date.now()}`;

    await page.getByRole('button', { name: 'Add User' }).click();

    await expect(page.getByRole('heading', { name: 'New User' })).toBeVisible();

    await page.getByLabel('Username').fill(dashboardUser);
    await page.getByLabel('First Name').fill('Dash');
    await page.getByLabel('Last Name').fill('Board');

    await page.getByLabel(/^Password/i).fill('password123');
    await page.getByLabel(/^Confirm Password/i).fill('password123');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(
      page.getByRole('heading', { name: 'New User' })
    ).not.toBeVisible();
    await expect(page.getByText('User created successfully')).toBeVisible();
    await expect(page.getByRole('cell', { name: dashboardUser })).toBeVisible();
  });

  test('should delete a user', async ({ page }) => {
    // 1. Create a user to delete
    const victimUser = `del_${Date.now()}`;
    await page.getByRole('button', { name: 'Add User' }).click();
    await page.getByLabel('Username').fill(victimUser);
    await page.getByLabel('First Name').fill('To');
    await page.getByLabel('Last Name').fill('Delete');
    await page.getByLabel(/^Password/i).fill('123456');
    await page.getByLabel(/^Confirm Password/i).fill('123456');
    await page.getByRole('button', { name: 'Save' }).click();

    // Wait for the user to appear in the table
    await expect(page.getByRole('cell', { name: victimUser })).toBeVisible();

    // 2. Find row containing this user and click delete
    const row = page.getByRole('row', { name: victimUser });
    await row.getByTestId('DeleteIcon').click();

    // 3. Confirm Deletion
    await expect(page.getByText('Confirm Deletion')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    // 4. Verify Disappearance
    await expect(page.getByText('User deleted successfully')).toBeVisible();
    await expect(
      page.getByRole('cell', { name: victimUser })
    ).not.toBeVisible();
  });
});

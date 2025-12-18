import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const timestamp = Date.now();
  // This user is for the Registration test
  const registerUser = {
    username: `reg_${timestamp}`,
    password: 'password123',
    firstName: 'Playwright',
    lastName: 'Register',
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate between Sign In and Sign Up', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Welcome Back' })
    ).toBeVisible();

    await page
      .getByRole('button', { name: "Don't have an account? Sign Up" })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Create Account' })
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'Already have an account? Sign In' })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Welcome Back' })
    ).toBeVisible();
  });

  test('should register a new user successfully', async ({ page }) => {
    await page
      .getByRole('button', { name: "Don't have an account? Sign Up" })
      .click();

    await page.getByLabel('Username').fill(registerUser.username);
    await page.getByLabel('First Name').fill(registerUser.firstName);
    await page.getByLabel('Last Name').fill(registerUser.lastName);

    await page.getByLabel(/^Password/i).fill(registerUser.password);
    await page.getByLabel(/^Confirm Password/i).fill(registerUser.password);

    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    // Use a unique element on the dashboard to verify
    await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible();
  });

  test('should log in with existing user', async ({ page, request }) => {
    // SEED: Create a user strictly for this test to ensure isolation
    const loginUser = {
      username: `login_${Date.now()}`,
      password: 'password123',
      firstName: 'Login',
      lastName: 'Tester',
    };
    const res = await request.post('http://localhost:3001/auth/register', {
      data: loginUser,
    });
    expect(res.ok()).toBeTruthy();

    await page.getByLabel('Username').fill(loginUser.username);
    await page.getByLabel(/^Password/i).fill(loginUser.password);

    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible();
  });

  test('should log out', async ({ page, request }) => {
    // SEED: Create user
    const logoutUser = {
      username: `logout_${Date.now()}`,
      password: 'password123',
      firstName: 'Logout',
      lastName: 'Tester',
    };
    await request.post('http://localhost:3001/auth/register', {
      data: logoutUser,
    });

    // Login
    await page.getByLabel('Username').fill(logoutUser.username);
    await page.getByLabel(/^Password/i).fill(logoutUser.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await page.getByLabel('Logout').click();

    await expect(page.getByText('Confirm Logout')).toBeVisible();
    await page.getByRole('button', { name: 'Logout' }).click();

    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: 'Welcome Back' })
    ).toBeVisible();
  });
});

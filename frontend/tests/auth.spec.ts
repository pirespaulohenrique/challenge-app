import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const timestamp = Date.now();
  const newUser = {
    username: `user_${timestamp}`,
    password: 'password123',
    firstName: 'Playwright',
    lastName: 'Test',
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

    await page.getByLabel('Username').fill(newUser.username);
    await page.getByLabel('First Name').fill(newUser.firstName);
    await page.getByLabel('Last Name').fill(newUser.lastName);
    await page.getByLabel('Password', { exact: true }).fill(newUser.password);
    await page.getByLabel('Confirm Password').fill(newUser.password);

    await page.getByRole('button', { name: 'Sign Up' }).click();

    // Expect redirection to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('User Management')).toBeVisible();
  });

  test('should log in with existing user', async ({ page }) => {
    // Assuming the user created in the previous step persists (or seed DB before test)
    // Here we use the credentials we just defined, assuming order of execution or persistence

    await page.getByLabel('Username').fill(newUser.username);
    await page.getByLabel('Password', { exact: true }).fill(newUser.password); // Using 'exact' to avoid confirm password label

    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('User Management')).toBeVisible();
  });

  test('should log out', async ({ page }) => {
    // Perform login first
    await page.getByLabel('Username').fill(newUser.username);
    await page.getByLabel('Password', { exact: true }).fill(newUser.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await page.getByLabel('Logout').click();

    // Confirm dialog
    await expect(page.getByText('Confirm Logout')).toBeVisible();
    await page.getByRole('button', { name: 'Logout' }).click();

    // Expect return to login
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: 'Welcome Back' })
    ).toBeVisible();
  });
});

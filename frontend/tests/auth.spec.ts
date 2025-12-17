import { test, expect } from '@playwright/test';

test.describe('Authentication & Navigation', () => {
  const randomId = Math.floor(Math.random() * 100000);
  const testUser = {
    username: `user_${randomId}`,
    password: 'password123',
    firstName: 'Play',
    lastName: 'Wright',
  };

  test('Navigation: Seamless toggling between Sign-in and Sign-up forms', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Welcome Back' })
    ).toBeVisible();
    await page.click('text="Don\'t have an account? Sign Up"');
    await expect(
      page.getByRole('heading', { name: 'Create Account' })
    ).toBeVisible();
    await page.click('text="Already have an account? Sign In"');
    await expect(
      page.getByRole('heading', { name: 'Welcome Back' })
    ).toBeVisible();
  });

  // NEW: Added missing test from README
  test('Auth Flow: Validates empty fields during Sign Up', async ({ page }) => {
    await page.goto('/');
    await page.click('text="Don\'t have an account? Sign Up"');

    // Click Sign Up without filling anything
    await page.click('button:has-text("Sign Up")');

    // Check for validation error (SnackBar or Helper Text)
    // Assuming your validation shows "Username is required"
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test('Auth Flow: User can successfully sign up', async ({ page }) => {
    await page.goto('/');
    await page.click('text="Don\'t have an account? Sign Up"');

    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="firstName"]', testUser.firstName);
    await page.fill('input[name="lastName"]', testUser.lastName);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);

    await page.click('button:has-text("Sign Up")');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('User Management')).toBeVisible();
  });

  test('Auth Flow: User can successfully log in', async ({ page, request }) => {
    const loginUser = {
      username: `login_${randomId}`,
      password: 'password123',
      firstName: 'L',
      lastName: 'T',
    };
    await request.post('/auth/register', { data: loginUser });

    await page.goto('/');
    await page.fill('input[name="username"]', loginUser.username);
    await page.fill('input[name="password"]', loginUser.password);
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL('/dashboard');
  });

  test('Auth Flow: User can log out', async ({ page, request }) => {
    const logoutUser = {
      username: `logout_${randomId}`,
      password: 'password123',
      firstName: 'L',
      lastName: 'T',
    };
    await request.post('/auth/register', { data: logoutUser });

    await page.goto('/');
    await page.fill('input[name="username"]', logoutUser.username);
    await page.fill('input[name="password"]', logoutUser.password);
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/dashboard');

    // Click Logout (Update selector to match your icon or button)
    // Here assume we find the exit/logout button
    await page.locator('button svg[data-testid="ExitToAppIcon"]').click();

    // Handle confirmation if present
    if (await page.getByText('Confirm Logout').isVisible()) {
      await page.click('button:has-text("Logout")');
    }

    await expect(page).toHaveURL('/');
  });
});

import { APP_CONFIG } from '@/lib/constants';

export const RULES = {
  MIN_USERNAME: APP_CONFIG.USER_INFO.MIN_USERNAME,
  MIN_PASSWORD: APP_CONFIG.USER_INFO.MIN_PASSWORD,
};

interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export const validateUserForm = (
  data: {
    username?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
  },
  isCreateMode: boolean // true = New User / Sign Up, false = Edit
): ValidationResult => {
  // 1. Username Validation
  // Required in Create Mode. In Edit mode, we typically don't edit username,
  // but if it were passed, we'd validate it.
  if (isCreateMode) {
    if (!data.username) {
      return { isValid: false, error: 'Username is required' };
    }
    if (data.username.length < RULES.MIN_USERNAME) {
      return {
        isValid: false,
        error: `Username must be at least ${RULES.MIN_USERNAME} characters`,
      };
    }
    if (!data.firstName || !data.lastName) {
      return { isValid: false, error: 'First and Last names are required' };
    }
  }

  // 2. Password Validation
  // - Required in Create Mode
  // - Optional in Edit Mode (only validate if user typed something)
  if (isCreateMode || data.password) {
    if (!data.password) {
      return { isValid: false, error: 'Password is required' };
    }
    if (data.password.length < RULES.MIN_PASSWORD) {
      return {
        isValid: false,
        error: `Password must be at least ${RULES.MIN_PASSWORD} characters`,
      };
    }

    // Check match
    if (
      data.confirmPassword !== undefined &&
      data.password !== data.confirmPassword
    ) {
      return { isValid: false, error: 'Passwords do not match' };
    }
  }

  if (!data.firstName) {
    return { isValid: false, error: 'First name is required' };
  }
  if (!data.lastName) {
    return { isValid: false, error: 'Last name is required' };
  }

  return { isValid: true, error: null };
};

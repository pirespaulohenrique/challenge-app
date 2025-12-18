'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { validateUserForm } from '@/lib/validation';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive';
}

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  userToEdit: User | null;
  isLoading: boolean;
  onError: (message: string) => void;
}

export default function UserFormDialog({
  open,
  onClose,
  onSave,
  userToEdit,
  isLoading,
  onError,
}: UserFormDialogProps) {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEditMode = !!userToEdit;

  useEffect(() => {
    if (open) {
      if (userToEdit) {
        setFormData({
          username: userToEdit.username,
          firstName: userToEdit.firstName,
          lastName: userToEdit.lastName,
          password: '',
          confirmPassword: '',
          status: userToEdit.status,
        });
      } else {
        setFormData({
          username: '',
          firstName: '',
          lastName: '',
          password: '',
          confirmPassword: '',
          status: 'active',
        });
      }
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, userToEdit]);

  const handleSubmit = () => {
    const validation = validateUserForm(
      {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      },
      !isEditMode
    );

    if (!validation.isValid) {
      onError(validation.error || 'Validation Failed');
      return;
    }

    const payload: any = {
      username: formData.username,
      firstName: formData.firstName,
      lastName: formData.lastName,
      status: formData.status,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    onSave(payload);
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () =>
    setShowConfirmPassword((show) => !show);
  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => event.preventDefault();

  const autofillStyle = {
    '& .MuiInputBase-input:-webkit-autofill': {
      WebkitBoxShadow: `0 0 0 100px white inset`,
      transition: 'background-color 5000s ease-in-out 0s',
    },
  };

  const isNameDisabled = isEditMode && formData.status === 'inactive';

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{isEditMode ? 'Edit User' : 'New User'}</DialogTitle>
      <DialogContent sx={{ pt: 2, minWidth: 400 }}>
        <TextField
          margin="dense"
          label="Username"
          fullWidth
          value={formData.username}
          disabled={isEditMode}
          autoComplete="off"
          sx={autofillStyle}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          inputProps={{ 'aria-label': 'username' }}
        />
        <TextField
          margin="dense"
          label="First Name"
          fullWidth
          value={formData.firstName}
          disabled={isNameDisabled}
          sx={autofillStyle}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
          inputProps={{ 'aria-label': 'first name' }}
        />
        <TextField
          margin="dense"
          label="Last Name"
          fullWidth
          value={formData.lastName}
          disabled={isNameDisabled}
          sx={autofillStyle}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
          inputProps={{ 'aria-label': 'last name' }}
        />

        {(!isEditMode || (isEditMode && formData.status !== 'inactive')) && (
          <>
            <TextField
              margin="dense"
              label={isEditMode ? 'New Password (Optional)' : 'Password'}
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={formData.password}
              autoComplete="new-password"
              sx={autofillStyle}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              inputProps={{ 'aria-label': 'password' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="dense"
              label={isEditMode ? 'Confirm New Password' : 'Confirm Password'}
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              value={formData.confirmPassword}
              autoComplete="new-password"
              sx={autofillStyle}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              inputProps={{ 'aria-label': 'confirm password' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowConfirmPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </>
        )}

        <TextField
          margin="dense"
          label="Status"
          select
          fullWidth
          value={formData.status}
          onChange={(e) =>
            setFormData({ ...formData, status: e.target.value as any })
          }
          SelectProps={{ 'aria-label': 'status' } as any}
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

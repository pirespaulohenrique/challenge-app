'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Avatar,
  Stack,
  Switch,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useThemeContext } from '@/context/ThemeContext';
import { fetchClient } from '@/lib/fetchClient';
import { useTheme } from '@mui/material/styles';

interface TopBarProps {
  user: { firstName: string; lastName?: string } | null;
}

export default function TopBar({ user }: TopBarProps) {
  const router = useRouter();
  const { toggleTheme, mode } = useThemeContext();
  const muiTheme = useTheme();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogoutConfirm = async () => {
    try {
      await fetchClient('/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
    router.push('/');
  };

  // Generate initials for the avatar (e.g. "John Doe" -> "JD")
  const getInitials = () => {
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  return (
    <>
      <AppBar
        position="static"
        color="primary"
        enableColorOnDark
        elevation={2}
        sx={{ mb: 4, borderRadius: 1 }}
      >
        <Toolbar>
          {/* LEFT: Logo / App Name */}
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: 1 }}
          >
            USER MANAGEMENT
          </Typography>

          {/* RIGHT: Actions */}
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Theme Toggle Section */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                px: 1,
                py: 0.5,
                borderRadius: 2,
              }}
            >
              <LightModeIcon
                fontSize="small"
                sx={{
                  color: mode === 'light' ? 'yellow' : 'inherit',
                  opacity: mode === 'light' ? 1 : 0.5,
                }}
              />
              <Switch
                checked={mode === 'dark'}
                onChange={toggleTheme}
                color="default"
                size="small"
              />
              <DarkModeIcon
                fontSize="small"
                sx={{
                  color: mode === 'dark' ? '#90caf9' : 'inherit',
                  opacity: mode === 'dark' ? 1 : 0.5,
                }}
              />
            </Stack>

            {/* User Profile Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  bgcolor: muiTheme.palette.secondary.main,
                  width: 32,
                  height: 32,
                  fontSize: '0.9rem',
                }}
              >
                {getInitials()}
              </Avatar>
              <Typography
                variant="body1"
                sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 500 }}
              >
                {user?.firstName}
              </Typography>
            </Box>

            {/* Logout Button */}
            <Tooltip title="Logout">
              <IconButton
                color="inherit"
                onClick={() => setLogoutDialogOpen(true)}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to end your session?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLogoutConfirm} color="error" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

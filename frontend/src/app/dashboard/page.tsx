'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Typography,
  Box,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  DialogContentText,
  Snackbar,
  Alert,
  Stack,
  TableSortLabel,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import { fetchClient } from '@/lib/fetchClient';
import TopBar from '@/components/TopBar';
import { APP_CONFIG } from '@/lib/constants';

// NEW IMPORT
import UserFormDialog from '@/components/UserFormDialog';

// ... (Keep User Interface and Order type same as before) ...
interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive';
  loginsCounter: number;
  createdAt: string;
  updatedAt: string;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
};

type Order = 'ASC' | 'DESC';

export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Sorting State
  const [orderBy, setOrderBy] = useState<keyof User>('createdAt');
  const [order, setOrder] = useState<Order>('DESC');

  const [isLoading, setIsLoading] = useState(false);

  // UI States
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'success' | 'error',
  });
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [selfInactivationOpen, setSelfInactivationOpen] = useState(false);

  // REFACTOR: Logic for Dialog is now simpler
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Temporary storage for self-inactivation payload
  const [pendingSelfUpdate, setPendingSelfUpdate] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
    } else {
      setCurrentUser(JSON.parse(storedUser));
      loadUsers(1, 'createdAt', 'DESC');
    }
  }, [router]);

  const loadUsers = useCallback(
    async (pageNum: number, sortField: string, sortOrder: Order) => {
      setIsLoading(true);
      try {
        const limit = APP_CONFIG.PAGINATION.DEFAULT_LIMIT;
        const response = await fetchClient(
          `/users?page=${pageNum}&limit=${limit}&orderBy=${sortField}&order=${sortOrder}`
        );
        setUsers(response.data);
        setTotalPages(response.meta.lastPage);
        const count =
          response.meta.total ??
          response.meta.totalItems ??
          response.meta.count ??
          0;
        setTotalUsers(count);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    loadUsers(value, orderBy, order);
  };

  const handleRequestSort = (property: keyof User) => {
    const isAsc = orderBy === property && order === 'ASC';
    const newOrder = isAsc ? 'DESC' : 'ASC';
    setOrderBy(property);
    setOrder(newOrder);
    loadUsers(page, property, newOrder);
  };

  const showMessage = (
    message: string,
    severity: 'success' | 'error' = 'error'
  ) => {
    setSnackbar({ open: true, message, severity });
  };
  const handleCloseSnackbar = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  // --- ACTIONS ---

  const handleOpenCreate = () => {
    setSelectedUser(null); // Null means Create Mode
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user); // Object means Edit Mode
    setIsFormOpen(true);
  };

  const handleRequestDelete = (id: string) => setDeleteUserId(id);

  // REFACTOR: This function receives clean data from UserFormDialog
  const handleFormSave = async (payload: any) => {
    // Check for Self-Inactivation edge case
    if (
      selectedUser &&
      currentUser &&
      selectedUser.id === currentUser.id &&
      payload.status === 'inactive'
    ) {
      setPendingSelfUpdate(payload);
      setSelfInactivationOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      if (selectedUser) {
        // UPDATE
        await fetchClient(`/users/${selectedUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showMessage('User updated successfully', 'success');
      } else {
        // CREATE
        await fetchClient('/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showMessage('User created successfully', 'success');
      }
      setIsFormOpen(false);
      loadUsers(page, orderBy, order);
    } catch (error: any) {
      showMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteUserId) return;
    setIsLoading(true);
    try {
      await fetchClient(`/users/${deleteUserId}`, { method: 'DELETE' });
      if (currentUser && currentUser.id === deleteUserId) {
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
        router.push('/');
      } else {
        showMessage('User deleted successfully', 'success');
        loadUsers(page, orderBy, order);
        setDeleteUserId(null);
      }
    } catch (error: any) {
      showMessage('Failed to delete user: ' + error.message);
      setDeleteUserId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSelfInactivation = async () => {
    if (!selectedUser || !pendingSelfUpdate) return;
    setIsLoading(true);
    try {
      await fetchClient(`/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(pendingSelfUpdate),
      });
      try {
        await fetchClient('/auth/logout', { method: 'POST' });
      } catch (e) {}
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      router.push('/');
    } catch (error: any) {
      showMessage(error.message);
      setSelfInactivationOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const SortableHeader = ({ id, label }: { id: keyof User; label: string }) => (
    <TableCell>
      <TableSortLabel
        active={orderBy === id}
        direction={orderBy === id ? (order === 'ASC' ? 'asc' : 'desc') : 'asc'}
        onClick={() => handleRequestSort(id)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <TopBar user={currentUser} />

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6">User Management</Typography>
            <Chip
              icon={<PeopleIcon />}
              label={`Total: ${totalUsers}`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Stack>
          <Button variant="contained" onClick={handleOpenCreate}>
            Add User
          </Button>
        </Box>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <SortableHeader id="username" label="Username" />
              <SortableHeader id="firstName" label="Name" />
              <SortableHeader id="status" label="Status" />
              <SortableHeader id="loginsCounter" label="Logins" />
              <SortableHeader id="createdAt" label="Created At" />
              <SortableHeader id="updatedAt" label="Last Update" />
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    color={user.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.loginsCounter}</TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>{formatDate(user.updatedAt)}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenEdit(user)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleRequestDelete(user.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      </Paper>

      <UserFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleFormSave}
        userToEdit={selectedUser}
        isLoading={isLoading}
        onError={(msg) => showMessage(msg, 'error')}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteUserId} onClose={() => setDeleteUserId(null)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user?{' '}
            {deleteUserId === currentUser?.id && (
              <strong
                style={{
                  display: 'block',
                  marginTop: '10px',
                  color: '#d32f2f',
                }}
              >
                Warning: You are deleting your own account. You will be logged
                out immediately.
              </strong>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUserId(null)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Self Inactivation Dialog */}
      <Dialog
        open={selfInactivationOpen}
        onClose={() => setSelfInactivationOpen(false)}
      >
        <DialogTitle>Confirm Self-Deactivation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are setting your own account to <strong>Inactive</strong>.<br />
            <br />
            <strong>You will be logged out immediately</strong>...
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelfInactivationOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmSelfInactivation}
            color="warning"
            variant="contained"
            autoFocus
          >
            Deactivate & Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

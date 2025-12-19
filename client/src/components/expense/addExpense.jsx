import { Box, Typography } from '@mui/material';
import { useEffect, useState, useMemo } from 'react';
import useResponsive from '../../theme/hooks/useResponsive';
import { addExpenseService } from '../../services/expenseServices';
import configData from '../../config.json';
import { useParams } from 'react-router-dom';
import { getGroupDetailsService } from '../../services/groupServices';
import Loading from '../loading';
import AlertBanner from '../AlertBanner';
import ExpenseForm from './ExpenseForm';

export default function AddExpense() {
  const params = useParams();
  const mdUp = useResponsive('up', 'md');
  const profile = JSON.parse(localStorage.getItem('profile'));
  const currentUser = profile?.emailId;
  const groupId = params.groupId;

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupCurrency, setGroupCurrency] = useState('INR');

  // Fetch group details on mount
  useEffect(() => {
    const getGroupDetails = async () => {
      setLoading(true);
      const groupIdJson = { id: params.groupId };
      const response = await getGroupDetailsService(groupIdJson, setAlert, setAlertMessage);
      setGroupCurrency(response?.data?.group?.groupCurrency || 'INR');
      setGroupMembers(response?.data?.group?.groupMembers || []);
      setLoading(false);
    };
    getGroupDetails();
  }, [params.groupId]);

  // Memoize initialValues to prevent form reset on every render
  const initialValues = useMemo(() => ({
    expenseMembers: groupMembers
  }), [groupMembers]);

  // Handle form submission
  const handleSubmit = async (values) => {
    if (await addExpenseService(values, setAlert, setAlertMessage)) {
      window.location = configData.VIEW_GROUP_URL + groupId;
    }
  };

  if (loading) return <Loading />;

  return (
    <Box sx={{
      position: 'relative',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      bgcolor: 'background.paper',
      boxShadow: 24,
      p: 4,
      borderRadius: 2,
      ...(mdUp && { width: 700 })
    }}>
      <AlertBanner showAlert={alert} alertMessage={alertMessage} severity='error' />
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        Add Expense
      </Typography>

      <ExpenseForm
        mode="add"
        groupMembers={groupMembers}
        groupCurrency={groupCurrency}
        groupId={groupId}
        currentUser={currentUser}
        onSubmit={handleSubmit}
        initialValues={initialValues}
      />
    </Box>
  );
}


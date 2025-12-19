import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import useResponsive from '../../theme/hooks/useResponsive';
import { editExpenseService, getExpDetailsService } from '../../services/expenseServices';
import configData from '../../config.json';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroupDetailsService } from '../../services/groupServices';
import Loading from '../loading';
import AlertBanner from '../AlertBanner';
import ExpenseForm from './ExpenseForm';

export default function EditExpense() {
  const navigate = useNavigate();
  const params = useParams();
  const mdUp = useResponsive('up', 'md');
  const profile = JSON.parse(localStorage.getItem('profile'));
  const currentUser = profile?.emailId;

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupCurrency, setGroupCurrency] = useState('INR');
  const [groupId, setGroupId] = useState(null);
  const [initialValues, setInitialValues] = useState({});

  // Fetch expense and group details on mount
  useEffect(() => {
    const getExpenseDetails = async () => {
      setLoading(true);
      const expenseIdJson = { id: params.expenseId };
      const response_exp = await getExpDetailsService(expenseIdJson, setAlert, setAlertMessage);
      const exp = response_exp?.data?.expense;

      if (exp) {
        // Get group details for members and currency
        const groupIdJson = { id: exp.groupId };
        const response_group = await getGroupDetailsService(groupIdJson, setAlert, setAlertMessage);

        setGroupMembers(response_group?.data?.group?.groupMembers || []);
        setGroupCurrency(response_group?.data?.group?.groupCurrency || 'INR');
        setGroupId(exp.groupId);

        // Set initial form values from expense
        setInitialValues({
          expenseName: exp.expenseName,
          expenseDescription: exp.expenseDescription,
          expenseOwner: exp.expenseOwner,
          expenseMembers: exp.expenseMembers,
          expenseAmount: exp.expenseAmount,
          expenseCategory: exp.expenseCategory,
          expenseDate: exp.expenseDate,
          groupId: exp.groupId,
          expenseType: exp.expenseType,
          id: exp._id,
          splitType: exp.splitType || 'equal',
          splitDetails: exp.splitDetails || []
        });
      }
      setLoading(false);
    };
    getExpenseDetails();
  }, [params.expenseId]);

  // Handle form submission
  const handleSubmit = async (values) => {
    if (await editExpenseService(values, setAlert, setAlertMessage)) {
      navigate(-1);
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
        Edit Expense
      </Typography>

      <ExpenseForm
        mode="edit"
        initialValues={initialValues}
        groupMembers={groupMembers}
        groupCurrency={groupCurrency}
        groupId={groupId}
        currentUser={currentUser}
        onSubmit={handleSubmit}
      />
    </Box>
  );
}

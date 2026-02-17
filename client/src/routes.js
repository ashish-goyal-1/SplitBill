import { useRoutes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
// guards
import AuthGuard from './guards/AuthGuard';
// components
import LoadingScreen from './components/LoadingScreen';

//Layouts 
import LogoOnlyLayout from './layouts/LogoOnlyLayout';
import DashboardLayout from './layouts/dashboard';

//configfile import 
import configData from "./config.json"

// Lazy load components for better performance
const Login = lazy(() => import('./components/login'));
const Register = lazy(() => import('./components/register'));
const Page404 = lazy(() => import('./components/Page404'));
const Profile = lazy(() => import('./components/profile'));
const PageUserDeleted = lazy(() => import('./components/profile/PageUserDeleted'));
const Group = lazy(() => import('./components/groups'));
const CreateGroup = lazy(() => import('./components/groups/createGroup'));
const ViewGroup = lazy(() => import('./components/groups/viewGroup'));
const AddExpense = lazy(() => import('./components/expense/addExpense'));
const Dashboard = lazy(() => import('./components/dashboard'));
const ViewExpense = lazy(() => import('./components/expense/viewExpense').then(module => ({ default: module.ViewExpense })));
const EditExpense = lazy(() => import('./components/expense/editExpense'));
const EditGroup = lazy(() => import('./components/groups/editGroup').then(module => ({ default: module.EditGroup })));
const About = lazy(() => import('./components/about'));

// Auth pages
const VerifyEmail = lazy(() => import('./components/auth/VerifyEmail'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));

// Wrapper for lazy loaded components
const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

export default function Router() {
  return useRoutes([
    {
      path: configData.DASHBOARD_HOME_URL,
      element: (
        <AuthGuard>
          <DashboardLayout />
        </AuthGuard>
      ),
      children: [
        { path: configData.DASHBOARD_URL, element: <Suspense fallback={<LoadingScreen />}><Dashboard /></Suspense> },
        { path: configData.CREATE_GROUP_URL, element: <Suspense fallback={<LoadingScreen />}><CreateGroup /></Suspense> },
        { path: configData.ADD_EXPENSE_ROUTER_URL, element: <Suspense fallback={<LoadingScreen />}><AddExpense /></Suspense> },
        { path: configData.EDIT_EXPENSE_ROUTER_URL, element: <Suspense fallback={<LoadingScreen />}><EditExpense /></Suspense> },
        { path: configData.VIEW_EXPENSE_ROUTER_URL, element: <Suspense fallback={<LoadingScreen />}><ViewExpense /></Suspense> },
        { path: configData.USER_GROUPS_URL, element: <Suspense fallback={<LoadingScreen />}><Group /></Suspense> },
        { path: configData.VIEW_GROUP_ROUTER_URL, element: <Suspense fallback={<LoadingScreen />}><ViewGroup /></Suspense> },
        { path: configData.EDIT_GROUP_ROUTER_URL, element: <Suspense fallback={<LoadingScreen />}><EditGroup /></Suspense> },
        { path: configData.USER_PROFILE_URL, element: <Suspense fallback={<LoadingScreen />}><Profile /></Suspense> }
      ]
    },
    {
      path: configData.LOGIN_URL,
      element: <LogoOnlyLayout />,
      children: [
        { path: '', element: <Suspense fallback={<LoadingScreen />}><Login /></Suspense> },
        { path: configData.REGISTER_URL, element: <Suspense fallback={<LoadingScreen />}><Register /></Suspense> },
        { path: configData.USER_DELETED_URL, element: <Suspense fallback={<LoadingScreen />}><PageUserDeleted /></Suspense> },
        { path: configData.ABOUT_URL, element: <Suspense fallback={<LoadingScreen />}><About /></Suspense> }
      ]
    },
    // Auth routes (outside layouts for full-page experience)
    { path: '/verify/:token', element: <Suspense fallback={<LoadingScreen />}><VerifyEmail /></Suspense> },
    { path: '/forgot-password', element: <Suspense fallback={<LoadingScreen />}><ForgotPassword /></Suspense> },
    { path: '/reset-password/:token', element: <Suspense fallback={<LoadingScreen />}><ResetPassword /></Suspense> },
    { path: '*', element: <Suspense fallback={<LoadingScreen />}><Page404 /></Suspense> }
  ])
}

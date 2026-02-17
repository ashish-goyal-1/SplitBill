import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
// hooks
import { useAuth } from '../contexts/AuthContext';
// components
import LoadingScreen from '../components/LoadingScreen';
// routes
import configData from "../config.json";

// ----------------------------------------------------------------------

AuthGuard.propTypes = {
    children: PropTypes.node
};

export default function AuthGuard({ children }) {
    const { isAuthenticated, isLoading } = useAuth();
    const { pathname } = useLocation();
    const [requestedLocation, setRequestedLocation] = useState(null);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        if (pathname !== requestedLocation) {
            setRequestedLocation(pathname);
        }
        return <Navigate to={configData.LOGIN_URL} />;
    }

    if (requestedLocation && pathname !== requestedLocation) {
        setRequestedLocation(null);
        return <Navigate to={requestedLocation} />;
    }

    return <>{children}</>;
}

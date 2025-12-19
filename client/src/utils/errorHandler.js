/**
 * Centralized error handling utility for API calls
 * Provides consistent error messages and safe access to error properties
 */

/**
 * Handle API errors with consistent messaging
 * @param {Error} err - The error object from axios
 * @param {Function} setShowAlert - Function to show alert
 * @param {Function} setAlertMessage - Function to set alert message
 * @returns {boolean} - Always returns false to indicate failure
 */
export const handleApiError = (err, setShowAlert, setAlertMessage) => {
    setShowAlert(true);

    // Safe access to error response properties
    const status = err?.response?.status;
    const message = err?.response?.data?.message;

    if (status === 400 || status === 401) {
        setAlertMessage(message || 'Invalid request');
    } else if (status === 404) {
        setAlertMessage(message || 'Resource not found');
    } else if (status === 500) {
        setAlertMessage(message || 'Server error. Please try again later.');
    } else if (err?.code === 'NETWORK_ERROR' || !err?.response) {
        setAlertMessage('Network error. Please check your connection.');
    } else {
        setAlertMessage("Oops! Something went wrong");
    }

    return false;
};

/**
 * Handle API errors with severity support (for multi-severity alerts)
 * @param {Error} err - The error object from axios
 * @param {Function} onAlert - Callback (message, severity) => void
 * @returns {boolean} - Always returns false to indicate failure
 */
export const handleApiErrorWithSeverity = (err, onAlert) => {
    const status = err?.response?.status;
    const message = err?.response?.data?.message;

    if (status === 400 || status === 401) {
        onAlert(message || 'Invalid request', 'error');
    } else if (status === 404) {
        onAlert(message || 'Resource not found', 'warning');
    } else if (!err?.response) {
        onAlert('Network error. Please check your connection.', 'error');
    } else {
        onAlert("Oops! Something went wrong", 'error');
    }

    return false;
};

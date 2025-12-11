import axios from 'axios';

const profile = JSON.parse(localStorage.getItem('profile'));

/**
 * Get display names for a list of emails
 * @param {string[]} emails - Array of email addresses
 * @returns {Object} - Map of email -> { displayName, fullName, firstName, lastName }
 */
export const getUserNamesService = async (emails) => {
    try {
        const response = await axios.post(
            '/api/users/v1/names',
            { emails },
            { headers: { Authorization: `Bearer ${profile?.accessToken}` } }
        );
        return response.data.names || {};
    } catch (error) {
        console.error('Error fetching user names:', error);
        // Return fallback using email prefixes
        const fallback = {};
        emails.forEach(email => {
            const prefix = email.split('@')[0];
            fallback[email] = {
                displayName: prefix,
                fullName: email,
                firstName: prefix,
                lastName: ''
            };
        });
        return fallback;
    }
};

/**
 * Format email to display name synchronously (for when API call isn't needed)
 * Uses email prefix as fallback
 * @param {string} email 
 * @returns {string}
 */
export const emailToDisplayName = (email) => {
    if (!email) return 'Unknown';
    return email.split('@')[0];
};

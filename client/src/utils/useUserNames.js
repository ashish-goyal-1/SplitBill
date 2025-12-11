import { useState, useEffect } from 'react';
import { getUserNamesService } from '../services/userServices';

/**
 * Custom hook to fetch and cache user display names
 * @param {string[]} emails - Array of email addresses
 * @returns {{ names: Object, loading: boolean, getDisplayName: Function }}
 */
export const useUserNames = (emails) => {
    const [names, setNames] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNames = async () => {
            if (!emails || emails.length === 0) {
                setLoading(false);
                return;
            }

            // Filter out emails we already have
            const emailsToFetch = emails.filter(e => !names[e]);

            if (emailsToFetch.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const fetchedNames = await getUserNamesService(emailsToFetch);
            setNames(prev => ({ ...prev, ...fetchedNames }));
            setLoading(false);
        };

        fetchNames();
    }, [JSON.stringify(emails)]);

    /**
     * Get display name for an email
     * @param {string} email 
     * @returns {string} Display name (First L.) or email prefix as fallback
     */
    const getDisplayName = (email) => {
        if (!email) return 'Unknown';
        if (names[email]) {
            return names[email].displayName;
        }
        // Fallback to email prefix
        return email.split('@')[0];
    };

    /**
     * Get full name for an email (for tooltips)
     * @param {string} email 
     * @returns {string} Full name or email
     */
    const getFullName = (email) => {
        if (!email) return 'Unknown';
        if (names[email]) {
            return names[email].fullName;
        }
        return email;
    };

    return { names, loading, getDisplayName, getFullName };
};

export default useUserNames;

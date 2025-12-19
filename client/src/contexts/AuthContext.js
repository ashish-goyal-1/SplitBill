import { createContext, useContext, useState, useEffect, useMemo } from 'react';

/**
 * AuthContext - Centralized authentication state management
 * 
 * Benefits:
 * - Single source of truth for user data
 * - Safe localStorage access with error handling
 * - Components automatically react to auth changes
 * - Clean API: useAuth() hook instead of JSON.parse everywhere
 */

const AuthContext = createContext(null);

// Storage key constant
const PROFILE_KEY = 'profile';

/**
 * AuthProvider - Wrap your app with this to enable useAuth() hook
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize user from localStorage on mount
    useEffect(() => {
        const loadUser = () => {
            try {
                const stored = localStorage.getItem(PROFILE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setUser(parsed);
                }
            } catch (error) {
                // Invalid JSON in localStorage - clear it
                console.error('Failed to parse stored profile:', error);
                localStorage.removeItem(PROFILE_KEY);
            }
            setIsLoading(false);
        };

        loadUser();

        // Listen for storage changes (cross-tab sync)
        const handleStorageChange = (e) => {
            if (e.key === PROFILE_KEY) {
                if (e.newValue) {
                    try {
                        setUser(JSON.parse(e.newValue));
                    } catch {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    /**
     * Save user data (after login/register)
     */
    const saveUser = (userData) => {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(userData));
        setUser(userData);
    };

    /**
     * Update specific user fields (e.g., after profile edit)
     */
    const updateUser = (updates) => {
        const updated = { ...user, ...updates };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
        setUser(updated);
    };

    /**
     * Update access token (after refresh)
     */
    const updateTokens = (accessToken, refreshToken) => {
        const updated = { ...user, accessToken };
        if (refreshToken) {
            updated.refreshToken = refreshToken;
        }
        localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
        setUser(updated);
    };

    /**
     * Clear user data (logout)
     */
    const clearUser = () => {
        localStorage.removeItem(PROFILE_KEY);
        setUser(null);
    };

    // Memoize context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        // User data
        user,
        isLoading,
        isAuthenticated: !!user,

        // Convenience getters
        emailId: user?.emailId,
        accessToken: user?.accessToken,
        refreshToken: user?.refreshToken,
        firstName: user?.firstName,
        lastName: user?.lastName,

        // Actions
        saveUser,
        updateUser,
        updateTokens,
        clearUser,
    }), [user, isLoading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * useAuth hook - Use this in any component to access auth state
 * 
 * Usage:
 *   const { user, isAuthenticated, emailId, clearUser } = useAuth();
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

/**
 * getStoredUser - Direct localStorage access (for non-component code)
 * Use sparingly - prefer useAuth() hook in components
 */
export function getStoredUser() {
    try {
        const stored = localStorage.getItem(PROFILE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

export default AuthContext;

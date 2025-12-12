/**
 * Socket Context - Real-time WebSocket Connection Manager
 * 
 * Features:
 * - Automatic connection/reconnection
 * - Room-based subscriptions (groups/users)
 * - Event listeners for real-time updates
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

// Socket.io server URL (same as API server)
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL ||
    (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('[Socket] Connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.log('[Socket] Connection error:', error.message);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Join a group room for real-time updates
    const joinGroup = useCallback((groupId) => {
        if (socket && groupId) {
            socket.emit('join-group', groupId);
            console.log('[Socket] Joined group:', groupId);
        }
    }, [socket]);

    // Leave a group room
    const leaveGroup = useCallback((groupId) => {
        if (socket && groupId) {
            socket.emit('leave-group', groupId);
            console.log('[Socket] Left group:', groupId);
        }
    }, [socket]);

    // Join user's personal notification room
    const joinUser = useCallback((userEmail) => {
        if (socket && userEmail) {
            socket.emit('join-user', userEmail);
            console.log('[Socket] Joined user room:', userEmail);
        }
    }, [socket]);

    // Subscribe to expense events
    const onExpenseAdded = useCallback((callback) => {
        if (socket) {
            socket.on('expense-added', callback);
            return () => socket.off('expense-added', callback);
        }
    }, [socket]);

    const onExpenseUpdated = useCallback((callback) => {
        if (socket) {
            socket.on('expense-updated', callback);
            return () => socket.off('expense-updated', callback);
        }
    }, [socket]);

    const onExpenseDeleted = useCallback((callback) => {
        if (socket) {
            socket.on('expense-deleted', callback);
            return () => socket.off('expense-deleted', callback);
        }
    }, [socket]);

    // Subscribe to settlement events
    const onSettlement = useCallback((callback) => {
        if (socket) {
            socket.on('settlement-made', callback);
            return () => socket.off('settlement-made', callback);
        }
    }, [socket]);

    // Subscribe to group update events
    const onGroupUpdated = useCallback((callback) => {
        if (socket) {
            socket.on('group-updated', callback);
            return () => socket.off('group-updated', callback);
        }
    }, [socket]);

    // Subscribe to personal notifications
    const onNotification = useCallback((callback) => {
        if (socket) {
            socket.on('notification', callback);
            return () => socket.off('notification', callback);
        }
    }, [socket]);

    const value = {
        socket,
        isConnected,
        joinGroup,
        leaveGroup,
        joinUser,
        onExpenseAdded,
        onExpenseUpdated,
        onExpenseDeleted,
        onSettlement,
        onGroupUpdated,
        onNotification,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

// Custom hook to use socket context
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export default SocketContext;

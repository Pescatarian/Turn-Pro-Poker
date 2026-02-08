import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SessionModalContextType {
    isOpen: boolean;
    editingSessionId: string | null;
    openAddModal: () => void;
    openEditModal: (sessionId: string) => void;
    closeModal: () => void;
}

const SessionModalContext = createContext<SessionModalContextType | undefined>(undefined);

export const useSessionModal = () => {
    const context = useContext(SessionModalContext);
    if (!context) {
        throw new Error('useSessionModal must be used within SessionModalProvider');
    }
    return context;
};

export const SessionModalProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

    const openAddModal = useCallback(() => {
        setEditingSessionId(null);
        setIsOpen(true);
    }, []);

    const openEditModal = useCallback((sessionId: string) => {
        setEditingSessionId(sessionId);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setEditingSessionId(null);
    }, []);

    return (
        <SessionModalContext.Provider value={{ isOpen, editingSessionId, openAddModal, openEditModal, closeModal }}>
            {children}
        </SessionModalContext.Provider>
    );
};

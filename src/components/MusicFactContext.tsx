'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

interface MusicFactContextType {
    isOpen: boolean;
    showFact: () => void;
    hideFact: () => void;
}

const MusicFactContext = createContext<MusicFactContextType | undefined>(undefined);

export function MusicFactProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const showFact = useCallback(() => setIsOpen(true), []);
    const hideFact = useCallback(() => setIsOpen(false), []);

    return (
        <MusicFactContext.Provider value={{ isOpen, showFact, hideFact }}>
            {children}
        </MusicFactContext.Provider>
    );
}

export function useMusicFact() {
    const context = useContext(MusicFactContext);
    if (context === undefined) {
        throw new Error('useMusicFact must be used within a MusicFactProvider');
    }
    return context;
}

'use client';
import { useMemo } from 'react';

export function useGuestDemo(): { sessionId: string } {
    const sessionId = useMemo(() => {
        if (typeof window === 'undefined') return '';
        let id = sessionStorage.getItem('glowge_session_id');
        if (!id) {
            id = crypto.randomUUID();
            sessionStorage.setItem('glowge_session_id', id);
        }
        return id;
    }, []);

    return { sessionId };
}

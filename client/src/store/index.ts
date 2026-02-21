import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/store/authSlice';
import type { IAuthState } from '@/features/auth/types/auth.types';

const loadAuthState = (): IAuthState | undefined => {
    if (typeof window === 'undefined') return undefined;
    try {
        const serialized = localStorage.getItem('auth');
        if (serialized === null) return undefined;
        return JSON.parse(serialized) as IAuthState;
    } catch {
        return undefined;
    }
};

const preloadedAuth = loadAuthState();

export const store = configureStore({
    reducer: {
        auth: authReducer,
    },
    preloadedState: preloadedAuth ? { auth: preloadedAuth } : undefined,
});

// Persist auth state to localStorage
if (typeof window !== 'undefined') {
    store.subscribe(() => {
        try {
            const authState = store.getState().auth;
            localStorage.setItem('auth', JSON.stringify(authState));
        } catch {
            // Ignore write errors
        }
    });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

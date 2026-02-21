'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useState } from 'react';
import { authService } from '../services/auth.service';
import { setCredentials, logout as logoutAction } from '../store/authSlice';
import { useRouter } from 'next/navigation';
import type { ILoginRequest } from '../types/auth.types';

export const useAuth = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { user, isAuthenticated, tokens } = useAppSelector(
        (state) => state.auth
    );

    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [loginError, setLoginError] = useState<Error | null>(null);
    const [registerError, setRegisterError] = useState<Error | null>(null);

    const login = async (data: ILoginRequest) => {
        setIsLoggingIn(true);
        setLoginError(null);
        try {
            const res = await authService.login(data);
            dispatch(setCredentials(res));
            document.cookie = `accessToken=${res.tokens.accessToken}; path=/`;
            router.push('/dashboard');
        } catch (error) {
            setLoginError(error instanceof Error ? error : new Error('Login failed'));
        } finally {
            setIsLoggingIn(false);
        }
    };

    const register = async (data: Parameters<typeof authService.register>[0]) => {
        setIsRegistering(true);
        setRegisterError(null);
        try {
            const res = await authService.register(data);
            dispatch(setCredentials(res));
            document.cookie = `accessToken=${res.tokens.accessToken}; path=/`;
            const demoJobId = sessionStorage.getItem('glowge_demo_job_id');
            if (demoJobId) sessionStorage.removeItem('glowge_demo_job_id');
            router.push('/onboarding');
        } catch (error) {
            setRegisterError(error instanceof Error ? error : new Error('Registration failed'));
        } finally {
            setIsRegistering(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await authService.logout();
        } finally {
            dispatch(logoutAction());
            if (typeof window !== 'undefined') {
                document.cookie = 'accessToken=; path=/; max-age=0';
                localStorage.removeItem('auth');
                sessionStorage.clear();
            }
            router.push('/login');
        }
    };

    return {
        user,
        isAuthenticated,
        tokens,
        login,
        register,
        logout,
        isLoggingIn,
        isRegistering,
        loginError,
        registerError,
    };
};

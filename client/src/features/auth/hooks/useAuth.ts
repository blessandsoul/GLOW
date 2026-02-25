'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { setUser, logout as logoutAction } from '../store/authSlice';
import { useRouter } from 'next/navigation';
import type { ILoginRequest } from '../types/auth.types';

export const useAuth = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user, isAuthenticated, isInitializing } = useAppSelector(
        (state) => state.auth
    );

    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [loginError, setLoginError] = useState<Error | null>(null);
    const [registerError, setRegisterError] = useState<Error | null>(null);

    const login = async (data: ILoginRequest): Promise<void> => {
        setIsLoggingIn(true);
        setLoginError(null);
        try {
            const res = await authService.login(data);
            dispatch(setUser(res.user));
            const searchParams = new URLSearchParams(window.location.search);
            const from = searchParams.get('from');
            const safeRedirect = from && from.startsWith('/') && !from.startsWith('//') ? from : '/dashboard';
            router.push(safeRedirect);
        } catch (error) {
            setLoginError(error instanceof Error ? error : new Error('Login failed'));
        } finally {
            setIsLoggingIn(false);
        }
    };

    const register = async (data: Parameters<typeof authService.register>[0]): Promise<void> => {
        setIsRegistering(true);
        setRegisterError(null);
        try {
            const res = await authService.register(data);
            dispatch(setUser(res.user));
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
            queryClient.clear();
            dispatch(logoutAction());
            router.push('/login');
        }
    };

    return {
        user,
        isAuthenticated,
        isInitializing,
        login,
        register,
        logout,
        isLoggingIn,
        isRegistering,
        loginError,
        registerError,
    };
};

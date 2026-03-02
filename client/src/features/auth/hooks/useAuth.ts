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
    const [isVerifying, setIsVerifying] = useState(false);
    const [loginError, setLoginError] = useState<Error | null>(null);
    const [registerError, setRegisterError] = useState<Error | null>(null);
    const [verifyError, setVerifyError] = useState<Error | null>(null);

    const login = async (data: ILoginRequest): Promise<void> => {
        setIsLoggingIn(true);
        setLoginError(null);
        try {
            const res = await authService.login(data);
            dispatch(setUser(res.user));
            if (res.user.phone && !res.user.isPhoneVerified) {
                router.push('/verify-phone');
                return;
            }
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
            if (res.otpRequestId) {
                sessionStorage.setItem('otp_request_id', res.otpRequestId);
                router.push('/verify-phone');
            } else {
                router.push('/dashboard');
            }
        } catch (error) {
            setRegisterError(error instanceof Error ? error : new Error('Registration failed'));
        } finally {
            setIsRegistering(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await authService.logout();
        } catch {
            // Server unreachable — clear stale cookies client-side as fallback
            document.cookie = 'accessToken=; path=/; max-age=0';
            document.cookie = 'session=; path=/; max-age=0';
        } finally {
            queryClient.clear();
            dispatch(logoutAction());
            router.push('/login');
        }
    };

    const verifyPhone = async (requestId: string, code: string): Promise<void> => {
        setIsVerifying(true);
        setVerifyError(null);
        try {
            const res = await authService.verifyPhone({ requestId, code });
            dispatch(setUser(res.user));
            sessionStorage.removeItem('otp_request_id');
            router.push('/dashboard');
        } catch (error) {
            setVerifyError(error instanceof Error ? error : new Error('Verification failed'));
        } finally {
            setIsVerifying(false);
        }
    };

    const resendOtp = async (): Promise<string | null> => {
        try {
            const res = await authService.resendOtp();
            sessionStorage.setItem('otp_request_id', res.requestId);
            return res.requestId;
        } catch (error) {
            setVerifyError(error instanceof Error ? error : new Error('Failed to resend code'));
            return null;
        }
    };

    return {
        user,
        isAuthenticated,
        isInitializing,
        login,
        register,
        logout,
        verifyPhone,
        resendOtp,
        isLoggingIn,
        isRegistering,
        isVerifying,
        loginError,
        registerError,
        verifyError,
    };
};

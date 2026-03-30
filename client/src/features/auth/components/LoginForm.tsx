'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { GoogleButton } from './GoogleButton';

type LoginFormData = {
    email: string;
    password: string;
};

export function LoginForm(): React.ReactElement {
    const { login, isLoggingIn, loginError } = useAuth();
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const googleError = searchParams.get('error');

    const loginSchema = z.object({
        email: z.string().email(t('validation.email_invalid')),
        password: z.string().min(1, t('validation.password_required')),
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = (data: LoginFormData): void => {
        login(data);
    };

    return (
        <div
            className="overflow-hidden rounded-2xl"
            style={{
                backgroundColor: 'var(--ed-surface-lowest)',
                border: '1px solid color-mix(in oklch, var(--ed-outline-variant) 45%, transparent)',
                boxShadow: 'var(--ed-editorial-shadow)',
            }}
        >
            {/* Header */}
            <div className="px-8 pt-9 pb-6 text-center">
                <Link href="/" className="inline-block mb-5">
                    <span
                        className="text-2xl uppercase tracking-[0.22em] select-none"
                        style={{
                            fontFamily: 'var(--font-noto-georgian), sans-serif',
                            color: 'var(--ed-on-surface)',
                        }}
                    >
                        GLOW.GE
                    </span>
                </Link>
                <h1
                    className="text-xl font-bold leading-snug"
                    style={{
                        fontFamily: 'var(--font-manrope), var(--font-noto-georgian), sans-serif',
                        color: 'var(--ed-on-surface)',
                    }}
                >
                    {t('auth.welcome_back')}
                </h1>
                <p
                    className="text-sm mt-1.5"
                    style={{
                        fontFamily: 'var(--font-manrope), var(--font-noto-georgian), sans-serif',
                        color: 'color-mix(in oklch, var(--ed-on-surface) 50%, transparent)',
                    }}
                >
                    {t('auth.login_desc')}
                </p>
            </div>

            {/* Content */}
            <div className="px-8 pb-8">
                <div className="space-y-4">
                    <GoogleButton />

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div
                                className="w-full h-px"
                                style={{ backgroundColor: 'color-mix(in oklch, var(--ed-outline-variant) 55%, transparent)' }}
                            />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span
                                className="px-2.5 text-xs"
                                style={{
                                    backgroundColor: 'var(--ed-surface-lowest)',
                                    color: 'color-mix(in oklch, var(--ed-on-surface) 38%, transparent)',
                                    fontFamily: 'var(--font-inter), sans-serif',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {t('auth.or')}
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    {(loginError || googleError) && (
                        <div
                            className="rounded-xl px-4 py-3 text-sm"
                            style={{
                                backgroundColor: 'color-mix(in oklch, var(--destructive) 8%, transparent)',
                                border: '1px solid color-mix(in oklch, var(--destructive) 25%, transparent)',
                                color: 'var(--destructive)',
                                fontFamily: 'var(--font-manrope), sans-serif',
                            }}
                        >
                            {loginError
                                ? getErrorMessage(loginError)
                                : googleError === 'google_denied'
                                    ? t('auth.google_denied')
                                    : t('auth.google_failed')
                            }
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label
                            htmlFor="email"
                            className="block text-[11px] font-semibold uppercase tracking-widest"
                            style={{
                                color: 'color-mix(in oklch, var(--ed-on-surface) 55%, transparent)',
                                fontFamily: 'var(--font-inter), sans-serif',
                            }}
                        >
                            Email
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            className="h-11 rounded-xl text-sm focus-visible:ring-(--ed-primary)/20"
                            style={{
                                backgroundColor: 'var(--ed-surface-low)',
                                borderColor: errors.email
                                    ? 'var(--destructive)'
                                    : 'color-mix(in oklch, var(--ed-outline-variant) 60%, transparent)',
                                color: 'var(--ed-on-surface)',
                                fontFamily: 'var(--font-manrope), sans-serif',
                            }}
                            {...register('email')}
                        />
                        {errors.email && (
                            <p
                                className="text-xs"
                                style={{ color: 'var(--destructive)', fontFamily: 'var(--font-inter), sans-serif' }}
                            >
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="password"
                                className="block text-[11px] font-semibold uppercase tracking-widest"
                                style={{
                                    color: 'color-mix(in oklch, var(--ed-on-surface) 55%, transparent)',
                                    fontFamily: 'var(--font-inter), sans-serif',
                                }}
                            >
                                {t('ui.text_j84600')}
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-xs font-medium transition-colors duration-150"
                                style={{ color: 'var(--ed-primary)', fontFamily: 'var(--font-inter), sans-serif' }}
                            >
                                {t('auth.forgot_password')}
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="h-11 rounded-xl text-sm focus-visible:ring-(--ed-primary)/20"
                            style={{
                                backgroundColor: 'var(--ed-surface-low)',
                                borderColor: errors.password
                                    ? 'var(--destructive)'
                                    : 'color-mix(in oklch, var(--ed-outline-variant) 60%, transparent)',
                                color: 'var(--ed-on-surface)',
                                fontFamily: 'var(--font-manrope), sans-serif',
                            }}
                            {...register('password')}
                        />
                        {errors.password && (
                            <p
                                className="text-xs"
                                style={{ color: 'var(--destructive)', fontFamily: 'var(--font-inter), sans-serif' }}
                            >
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 rounded-xl font-semibold text-white transition-all duration-200 active:scale-[0.98] mt-2 shadow-sm"
                        style={{
                            backgroundColor: 'var(--ed-primary)',
                            fontFamily: 'var(--font-manrope), sans-serif',
                        }}
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? (
                            <>
                                <SpinnerGap size={18} className="mr-2 animate-spin" />
                                {t('auth.logging_in')}
                            </>
                        ) : (
                            t('auth.login')
                        )}
                    </Button>

                    <p
                        className="text-center text-sm pt-2"
                        style={{
                            color: 'color-mix(in oklch, var(--ed-on-surface) 50%, transparent)',
                            fontFamily: 'var(--font-manrope), var(--font-noto-georgian), sans-serif',
                        }}
                    >
                        {t('auth.no_account')}{' '}
                        <Link
                            href="/register"
                            className="font-semibold transition-colors duration-150"
                            style={{ color: 'var(--ed-primary)' }}
                        >
                            {t('auth.create_account')}
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

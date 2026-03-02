'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Star, SpinnerGap, Gift } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { Logo } from '@/components/layout/Logo';

type RegisterFormData = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export function RegisterForm(): React.ReactElement {
    const { register: registerUser, isRegistering, registerError } = useAuth();
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const refCode = searchParams.get('ref') ?? undefined;

    const registerSchema = z
        .object({
            firstName: z.string().min(1, t('validation.firstname_required')).max(50, t('validation.firstname_max')),
            lastName: z.string().min(1, t('validation.lastname_required')).max(50, t('validation.lastname_max')),
            email: z.string().email(t('validation.email_invalid')),
            password: z
                .string()
                .min(8, t('validation.password_min'))
                .regex(/[A-Z]/, t('validation.password_upper'))
                .regex(/[a-z]/, t('validation.password_lower'))
                .regex(/[0-9]/, t('validation.password_number')),
            confirmPassword: z.string().min(1, t('validation.confirm_password_required')),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t('validation.passwords_mismatch'),
            path: ['confirmPassword'],
        });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = (data: RegisterFormData): void => {
        registerUser({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            referralCode: refCode,
        });
    };

    return (
        <Card className="border border-zinc-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            <CardHeader className="items-center gap-1 pb-6 pt-8">
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                        <Star size={20} weight="fill" />
                    </div>
                    <Logo size="md" href="/" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{t('auth.create_account_title')}</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('auth.free_photos_desc')}</p>
            </CardHeader>
            <CardContent className="px-8 pb-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {refCode && (
                        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                            <Gift size={18} weight="fill" className="shrink-0" />
                            <span className="font-medium">{t('auth.referral_invited')}</span>
                        </div>
                    )}

                    {registerError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                            {getErrorMessage(registerError)}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-zinc-700 dark:text-zinc-300">{t('auth.firstname')}</Label>
                            <Input
                                id="firstName"
                                placeholder=""
                                autoComplete="given-name"
                                className={`bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20 ${errors.firstName ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                                {...register('firstName')}
                            />
                            {errors.firstName && (
                                <p className="text-sm text-red-500">{errors.firstName.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-zinc-700 dark:text-zinc-300">{t('auth.lastname')}</Label>
                            <Input
                                id="lastName"
                                placeholder=""
                                autoComplete="family-name"
                                className={`bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20 ${errors.lastName ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                                {...register('lastName')}
                            />
                            {errors.lastName && (
                                <p className="text-sm text-red-500">{errors.lastName.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            className={`bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20 ${errors.email ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">{t('validation.password_required')}</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className={`bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20 ${errors.password ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-zinc-700 dark:text-zinc-300">{t('validation.confirm_password_required')}</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className={`bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                            {...register('confirmPassword')}
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold transition-all active:scale-[0.98] shadow-sm rounded-xl mt-2"
                        disabled={isRegistering}
                    >
                        {isRegistering ? (
                            <>
                                <SpinnerGap size={18} className="mr-2 animate-spin" />
                                {t('auth.creating_account')}
                            </>
                        ) : (
                            t('auth.create_account_btn')
                        )}
                    </Button>

                    <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 pt-2">
                        {t('auth.already_have_account')}{' '}
                        <Link href="/login"
                            className="font-semibold text-primary transition-colors hover:text-primary/80">
                            {t('auth.login')}
                        </Link>
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}

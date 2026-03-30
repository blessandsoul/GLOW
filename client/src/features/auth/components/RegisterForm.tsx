'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ROUTES } from '@/lib/constants/routes';
import { GoogleButton } from './GoogleButton';

type RegisterFormData = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    agreeToTerms: true;
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
            phone: z.string().regex(/^\d{9}$/, t('validation.phone_georgian')),
            password: z
                .string()
                .min(8, t('validation.password_min'))
                .regex(/[A-Z]/, t('validation.password_upper'))
                .regex(/[a-z]/, t('validation.password_lower'))
                .regex(/[0-9]/, t('validation.password_number')),
            confirmPassword: z.string().min(1, t('validation.confirm_password_required')),
            agreeToTerms: z.literal(true, { error: t('validation.agree_required') }),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t('validation.passwords_mismatch'),
            path: ['confirmPassword'],
        });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            agreeToTerms: true,
        },
    });

    const onSubmit = (data: RegisterFormData): void => {
        registerUser({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: `+995${data.phone}`,
            password: data.password,
            referralCode: refCode,
        });
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
                    {t('auth.create_account_title')}
                </h1>
                <p
                    className="text-sm mt-1.5"
                    style={{
                        fontFamily: 'var(--font-manrope), var(--font-noto-georgian), sans-serif',
                        color: 'color-mix(in oklch, var(--ed-on-surface) 50%, transparent)',
                    }}
                >
                    {t('auth.free_photos_desc')}
                </p>
            </div>

            {/* Content */}
            <div className="px-8 pb-8">
                <div className="space-y-4">
                    {refCode && (
                        <div
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium"
                            style={{
                                backgroundColor: 'color-mix(in oklch, var(--ed-primary) 8%, transparent)',
                                border: '1px solid color-mix(in oklch, var(--ed-primary) 20%, transparent)',
                                color: 'var(--ed-primary)',
                                fontFamily: 'var(--font-manrope), sans-serif',
                            }}
                        >
                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 300" }}>card_giftcard</span>
                            {t('auth.referral_invited')}
                        </div>
                    )}

                    <GoogleButton referralCode={refCode} />

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
                    {registerError && (
                        <div
                            className="rounded-xl px-4 py-3 text-sm"
                            style={{
                                backgroundColor: 'color-mix(in oklch, var(--destructive) 8%, transparent)',
                                border: '1px solid color-mix(in oklch, var(--destructive) 25%, transparent)',
                                color: 'var(--destructive)',
                                fontFamily: 'var(--font-manrope), sans-serif',
                            }}
                        >
                            {getErrorMessage(registerError)}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="firstName"
                                className="block text-[11px] font-semibold uppercase tracking-widest"
                                style={{
                                    color: 'color-mix(in oklch, var(--ed-on-surface) 55%, transparent)',
                                    fontFamily: 'var(--font-inter), sans-serif',
                                }}
                            >
                                {t('auth.firstname')}
                            </label>
                            <Input
                                id="firstName"
                                autoComplete="given-name"
                                className="h-11 rounded-xl text-sm focus-visible:ring-(--ed-primary)/20"
                                style={{
                                    backgroundColor: 'var(--ed-surface-low)',
                                    borderColor: errors.firstName
                                        ? 'var(--destructive)'
                                        : 'color-mix(in oklch, var(--ed-outline-variant) 60%, transparent)',
                                    color: 'var(--ed-on-surface)',
                                    fontFamily: 'var(--font-manrope), sans-serif',
                                }}
                                {...register('firstName')}
                            />
                            {errors.firstName && (
                                <p className="text-xs" style={{ color: 'var(--destructive)', fontFamily: 'var(--font-inter), sans-serif' }}>
                                    {errors.firstName.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label
                                htmlFor="lastName"
                                className="block text-[11px] font-semibold uppercase tracking-widest"
                                style={{
                                    color: 'color-mix(in oklch, var(--ed-on-surface) 55%, transparent)',
                                    fontFamily: 'var(--font-inter), sans-serif',
                                }}
                            >
                                {t('auth.lastname')}
                            </label>
                            <Input
                                id="lastName"
                                autoComplete="family-name"
                                className="h-11 rounded-xl text-sm focus-visible:ring-(--ed-primary)/20"
                                style={{
                                    backgroundColor: 'var(--ed-surface-low)',
                                    borderColor: errors.lastName
                                        ? 'var(--destructive)'
                                        : 'color-mix(in oklch, var(--ed-outline-variant) 60%, transparent)',
                                    color: 'var(--ed-on-surface)',
                                    fontFamily: 'var(--font-manrope), sans-serif',
                                }}
                                {...register('lastName')}
                            />
                            {errors.lastName && (
                                <p className="text-xs" style={{ color: 'var(--destructive)', fontFamily: 'var(--font-inter), sans-serif' }}>
                                    {errors.lastName.message}
                                </p>
                            )}
                        </div>
                    </div>

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
                            <p className="text-xs" style={{ color: 'var(--destructive)', fontFamily: 'var(--font-inter), sans-serif' }}>
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="phone"
                            className="block text-[11px] font-semibold uppercase tracking-widest"
                            style={{
                                color: 'color-mix(in oklch, var(--ed-on-surface) 55%, transparent)',
                                fontFamily: 'var(--font-inter), sans-serif',
                            }}
                        >
                            {t('auth.phone')}
                        </label>
                        <div
                            className="flex overflow-hidden rounded-xl"
                            style={{
                                border: `1px solid ${errors.phone
                                    ? 'var(--destructive)'
                                    : 'color-mix(in oklch, var(--ed-outline-variant) 60%, transparent)'}`,
                            }}
                        >
                            <span
                                className="flex items-center px-3 text-sm font-medium select-none shrink-0"
                                style={{
                                    backgroundColor: 'color-mix(in oklch, var(--ed-outline-variant) 25%, transparent)',
                                    borderRight: '1px solid color-mix(in oklch, var(--ed-outline-variant) 60%, transparent)',
                                    color: 'color-mix(in oklch, var(--ed-on-surface) 55%, transparent)',
                                    fontFamily: 'var(--font-inter), sans-serif',
                                }}
                            >
                                +995
                            </span>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="5XX XXX XXX"
                                autoComplete="tel-national"
                                maxLength={9}
                                className="h-11 border-0 rounded-none text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                style={{
                                    backgroundColor: 'var(--ed-surface-low)',
                                    color: 'var(--ed-on-surface)',
                                    fontFamily: 'var(--font-manrope), sans-serif',
                                }}
                                {...register('phone')}
                            />
                        </div>
                        {errors.phone && (
                            <p className="text-xs" style={{ color: 'var(--destructive)', fontFamily: 'var(--font-inter), sans-serif' }}>
                                {errors.phone.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="password"
                            className="block text-[11px] font-semibold uppercase tracking-widest"
                            style={{
                                color: 'color-mix(in oklch, var(--ed-on-surface) 55%, transparent)',
                                fontFamily: 'var(--font-inter), sans-serif',
                            }}
                        >
                            {t('validation.password_required')}
                        </label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
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
                            <p className="text-xs" style={{ color: 'var(--destructive)', fontFamily: 'var(--font-inter), sans-serif' }}>
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="confirmPassword"
                            className="block text-[11px] font-semibold uppercase tracking-widest"
                            style={{
                                color: 'color-mix(in oklch, var(--ed-on-surface) 55%, transparent)',
                                fontFamily: 'var(--font-inter), sans-serif',
                            }}
                        >
                            {t('validation.confirm_password_required')}
                        </label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className="h-11 rounded-xl text-sm focus-visible:ring-(--ed-primary)/20"
                            style={{
                                backgroundColor: 'var(--ed-surface-low)',
                                borderColor: errors.confirmPassword
                                    ? 'var(--destructive)'
                                    : 'color-mix(in oklch, var(--ed-outline-variant) 60%, transparent)',
                                color: 'var(--ed-on-surface)',
                                fontFamily: 'var(--font-manrope), sans-serif',
                            }}
                            {...register('confirmPassword')}
                        />
                        {errors.confirmPassword && (
                            <p className="text-xs" style={{ color: 'var(--destructive)', fontFamily: 'var(--font-inter), sans-serif' }}>
                                {errors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-start gap-2.5">
                            <Checkbox
                                id="agreeToTerms"
                                checked={watch('agreeToTerms')}
                                onCheckedChange={(checked) => setValue('agreeToTerms', checked as true, { shouldValidate: true })}
                                className="mt-0.5"
                            />
                            <label
                                htmlFor="agreeToTerms"
                                className="text-sm leading-snug cursor-pointer"
                                style={{
                                    color: 'color-mix(in oklch, var(--ed-on-surface) 60%, transparent)',
                                    fontFamily: 'var(--font-manrope), var(--font-noto-georgian), sans-serif',
                                }}
                            >
                                {t('auth.consent_text')}{' '}
                                <Link
                                    href={ROUTES.TERMS}
                                    className="font-medium transition-colors duration-150"
                                    style={{ color: 'var(--ed-primary)' }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t('auth.consent_terms')}
                                </Link>{' '}
                                {t('auth.consent_and')}{' '}
                                <Link
                                    href={ROUTES.PRIVACY}
                                    className="font-medium transition-colors duration-150"
                                    style={{ color: 'var(--ed-primary)' }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t('auth.consent_privacy')}
                                </Link>
                                {t('auth.consent_suffix')}
                            </label>
                        </div>
                        {errors.agreeToTerms && (
                            <p className="text-xs" style={{ color: 'var(--destructive)', fontFamily: 'var(--font-inter), sans-serif' }}>
                                {errors.agreeToTerms.message}
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

                    <p
                        className="text-center text-sm pt-2"
                        style={{
                            color: 'color-mix(in oklch, var(--ed-on-surface) 50%, transparent)',
                            fontFamily: 'var(--font-manrope), var(--font-noto-georgian), sans-serif',
                        }}
                    >
                        {t('auth.already_have_account')}{' '}
                        <Link
                            href="/login"
                            className="font-semibold transition-colors duration-150"
                            style={{ color: 'var(--ed-primary)' }}
                        >
                            {t('auth.login')}
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

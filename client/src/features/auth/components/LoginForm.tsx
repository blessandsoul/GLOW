'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Star, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '@/lib/utils/error';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { Logo } from '@/components/layout/Logo';

type LoginFormData = {
    email: string;
    password: string;
};

export function LoginForm(): React.ReactElement {
    const { login, isLoggingIn, loginError } = useAuth();
    const { t } = useLanguage();

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
        <Card className="border border-zinc-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            <CardHeader className="items-center gap-1 pb-6 pt-8">
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                        <Star size={20} weight="fill" />
                    </div>
                    <Logo size="md" href="/" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{t('auth.welcome_back')}</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('auth.login_desc')}</p>
            </CardHeader>
            <CardContent className="px-8 pb-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {loginError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                            {getErrorMessage(loginError)}
                        </div>
                    )}

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
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">{t('ui.text_j84600')}</Label>
                            <Link href="/reset-password"
                                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                                {t('auth.forgot_password')}
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className={`bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20 ${errors.password ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold transition-all active:scale-[0.98] shadow-sm rounded-xl mt-2"
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

                    <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 pt-2">
                        {t('auth.no_account')}{' '}
                        <Link href="/register"
                            className="font-semibold text-primary transition-colors hover:text-primary/80">
                            {t('auth.create_account')}
                        </Link>
                    </p>
                </form>

                <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800/50 pt-6">
                    <Button
                        variant="outline"
                        className="w-full h-11 gap-2 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] rounded-xl font-medium"
                        disabled={isLoggingIn}
                        onClick={() => login({ email: 'admin@glow.ge.demo', password: 'demo1234' })}
                    >
                        {isLoggingIn ? (
                            <SpinnerGap size={18} className="animate-spin" />
                        ) : (
                            <Star size={18} />
                        )}
                        {t('auth.demo_login')}
                    </Button>
                    <p className="mt-2 text-center text-[11px] text-zinc-400">
                        {t('auth.demo_desc')}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

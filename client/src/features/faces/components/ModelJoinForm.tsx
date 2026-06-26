'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SpinnerGap, UserFocus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { getErrorMessage } from '@/lib/utils/error';
import { ROUTES } from '@/lib/constants/routes';
import { useModelOnboarding } from '../hooks/useMyModelProfile';

function isAdult(dateStr: string): boolean {
    const dob = new Date(dateStr);
    if (Number.isNaN(dob.getTime())) return false;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age >= 18;
}

export function ModelJoinForm(): React.ReactElement {
    const { t } = useLanguage();
    const router = useRouter();
    const { onboard, isPending } = useModelOnboarding();

    const [displayName, setDisplayName] = useState('');
    const [city, setCity] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [instagram, setInstagram] = useState('');
    const [bio, setBio] = useState('');
    const [consent, setConsent] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(): Promise<void> {
        setError('');
        if (displayName.trim().length < 2) return setError(t('faces.err_name'));
        if (city.trim().length < 2) return setError(t('faces.err_city'));
        if (!birthDate || !isAdult(birthDate)) return setError(t('faces.err_age'));
        if (!consent) return setError(t('faces.err_consent'));

        try {
            await onboard({
                role: 'MODEL',
                displayName: displayName.trim(),
                city: city.trim().toLowerCase(),
                birthDate,
                ...(instagram ? { instagram: instagram.trim() } : {}),
                ...(bio ? { bio: bio.trim() } : {}),
                consent: true,
            });
            router.push(ROUTES.DASHBOARD_MODEL);
        } catch (e) {
            setError(getErrorMessage(e));
        }
    }

    return (
        <Card className="mx-auto w-full max-w-md rounded-2xl border-border/50 shadow-sm">
            <CardHeader className="items-center gap-1 pb-4 pt-8 text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <UserFocus size={24} weight="fill" />
                </div>
                <h1 className="text-xl font-bold text-foreground">{t('faces.join_title')}</h1>
                <p className="text-sm text-muted-foreground">{t('faces.join_subtitle')}</p>
            </CardHeader>

            <CardContent className="space-y-5 px-6 pb-8 sm:px-8">
                {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="m-name">{t('faces.field_name')}</Label>
                    <Input id="m-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="m-city">{t('faces.field_city')}</Label>
                        <Input id="m-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="m-dob">{t('faces.field_birthdate')}</Label>
                        <Input id="m-dob" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="m-ig">{t('faces.field_instagram')}</Label>
                    <Input id="m-ig" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@username" maxLength={100} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="m-bio">{t('faces.field_bio')}</Label>
                    <textarea
                        id="m-bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        maxLength={1000}
                        rows={3}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    />
                </div>

                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
                    <span>
                        {t('faces.consent')}{' '}
                        <Link href={ROUTES.PRIVACY} className="text-primary underline-offset-2 hover:underline">
                            {t('faces.consent_link')}
                        </Link>
                    </span>
                </label>

                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="h-11 w-full rounded-xl font-semibold transition-all active:scale-[0.98]"
                >
                    {isPending ? <SpinnerGap size={18} className="mr-2 animate-spin" /> : null}
                    {t('faces.join_submit')}
                </Button>
            </CardContent>
        </Card>
    );
}

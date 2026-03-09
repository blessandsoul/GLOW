'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChatText, PaperPlaneTilt, CircleNotch, Users, UserList } from '@phosphor-icons/react';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useVerifiedPhoneCount, useSendBulkSms } from '../hooks/useAdmin';
import type { BulkSmsMode } from '../types/admin.types';

const MAX_MESSAGE_LENGTH = 800;

export function AdminBulkSms(): React.ReactElement {
    const { t } = useLanguage();
    const [mode, setMode] = useState<BulkSmsMode>('all');
    const [message, setMessage] = useState('');
    const [customPhones, setCustomPhones] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    const { count: verifiedCount, isLoading: countLoading } = useVerifiedPhoneCount();

    const handleSuccess = useCallback((): void => {
        setMessage('');
        setCustomPhones('');
    }, []);

    const { send, isPending } = useSendBulkSms(handleSuccess);

    const parsedPhones = useMemo((): string[] => {
        if (mode !== 'custom') return [];
        return customPhones
            .split(/[,\n]/)
            .map((s) => s.trim())
            .filter(Boolean);
    }, [customPhones, mode]);

    const recipientCount = mode === 'all' ? (verifiedCount ?? 0) : parsedPhones.length;
    const canSend = message.trim().length > 0 && recipientCount > 0 && !isPending;

    function handleSendClick(): void {
        setShowConfirm(true);
    }

    function handleConfirm(): void {
        setShowConfirm(false);
        if (mode === 'all') {
            send({ message: message.trim(), mode: 'all' });
        } else {
            send({ message: message.trim(), mode: 'custom', phoneNumbers: parsedPhones });
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <ChatText size={18} weight="fill" className="text-primary" />
                <h2 className="text-lg font-semibold tracking-tight">{t('admin.sms_title')}</h2>
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-6 space-y-5">
                {/* Mode toggle */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setMode('all')}
                        className={cn(
                            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
                            mode === 'all'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'border border-border/50 bg-background text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <Users size={16} />
                        {t('admin.sms_mode_all')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('custom')}
                        className={cn(
                            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
                            mode === 'custom'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'border border-border/50 bg-background text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <UserList size={16} />
                        {t('admin.sms_mode_custom')}
                    </button>
                </div>

                {/* Recipients info */}
                {mode === 'all' && (
                    <div className="flex items-center gap-2">
                        {countLoading ? (
                            <Skeleton className="h-5 w-40" />
                        ) : (
                            <Badge variant="secondary" className="tabular-nums">
                                {verifiedCount ?? 0} {t('admin.sms_verified_count')}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Custom phone numbers */}
                {mode === 'custom' && (
                    <div className="space-y-2">
                        <textarea
                            value={customPhones}
                            onChange={(e) => setCustomPhones(e.target.value)}
                            placeholder={t('admin.sms_phones_placeholder')}
                            rows={3}
                            className="w-full resize-none rounded-lg border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{t('admin.sms_phones_hint')}</span>
                            {parsedPhones.length > 0 && (
                                <Badge variant="outline" className="tabular-nums">
                                    {parsedPhones.length} {t('admin.sms_send_btn_recipients')}
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Message textarea */}
                <div className="space-y-2">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                        placeholder={t('admin.sms_message_placeholder')}
                        rows={4}
                        className="w-full resize-none rounded-lg border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    />
                    <div className="flex justify-end text-xs text-muted-foreground tabular-nums">
                        {message.length}/{MAX_MESSAGE_LENGTH} {t('admin.sms_char_count')}
                    </div>
                </div>

                {/* Send button */}
                <Button
                    onClick={handleSendClick}
                    disabled={!canSend}
                    className="transition-all duration-200 active:scale-[0.98]"
                >
                    {isPending ? (
                        <>
                            <CircleNotch size={16} className="animate-spin" />
                            {t('admin.sms_sending')}
                        </>
                    ) : (
                        <>
                            <PaperPlaneTilt size={16} weight="fill" />
                            {t('admin.sms_send_btn')} {recipientCount} {t('admin.sms_send_btn_recipients')}
                        </>
                    )}
                </Button>
            </div>

            {/* Confirmation dialog */}
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('admin.sms_confirm_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('admin.sms_confirm_desc')} {recipientCount} {t('admin.sms_send_btn_recipients')}.
                            <span className="mt-2 block rounded-lg bg-muted p-3 text-sm text-foreground">
                                {message.length > 100 ? `${message.slice(0, 100)}...` : message}
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('admin.sms_confirm_cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm}>
                            {t('admin.sms_confirm_send')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

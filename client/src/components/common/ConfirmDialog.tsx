'use client';

import { useCallback } from 'react';
import { Trash, WarningCircle, SpinnerGap } from '@phosphor-icons/react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = false,
    isLoading = false,
    icon,
}: ConfirmDialogProps): React.ReactElement {
    const handleConfirm = useCallback((): void => {
        if (!isLoading) {
            onConfirm();
        }
    }, [isLoading, onConfirm]);

    const defaultIcon = isDestructive
        ? <Trash weight="fill" className="size-6 text-destructive" />
        : <WarningCircle weight="fill" className="size-6 text-primary" />;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogMedia className={isDestructive ? 'bg-destructive/10' : 'bg-primary/10'}>
                        {icon ?? defaultIcon}
                    </AlertDialogMedia>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isLoading}
                        variant={isDestructive ? 'destructive' : 'default'}
                    >
                        {isLoading && (
                            <SpinnerGap className="size-4 animate-spin" />
                        )}
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

'use client';

import React, { useRef } from 'react';
import { Upload, SpinnerGap } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BadgeUploadCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
    isApproved: boolean;
    existingUrls: string | string[] | null;
    onUpload: (files: File | File[]) => void;
    isPending: boolean;
    multiple?: boolean;
    maxFiles?: number;
}

export function BadgeUploadCard({
    icon: Icon,
    title,
    description,
    isApproved,
    existingUrls,
    onUpload,
    isPending,
    multiple = false,
    maxFiles = 10,
}: BadgeUploadCardProps): React.ReactElement {
    const inputRef = useRef<HTMLInputElement>(null);

    const hasContent = multiple
        ? Array.isArray(existingUrls) && existingUrls.length > 0
        : !!existingUrls;

    const urls: string[] = multiple
        ? (Array.isArray(existingUrls) ? existingUrls : [])
        : (typeof existingUrls === 'string' ? [existingUrls] : []);

    const isPendingReview = hasContent && !isApproved;

    const handleSingleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) (onUpload as (f: File) => void)(file);
    };

    const handleMultiChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const files = e.target.files;
        if (files && files.length > 0) (onUpload as (f: File[]) => void)(Array.from(files));
    };

    return (
        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{title}</p>
                        {isApproved ? (
                            <Badge className="bg-success/15 text-success border-success/20 text-xs">
                                Approved
                            </Badge>
                        ) : isPendingReview ? (
                            <Badge variant="secondary" className="text-xs">
                                Pending review
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                Not submitted
                            </Badge>
                        )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                </div>
            </div>

            {/* Thumbnails */}
            {urls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {urls.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            key={i}
                            src={url}
                            alt={`${title} photo ${i + 1}`}
                            className="h-14 w-14 rounded-lg object-cover border border-border/50"
                        />
                    ))}
                </div>
            )}

            {/* Upload area */}
            {!isApproved && (
                <div>
                    <button
                        type="button"
                        onClick={() => !isPending && inputRef.current?.click()}
                        disabled={isPending}
                        className={cn(
                            'flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/20 py-2.5 text-xs font-medium text-muted-foreground transition-colors duration-200',
                            isPending
                                ? 'opacity-60 cursor-not-allowed'
                                : 'hover:border-primary/40 hover:bg-primary/5 hover:text-foreground cursor-pointer',
                        )}
                    >
                        {isPending ? (
                            <SpinnerGap size={14} className="animate-spin" />
                        ) : (
                            <Upload size={14} />
                        )}
                        {isPending
                            ? 'Uploading...'
                            : hasContent
                            ? (multiple ? 'Replace photos' : 'Replace file')
                            : (multiple ? 'Upload photos' : 'Upload file')}
                    </button>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple={multiple}
                        className="hidden"
                        onChange={multiple ? handleMultiChange : handleSingleChange}
                    />
                    {multiple && (
                        <p className="mt-1 text-xs text-muted-foreground text-center">
                            Max {maxFiles} photos
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

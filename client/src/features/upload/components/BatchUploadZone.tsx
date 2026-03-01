'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { CloudArrowUp, X, CheckCircle, SpinnerGap, WarningCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { jobService } from '@/features/jobs/services/job.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { BatchCreateResult } from '@/features/jobs/types/job.types';
import { useLanguage } from "@/i18n/hooks/useLanguage";

type FileStatus = 'queued' | 'uploading' | 'done' | 'failed';

interface BatchFileItem {
  file: File;
  localId: string;
  status: FileStatus;
  jobId?: string;
}

interface BatchUploadZoneProps {
  onBatchComplete?: (result: BatchCreateResult) => void;
  isProUser: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILES = 10;

export function BatchUploadZone({ onBatchComplete, isProUser }: BatchUploadZoneProps): React.ReactElement {
    const { t } = useLanguage();
  const [files, setFiles] = useState<BatchFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;
      const slots = MAX_FILES - files.length;
      if (slots <= 0) return;
      const valid = Array.from(newFiles)
        .filter((f) => ALLOWED_TYPES.includes(f.type))
        .slice(0, slots);
      if (valid.length < Array.from(newFiles).length) {
        toast.error(t('ui.text_67ffvw'));
      }
      const items: BatchFileItem[] = valid.map((f) => ({
        file: f,
        localId: crypto.randomUUID(),
        status: 'queued',
      }));
      setFiles((prev) => [...prev, ...items]);
    },
    [files.length],
  );

  const removeFile = useCallback((localId: string) => {
    setFiles((prev) => prev.filter((f) => f.localId !== localId));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleStartBatch = useCallback(async () => {
    if (files.length === 0 || isUploading) return;
    setIsUploading(true);
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading' as FileStatus })));

    try {
      const result = await jobService.uploadBatch(files.map((f) => f.file));
      setFiles((prev) =>
        prev.map((f, i) => ({
          ...f,
          status: 'done' as FileStatus,
          jobId: result.jobs[i]?.id,
        })),
      );
      toast.success(`${result.jobs.length} фото отправлено на обработку`);
      onBatchComplete?.(result);
    } catch (err) {
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'failed' as FileStatus })));
      toast.error(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  }, [files, isUploading, onBatchComplete]);

  const handleClear = useCallback(() => {
    setFiles([]);
  }, []);

  if (!isProUser) {
    return (
      <div className="relative rounded-xl border-2 border-dashed border-border p-8 text-center">
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/85 backdrop-blur-sm">
          <div className="text-center">
            <p className="mb-1 font-semibold text-foreground">{t('ui.text_wdnnzm')}</p>
            <p className="mb-3 text-sm text-muted-foreground">{t('ui.text_kdymaj')}</p>
            <Button size="sm" variant="default" asChild>
              <a href="/dashboard/credits">{t('ui.text_wr7op1')}</a>
            </Button>
          </div>
        </div>
        <CloudArrowUp size={40} className="mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground opacity-30">{t('ui.text_5jwihv')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label={t('ui.text_5lafwc')}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        className={[
          'cursor-pointer rounded-xl border-2 border-dashed p-6 text-center',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border/50 hover:border-primary/40 hover:bg-muted/30',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
          disabled={isUploading}
        />
        <CloudArrowUp
          size={32}
          className={isDragOver ? 'mx-auto mb-2 text-primary' : 'mx-auto mb-2 text-muted-foreground'}
        />
        <p className="text-sm text-muted-foreground">
          {isDragOver ? t('ui.text_thy2du') : t('ui.text_ag7op5')}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          {files.length}/{MAX_FILES} {t('ui.text_3yjyzh')}</p>
      </div>

      {/* File queue */}
      {files.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-3 shadow-sm">
          <div className="space-y-2">
            {files.map((item) => (
              <div key={item.localId} className="flex items-center gap-2 text-sm">
                {item.status === 'queued' && (
                  <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border" />
                )}
                {item.status === 'uploading' && (
                  <SpinnerGap size={14} className="shrink-0 animate-spin text-primary" />
                )}
                {item.status === 'done' && (
                  <CheckCircle size={14} className="shrink-0 text-green-600" weight="fill" />
                )}
                {item.status === 'failed' && (
                  <WarningCircle size={14} className="shrink-0 text-destructive" weight="fill" />
                )}
                <span className="flex-1 truncate text-xs text-muted-foreground">{item.file.name}</span>
                {item.status === 'queued' && !isUploading && (
                  <button
                    type="button"
                    aria-label={`Убрать ${item.file.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(item.localId);
                    }}
                    className="text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && !isUploading && (
        <div className="flex gap-2">
          <Button onClick={handleStartBatch} className="flex-1" size="sm">
            {t('ui.text_qw5lzs')}{files.length} {files.length === 1 ? t('ui.text_k0dva') : t('ui.text_k0dva')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear} aria-label={t('ui.text_na2bwx')}>
            {t('ui.text_siey7m')}</Button>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center justify-center gap-2 py-1">
          <SpinnerGap size={14} className="animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">{t('ui.text_npm4aq')}</span>
        </div>
      )}
    </div>
  );
}

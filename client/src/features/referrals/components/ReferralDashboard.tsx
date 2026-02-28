'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Copy, Users, CheckCircle, Clock, Gift, TrendUp, ArrowClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useReferralStats } from '../hooks/useReferrals';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error';

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('ka-GE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

function ReferralDashboardSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <Skeleton className="mb-3 h-4 w-40" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="mt-2.5 h-3 w-56" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <Skeleton className="mb-2 h-7 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 px-5 py-4">
          <Skeleton className="h-4 w-32" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReferralDashboard(): React.ReactElement | null {
  const { data: stats, isLoading, error, refetch } = useReferralStats();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (): Promise<void> => {
    if (!stats?.referralLink) return;
    try {
      await navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      toast.success('ბმული დაკოპირდა');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('კოპირება ვერ მოხერხდა');
    }
  }, [stats?.referralLink]);

  const handleRetry = useCallback((): void => {
    void refetch();
  }, [refetch]);

  if (isLoading) {
    return <ReferralDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-foreground">მონაცემების ჩატვირთვა ვერ მოხერხდა</p>
        <p className="mt-1 text-xs text-muted-foreground">{getErrorMessage(error)}</p>
        <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={handleRetry}>
          <ArrowClockwise size={14} />
          <span>სცადეთ თავიდან</span>
        </Button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const hasReferralCode = stats.referralCode !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            რეფერალური პროგრამა
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            მოიწვიეთ მეგობრები — მიიღეთ ბონუს გენერაციები
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Gift size={20} className="text-primary" />
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <p className="mb-3 text-sm font-medium text-foreground">თქვენი რეფერალური ბმული</p>
        {hasReferralCode ? (
          <>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <code className="flex-1 truncate font-mono text-sm text-foreground">
                {stats.referralLink}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className={cn(
                  'h-8 shrink-0 gap-1.5 rounded-lg transition-all duration-200',
                  copied ? 'bg-success/10 text-success hover:bg-success/15' : 'hover:bg-muted',
                )}
                aria-label="ბმულის კოპირება"
              >
                <Copy size={14} weight={copied ? 'fill' : 'regular'} />
                <span className="text-xs font-medium">{copied ? 'დაკოპირდა' : 'კოპირება'}</span>
              </Button>
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground">
              {'კოდი: '}
              <span className="font-mono font-semibold tracking-wider text-foreground">
                {stats.referralCode}
              </span>
              {' — გაუზიარეთ მეგობრებს'}
            </p>
          </>
        ) : (
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              რეფერალური კოდი ჯერ არ არის გენერირებული
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="relative rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Users size={18} className="text-primary" />
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{stats.totalReferrals}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">მოწვეული</p>
        </div>
        <div className="relative rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-success/10">
            <Gift size={18} className="text-success" />
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">+{stats.bonusDailyGenerations}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">ბონუს გენერაცია</p>
        </div>
        <div className="relative rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10">
            <TrendUp size={18} className="text-warning" />
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{stats.currentDailyLimit}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">დღიური ლიმიტი</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">როგორ მუშაობს</p>
        <div className="space-y-3">
          {[
            { step: '1', text: 'გაუზიარეთ თქვენი ბმული მეგობარს' },
            { step: '2', text: 'ის რეგისტრირდება Glow.GE-ზე' },
            { step: '3', text: 'თქვენ იღებთ +3 დღიურ გენერაციას, ის +1-ს' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {step}
              </div>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 px-5 py-4">
          <p className="text-sm font-semibold text-foreground">ბოლო მოწვეულები</p>
        </div>
        {stats.recentReferrals.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Users size={28} className="mx-auto text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              ჯერ არავინ მოგიწვევიათ. გაუზიარეთ ბმული მეგობრებს!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {stats.recentReferrals.map((referral, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-5 py-3.5 transition-colors duration-150 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {referral.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{referral.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(referral.joinedAt)}</p>
                  </div>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    referral.rewarded ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {referral.rewarded ? (
                    <>
                      <CheckCircle size={11} weight="fill" />
                      <span>+3 გენერაცია</span>
                    </>
                  ) : (
                    <>
                      <Clock size={11} />
                      <span>მოლოდინი</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

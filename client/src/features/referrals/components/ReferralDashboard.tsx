'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Copy, Users, Coins, CheckCircle, Clock, Gift, TrendUp } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MOCK_DATA = {
  referralCode: 'GLOW-X9K2',
  referralLink: 'https://glow.ge/r/GLOW-X9K2',
  totalReferrals: 12,
  totalCreditsEarned: 36,
  recentReferrals: [
    { name: 'ნინო გ.', joinedAt: '2026-02-18T10:00:00Z', rewarded: true },
    { name: 'თამარ კ.', joinedAt: '2026-02-14T14:30:00Z', rewarded: true },
    { name: 'მარიამ ბ.', joinedAt: '2026-02-10T09:15:00Z', rewarded: true },
    { name: 'ეკა ჩ.', joinedAt: '2026-02-03T16:45:00Z', rewarded: false },
    { name: 'ლიკა დ.', joinedAt: '2026-01-28T11:20:00Z', rewarded: false },
  ],
};

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('ka-GE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function ReferralDashboard(): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(MOCK_DATA.referralLink);
      setCopied(true);
      toast.success('ბმული დაკოპირდა');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('კოპირება ვერ მოხერხდა');
    }
  }, []);

  const rewardedCount = MOCK_DATA.recentReferrals.filter((r) => r.rewarded).length;
  const conversionRate = Math.round((rewardedCount / MOCK_DATA.recentReferrals.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            რეფერალური პროგრამა
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            მოიწვიეთ მეგობრები — მიიღეთ კრედიტები თითოეულისთვის
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Gift size={20} className="text-primary" />
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <p className="mb-3 text-sm font-medium text-foreground">თქვენი რეფერალური ბმული</p>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
          <code className="flex-1 truncate font-mono text-sm text-foreground">
            {MOCK_DATA.referralLink}
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
            {MOCK_DATA.referralCode}
          </span>
          {' — გაუზიარეთ მეგობრებს'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="relative rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Users size={18} className="text-primary" />
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{MOCK_DATA.totalReferrals}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">მოწვეული</p>
        </div>
        <div className="relative rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-success/10">
            <Coins size={18} className="text-success" />
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{MOCK_DATA.totalCreditsEarned}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">კრედიტი გამომუშავდა</p>
        </div>
        <div className="relative rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10">
            <TrendUp size={18} className="text-warning" />
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{conversionRate}%</p>
          <p className="mt-0.5 text-xs text-muted-foreground">კონვერსია</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">როგორ მუშაობს</p>
        <div className="space-y-3">
          {[
            { step: '1', text: 'გაუზიარეთ თქვენი ბმული მეგობარს' },
            { step: '2', text: 'ის რეგისტრირდება Glow.GE-ზე' },
            { step: '3', text: 'თქვენ იღებთ +3 კრედიტს, ის +1 კრედიტს' },
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
        <div className="divide-y divide-border/50">
          {MOCK_DATA.recentReferrals.map((referral, index) => (
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
                    <span>+3 კრედიტი</span>
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
      </div>
    </div>
  );
}

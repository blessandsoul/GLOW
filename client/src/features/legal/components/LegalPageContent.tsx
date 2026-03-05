'use client';

import type { ReactNode } from 'react';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { TermsContentEn, TermsContentKa, TermsContentRu } from '../data/terms';
import { PrivacyContentEn, PrivacyContentKa, PrivacyContentRu } from '../data/privacy';
import { RefundContentEn, RefundContentKa, RefundContentRu } from '../data/refund';

type LegalPageType = 'terms' | 'privacy' | 'refund';

interface LegalPageContentProps {
  pageType: LegalPageType;
}

const CONTENT_MAP: Record<LegalPageType, Record<string, () => ReactNode>> = {
  terms: { en: TermsContentEn, ka: TermsContentKa, ru: TermsContentRu },
  privacy: { en: PrivacyContentEn, ka: PrivacyContentKa, ru: PrivacyContentRu },
  refund: { en: RefundContentEn, ka: RefundContentKa, ru: RefundContentRu },
};

const TITLE_KEYS: Record<LegalPageType, string> = {
  terms: 'legal.terms_title',
  privacy: 'legal.privacy_title',
  refund: 'legal.refund_title',
};

export function LegalPageContent({ pageType }: LegalPageContentProps): React.ReactElement {
  const { language, t } = useLanguage();

  const contentFn = CONTENT_MAP[pageType][language] ?? CONTENT_MAP[pageType].en;
  const content = contentFn();

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t(TITLE_KEYS[pageType])}
        </h1>
        <p className="mb-10 text-sm text-muted-foreground">
          {t('legal.effective_date')}
        </p>
        <div className="legal-content space-y-4 text-foreground/90 leading-relaxed [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-1 [&_li]:text-foreground/80 [&_p]:text-foreground/80">
          {content}
        </div>
      </div>
    </div>
  );
}

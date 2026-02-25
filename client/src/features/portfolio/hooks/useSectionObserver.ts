'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { BuilderSection } from '../types/builder.types';

const SECTION_IDS: BuilderSection[] = ['about', 'services', 'gallery', 'preview'];

/** Offset from viewport top to consider as the "active" line (px). */
const ACTIVE_OFFSET = 120;

export function useSectionObserver(): {
    activeSection: BuilderSection;
    scrollToSection: (id: BuilderSection) => void;
} {
    const [activeSection, setActiveSection] = useState<BuilderSection>('about');
    const isScrollingRef = useRef(false);
    const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const detectSection = (): void => {
            if (isScrollingRef.current) return;

            let current: BuilderSection = SECTION_IDS[0];

            for (const id of SECTION_IDS) {
                const el = document.getElementById(id);
                if (!el) continue;
                const top = el.getBoundingClientRect().top;
                // Pick the last section whose top has scrolled past the offset line
                if (top <= ACTIVE_OFFSET) {
                    current = id;
                }
            }

            setActiveSection(current);
        };

        window.addEventListener('scroll', detectSection, { passive: true });
        // Run once on mount to set initial state
        detectSection();

        return () => window.removeEventListener('scroll', detectSection);
    }, []);

    const scrollToSection = useCallback((id: BuilderSection): void => {
        const el = document.getElementById(id);
        if (!el) return;

        // Immediately set active section on click
        setActiveSection(id);

        // Pause the scroll listener so it doesn't fight the smooth scroll
        isScrollingRef.current = true;
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);

        el.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Re-enable scroll detection after scroll settles
        scrollTimerRef.current = setTimeout(() => {
            isScrollingRef.current = false;
        }, 800);
    }, []);

    return { activeSection, scrollToSection };
}

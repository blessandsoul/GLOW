'use client';

import { FacebookLogo, InstagramLogo } from '@phosphor-icons/react';
import { APP_NAME } from '@/lib/constants/app.constants';

const SOCIAL_LINKS = [
    {
        name: 'Facebook',
        href: 'https://www.facebook.com/www.glow.ge',
        icon: FacebookLogo,
    },
    {
        name: 'Instagram',
        href: 'https://www.instagram.com/www_glow_ge/',
        icon: InstagramLogo,
    },
] as const;

export function Footer(): React.ReactElement {
    return (
        <footer className="hidden border-t border-border/50 bg-background py-8 md:block">
            <div className="container mx-auto flex flex-col items-center gap-4 px-4 md:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    {SOCIAL_LINKS.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={link.name}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/10 hover:text-primary hover:shadow-sm"
                        >
                            <link.icon size={18} weight="regular" />
                        </a>
                    ))}
                </div>

                <p className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
                </p>
            </div>
        </footer>
    );
}

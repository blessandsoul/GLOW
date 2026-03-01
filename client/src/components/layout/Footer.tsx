import Script from 'next/script';

import { APP_NAME } from '@/lib/constants/app.constants';

export function Footer(): React.ReactElement {
    return (
        <footer className="hidden border-t border-border/50 bg-background py-8 md:block">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground md:px-6 lg:px-8">
                <p>
                    &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
                </p>
                {/* TOP.GE ASYNC COUNTER CODE */}
                <div id="top-ge-counter-container" data-site-id="118567"></div>
                <Script async src="//counter.top.ge/counter.js" strategy="afterInteractive" />
                {/* / END OF TOP.GE COUNTER CODE */}
            </div>
        </footer>
    );
}
